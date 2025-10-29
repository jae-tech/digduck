import { ChromiumBrowserManager } from "@/automation/browser/chromium-browser-manager";
import { StealthPageFactory } from "@/automation/browser/stealth-page-factory";
import { Page } from "playwright";
import { JSDOM } from "jsdom";
import {
  CrawlOptions,
  CrawlResultItem,
  CrawlProgressCallback,
} from "@/services/crawlers/base-crawler";
import { CrawlSettings } from "@/types/crawl.types";

export interface NaverBlogPost {
  title: string;
  content?: string;
  author?: string;
  publishDate: Date;
  url: string;
  viewCount?: number;
  commentCount?: number;
  likeCount?: number;
  tags?: string[];
  category?: string;
  thumbnailUrl?: string;
}

export interface NaverBlogCategory {
  categoryNo: number;
  name: string;
  parentCategoryNo?: number;
  depth: number;
  postCount?: number;
  isOpen?: boolean;
}

export class NaverBlogCrawler {
  private browserManager: ChromiumBrowserManager | null = null;
  private stealthPageFactory: StealthPageFactory | null = null;
  private currentBlogId: string = "";

  constructor() {}

  /**
   * 네이버 블로그 크롤링 실행
   */
  async crawlNaverBlog(
    searchUrl: string,
    options: CrawlOptions & CrawlSettings,
    callback?: CrawlProgressCallback
  ): Promise<CrawlResultItem[]> {
    const urlInfo = this.parseNaverBlogUrl(searchUrl);

    if (!urlInfo.isValid) {
      throw new Error("Invalid Naver Blog URL");
    }

    try {
      await this.initializeBrowser();

      callback?.onProgress?.({
        currentPage: 0,
        totalPages: 0,
        itemsFound: 0,
        itemsCrawled: 0,
        message: "네이버 블로그 크롤링 시작",
      });

      // 카테고리 크롤링
      if (urlInfo.isCategory) {
        return await this.crawlNaverCategory(searchUrl, options, callback);
      }

      // 블로그 메인 크롤링
      return await this.crawlNaverBlogMain(searchUrl, options, callback);
    } finally {
      await this.cleanup();
    }
  }

  private async initializeBrowser() {
    if (!this.browserManager) {
      this.browserManager = new ChromiumBrowserManager();
      await this.browserManager.initializeBrowser();
      this.stealthPageFactory = new StealthPageFactory(this.browserManager);
    }
  }

  private async cleanup(): Promise<void> {
    if (this.browserManager) {
      await this.browserManager.cleanup();
      this.browserManager = null;
      this.stealthPageFactory = null;
    }
  }

  private parseNaverBlogUrl(url: string): {
    isValid: boolean;
    blogId?: string;
    postId?: string;
    categoryNo?: number;
    isCategory?: boolean;
    isBlogMain?: boolean;
  } {
    try {
      const urlObj = new URL(url);

      if (!urlObj.hostname.includes("blog.naver.com")) {
        return { isValid: false };
      }

      const blogId = urlObj.searchParams.get("blogId");

      if (blogId) {
        const categoryNo = urlObj.searchParams.get("categoryNo");
        return {
          isValid: true,
          blogId,
          categoryNo: parseInt(categoryNo || "0"),
          isCategory: !!categoryNo,
        };
      }

      const pathParts = urlObj.pathname.split("/").filter(Boolean);

      if (pathParts.length >= 2) {
        return {
          isValid: true,
          blogId: pathParts[0],
          postId: pathParts[1],
        };
      }

      if (pathParts.length === 1) {
        return {
          isValid: true,
          blogId: pathParts[0],
          isBlogMain: true,
        };
      }

      return { isValid: false };
    } catch {
      return { isValid: false };
    }
  }

  private async crawlNaverCategory(
    url: string,
    options: CrawlOptions & CrawlSettings,
    callback?: CrawlProgressCallback
  ): Promise<CrawlResultItem[]> {
    if (!this.stealthPageFactory) throw new Error("Browser not initialized");

    const results: CrawlResultItem[] = [];
    const maxPages = options.maxPages || 10;
    const maxItems = options.maxItems || 100;
    let currentPage = 1;

    const page = await this.stealthPageFactory.createStealthPage();

    try {
      while (
        currentPage <= maxPages &&
        results.length < maxItems &&
        !(options as any).shouldStop?.()
      ) {
        try {
          callback?.onProgress?.({
            currentPage,
            totalPages: maxPages,
            itemsFound: results.length,
            itemsCrawled: results.length,
            message: `카테고리 ${currentPage}페이지 처리중`,
          });

          const pageUrl = this.buildNaverCategoryPageUrl(url, currentPage);
          await this.stealthPageFactory.navigateWithStealth(page, pageUrl);
          await this.stealthPageFactory.randomDelay(2000, 3000);

          const posts = await this.parseNaverPostListFromPage(page);

          if (posts.length === 0) break;

          for (let i = 0; i < posts.length && results.length < maxItems; i++) {
            const item = this.convertNaverPostToItem(
              posts[i],
              results.length + 1,
              currentPage
            );
            results.push(item);
            callback?.onItem?.(item);
          }

          currentPage++;
        } catch (error) {
          console.error(`페이지 ${currentPage} 크롤링 중 오류 발생:`, error);
          callback?.onError?.(error as Error);
          currentPage++;
          continue;
        }
      }

      callback?.onProgress?.({
        currentPage: currentPage - 1,
        totalPages: maxPages,
        itemsFound: results.length,
        itemsCrawled: results.length,
        message: `완료: ${results.length}개 포스트`,
      });

      return results;
    } finally {
      await page.close();
    }
  }

  private async crawlNaverBlogMain(
    url: string,
    options: CrawlOptions & CrawlSettings,
    callback?: CrawlProgressCallback
  ): Promise<CrawlResultItem[]> {
    const urlInfo = this.parseNaverBlogUrl(url);
    if (!urlInfo.blogId) throw new Error("Blog ID not found");

    // blogId 저장
    this.currentBlogId = urlInfo.blogId;

    const results: CrawlResultItem[] = [];
    const maxItems = options.maxItems || 1000;
    let currentPage = 1;

    await this.initializeBrowser();
    if (!this.stealthPageFactory) throw new Error("Browser not initialized");

    const page = await this.stealthPageFactory.createStealthPage();

    try {
      // 네트워크 응답 가로채기 설정 (페이지 로드 전에 먼저 설정)
      const networkData: any[] = [];
      let networkDataReceived = false;

      page.on("response", async (response) => {
        const url = response.url();

        if (url.includes("PostViewBottomTitleListAsync.naver")) {
          try {
            const responseText = await response.text();
            const jsonData = JSON.parse(responseText);

            // postList가 있는지 확인하고 배열인지 체크
            if (jsonData.postList && Array.isArray(jsonData.postList)) {
              networkData.push(jsonData.postList);
              networkDataReceived = true;
              console.log(
                "네트워크 데이터 캐치 성공:",
                jsonData.postList.length,
                "개"
              );
            }
          } catch (error) {
            console.error("네트워크 응답 파싱 오류:", error);
          }
        }
      });

      // 이제 페이지 로드
      await this.stealthPageFactory.navigateWithStealth(page, url);
      await page.waitForLoadState("networkidle");
      await this.stealthPageFactory.randomDelay(1000, 2000);

      // 전체 포스팅 개수만 가져오기 (카테고리 검색 없이)
      const postCount = await this.getTotalPostCount(page);
      const maxPages = Math.min(
        Math.ceil(postCount / 5),
        options.maxPages || 50
      );

      callback?.onProgress?.({
        currentPage: 0,
        totalPages: maxPages,
        itemsFound: 0,
        itemsCrawled: 0,
        message: `${postCount}개 게시글 발견`,
      });

      // 첫 페이지에서 네트워크 요청을 트리거하기 위해 스크롤 또는 액션 수행
      console.log("첫 페이지 네트워크 요청 트리거 시도");
      await page.evaluate(() => {
        // 페이지 하단으로 스크롤하여 AJAX 요청 유도
        window.scrollTo(0, document.body.scrollHeight);
      });
      await this.stealthPageFactory.randomDelay(2000, 3000);

      while (
        currentPage <= maxPages &&
        results.length < maxItems &&
        !(options as any).shouldStop?.()
      ) {
        try {
          callback?.onProgress?.({
            currentPage,
            totalPages: maxPages,
            itemsFound: results.length,
            itemsCrawled: results.length,
            message: `${currentPage}페이지 처리중`,
          });

          // 네트워크 데이터 대기 (최대 10초)
          let waitCount = 0;
          while (!networkDataReceived && waitCount < 20) {
            await this.stealthPageFactory.randomDelay(500, 500);
            waitCount++;
          }

          // 네트워크 데이터에서 포스트 추출 (우선순위)
          if (networkData.length > 0) {
            const latestData = networkData[networkData.length - 1];
            console.log(
              "네트워크 데이터 처리:",
              latestData.length,
              "개 포스트"
            );

            const posts = this.parsePostsFromNetworkData(
              latestData,
              currentPage
            );

            for (
              let i = 0;
              i < posts.length && results.length < maxItems;
              i++
            ) {
              results.push(posts[i]);
              callback?.onItem?.(posts[i]);
            }

            // 사용한 데이터 제거
            networkData.pop();
            networkDataReceived = false;
          } else {
            console.log("네트워크 데이터 없음, DOM 파싱 사용");
            // 폴백: DOM에서 포스트 데이터 추출
            const posts = await this.parseNaverPostListFromPage(page);

            if (posts.length === 0) break;

            // 포스트 데이터를 결과에 추가
            for (
              let i = 0;
              i < posts.length && results.length < maxItems;
              i++
            ) {
              const item = this.convertNaverPostToItem(
                posts[i],
                results.length + 1,
                currentPage
              );
              results.push(item);
              callback?.onItem?.(item);
            }
          }

          // 다음 페이지로 이동
          if (currentPage < maxPages) {
            const hasNext = await this.navigateToNextPage(page);
            if (!hasNext) break;
          }

          currentPage++;
        } catch (error) {
          console.error(`페이지 ${currentPage} 크롤링 중 오류 발생:`, error);
          callback?.onError?.(error as Error);
          currentPage++;
          continue;
        }
      }

      callback?.onProgress?.({
        currentPage: currentPage - 1,
        totalPages: maxPages,
        itemsFound: results.length,
        itemsCrawled: results.length,
        message: `완료: ${results.length}개 포스트`,
      });

      return results;
    } catch (error) {
      callback?.onError?.(error as Error);
      return results;
    } finally {
      await page.close();
    }
  }

  /**
   * 블로그의 전체 포스팅 개수만 가져오기
   */
  private async getTotalPostCount(page: Page): Promise<number> {
    try {
      await page.waitForLoadState("networkidle");

      const html = await page.content();
      const dom = new JSDOM(html);
      const document = dom.window.document;

      // 전체 포스팅 개수 추출 (여러 셀렉터 시도)
      const totalSelectors = [".category_title.pcol2"];

      for (const selector of totalSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          const text = element.textContent || "";
          const count = parseInt(text.replace(/[^0-9]/g, ""));
          if (!isNaN(count) && count > 0) {
            return count;
          }
        }
      }

      return 0;
    } catch (error) {
      console.error(`블로그 총 포스트 수 조회 중 오류 발생: ${error}`);
      return 0;
    }
  }

  public async getNaverBlogCategories(
    blogId: string
  ): Promise<NaverBlogCategory[]> {
    try {
      await this.initializeBrowser();
      if (!this.stealthPageFactory) throw new Error("Browser not initialized");

      const page = await this.stealthPageFactory.createStealthPage();

      try {
        // PostList 페이지로 직접 접근
        const blogUrl = `https://blog.naver.com/PostList.naver?blogId=${blogId}&widgetTypeCall=true&noTrackingCode=true&directAccess=true`;
        await this.stealthPageFactory.navigateWithStealth(page, blogUrl);

        // 네트워크 아이들 상태까지 대기
        await page.waitForLoadState("networkidle");
        await this.stealthPageFactory.randomDelay(1000, 2000);

        // 카테고리 목록이 로드될 때까지 대기
        await page.waitForSelector("#category-list", { timeout: 10000 });

        const html = await page.content();

        // HTML 추출 후 파싱 함수 사용
        const categories = this.parseNaverBlogCategories(html);

        return categories;
      } finally {
        await page.close();
      }
    } catch (error) {
      console.error(`블로그 ${blogId}의 카테고리 조회 중 오류 발생:`, error);
      return [];
    } finally {
      await this.cleanup();
    }
  }

  private parseNaverBlogCategories(html: string): NaverBlogCategory[] {
    const dom = new JSDOM(html);
    const document = dom.window.document;
    const results: NaverBlogCategory[] = [];

    const categoryElements = document.querySelectorAll(
      '#category-list a[id^="category"]'
    );

    categoryElements.forEach((element) => {
      const href = element.getAttribute("href") || "";
      const text = element.textContent?.trim() || "";

      const categoryNoMatch = href.match(/categoryNo=(\\d+)/);
      if (!categoryNoMatch) return;

      const categoryNo = parseInt(categoryNoMatch[1]);
      const name = text.replace(/\\(\\d+\\)/, "").trim();

      const postCountRaw =
        element.querySelector(".num.cm-col1")?.textContent || "0";
      const postCount =
        postCountRaw.replace(/[()]/g, "").replace(/\\D/g, "") || "0";

      const isSubCategory = element.closest("li.depth2") !== null;
      const depth = isSubCategory ? 2 : 1;

      if (categoryNo > 0) {
        results.push({
          categoryNo,
          name,
          postCount: Number(postCount),
          depth,
        });
      }
    });

    return results;
  }

  /**
   * 네이버 블로그 포스트 목록 페이지에서 포스트 데이터를 추출합니다.
   * @param page - Playwright 페이지 객체
   * @returns 네이버 블로그 포스트 배열
   */
  private async parseNaverPostListFromPage(
    page: Page
  ): Promise<NaverBlogPost[]> {
    return await page.evaluate(() => {
      const results: NaverBlogPost[] = [];
      
      // 네이버 블로그 포스트 목록 메인 셀렉터
      const postSelector = "#postBottomTitleListBody tr";

      // 포스트 링크 요소들을 선택
      const postLinks = document.querySelectorAll(postSelector);

      // 포스트가 없으면 빈 배열 반환
      if (postLinks.length < 1) return results;

      // 각 포스트 링크를 순회하며 데이터 추출
      postLinks.forEach((link) => {
        const href = link.getAttribute("href");
        let title = "";

        // 제목 추출 (.title 클래스 또는 링크 자체에서)
        const titleElement = link.querySelector(".title") || link;
        title = titleElement.textContent?.trim() || "";

        // 댓글 수 추출 (.meta_data .num.pcol3에서)
        const commentCount = parseInt(
          link
            .querySelector(".meta_data .num.pcol3")
            ?.textContent.replace(/[()]/g, "") || "0"
        );

        // 유효한 포스트인지 확인 (href, title 존재하고 실제 포스트 링크인지)
        if (href && title && href.includes("/")) {
          // 전체 URL 생성 (상대 경로면 blog.naver.com 추가)
          const fullUrl = href.startsWith("http")
            ? href
            : `https://blog.naver.com${href}`;

          // URL이 PostList가 아닌 실제 포스트 링크인지 확인
          const urlParts = href.split("/").filter(Boolean);
          if (urlParts.length >= 2 && !href.includes("PostList")) {
            results.push({
              title,
              publishDate: new Date(),
              url: fullUrl,
              commentCount,
            });
          }
        }
      });

      return results;
    });
  }

  private convertNaverPostToItem(
    post: NaverBlogPost,
    itemOrder: number,
    pageNumber: number
  ): CrawlResultItem {
    return {
      title: post.title,
      content: post.content,
      url: post.url,
      itemOrder,
      pageNumber,
      siteSpecificData: {
        author: post.author,
        publishDate: post.publishDate.toISOString(),
        viewCount: post.viewCount,
        commentCount: post.commentCount,
        tags: post.tags,
        category: post.category,
        thumbnailUrl: post.thumbnailUrl,
      },
    };
  }

  private buildNaverCategoryPageUrl(
    baseUrl: string,
    pageNumber: number
  ): string {
    const url = new URL(baseUrl);
    const startIndex = (pageNumber - 1) * 5 + 1;
    url.searchParams.set("currentPage", pageNumber.toString());
    url.searchParams.set("startIndex", startIndex.toString());
    return url.toString();
  }

  /**
   * 네이버 블로그 다음 페이지로 이동
   * @param page - Playwright 페이지 객체
   * @returns 다음 페이지로 이동 성공 여부
   */
  private async navigateToNextPage(page: Page): Promise<boolean> {
    try {
      // 다음 페이지 버튼 확인 (_next_category 클래스가 있어야 활성 상태)
      const nextButtonSelector =
        "#postBottomTitleListNavigation .next.pcol2._next_category";
      const nextButton = await page.$(nextButtonSelector);

      if (!nextButton) {
        console.log("다음 페이지가 없습니다 (_next_category 클래스 없음)");
        return false;
      }

      // 다음 페이지 버튼 클릭
      await nextButton.click();

      // 페이지 로드 대기
      await page.waitForLoadState("networkidle", { timeout: 10000 });
      await this.stealthPageFactory?.randomDelay(1500, 2500);

      console.log("다음 페이지로 이동 완료");
      return true;
    } catch (error) {
      console.error("다음 페이지 이동 중 오류:", error);
      return false;
    }
  }

  /**
   * 네트워크에서 받은 데이터를 파싱하여 CrawlResultItem 배열로 변환
   * @param networkData - PostViewBottomTitleListAsync.naver 응답 데이터 (배열)
   * @param pageNumber - 현재 페이지 번호
   * @returns CrawlResultItem 배열
   */
  private parsePostsFromNetworkData(
    networkData: any[],
    pageNumber: number
  ): CrawlResultItem[] {
    const results: CrawlResultItem[] = [];

    try {
      // 배열 형태의 포스트 데이터 처리
      networkData.forEach((post: any, index: number) => {
        try {
          // filteredEncodedTitle 디코딩
          const decodedTitle = post.filteredEncodedTitle
            ? decodeURIComponent(post.filteredEncodedTitle)
            : "";

          // 포스트 URL 생성 (blogId는 별도로 전달받아야 함)
          const postUrl = `https://blog.naver.com/PostView.naver?blogId=${this.currentBlogId}&logNo=${post.logNo}`;

          const item: CrawlResultItem = {
            title: decodedTitle,
            url: postUrl,
            itemOrder: (pageNumber - 1) * 5 + index + 1,
            pageNumber,
            siteSpecificData: {
              logNo: post.logNo,
              blogId: this.currentBlogId,
              publishDate: post.addDate,
              commentCount: post.commentCount || 0,
              openType: post.openType,
              filteredEncodedTitle: post.filteredEncodedTitle,
            },
          };

          results.push(item);
        } catch (error) {
          console.error("포스트 파싱 오류:", error);
        }
      });
    } catch (error) {
      console.error("네트워크 데이터 파싱 오류:", error);
    }

    return results;
  }
}