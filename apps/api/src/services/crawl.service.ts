import { ChromiumBrowserManager } from "@/automation/browser/chromium-browser-manager";
import { StealthPageFactory } from "@/automation/browser/stealth-page-factory";
import { NaverAuthenticationService } from "@/automation/services/naver-authentication-service";
import {
  ProductReview,
  ReviewSortOrder,
  CrawlProgressData,
  ProgressCallback,
} from "@/automation/types/crawler-types";
import { Page } from "playwright";
import { env } from "@/config/env";

export class CrawlService {
  private browserManager: ChromiumBrowserManager | null = null;
  private stealthPageFactory: StealthPageFactory | null = null;

  constructor() {
    // 브라우저 인스턴스는 필요할 때 초기화
  }

  private async initializeBrowser() {
    if (!this.browserManager) {
      this.browserManager = new ChromiumBrowserManager({
        headless: false, // API에서는 headless 모드 사용
        maxConcurrentPages: 2,
      });
      this.stealthPageFactory = new StealthPageFactory(this.browserManager);
    }
    return {
      browserManager: this.browserManager,
      stealthPageFactory: this.stealthPageFactory,
    };
  }

  async crawlProduct(url: string) {
    // 상품 정보 크롤링 구현 예정
    throw new Error("Product crawling not implemented yet");
  }

  private async crawlProductReviews(
    page: Page,
    stealthPageFactory: StealthPageFactory,
    sortOrder: ReviewSortOrder = "latest",
    maxReviews: number = 50
  ): Promise<ProductReview[]> {
    const reviews: ProductReview[] = [];

    try {
      // 리뷰 탭으로 이동
      const reviewTabSelectors = [
        'a[href*="review"]',
        'button:has-text("리뷰")',
        '[data-testid*="review"]',
        ".review-tab",
        'a:has-text("리뷰")',
      ];

      let reviewTabFound = false;
      for (const selector of reviewTabSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          await page.click(selector);
          reviewTabFound = true;
          break;
        } catch {
          continue;
        }
      }

      // 리뷰 로드 대기
      await stealthPageFactory.randomDelay(2000, 4000);

      // 정렬 옵션 설정
      await this.setReviewSortOrder(page, sortOrder, stealthPageFactory);

      // 네이버 스마트스토어 리뷰 섹션 찾기
      await page.waitForSelector('li[data-shp-contents-type="review"]', {
        timeout: 10000,
      });

      const reviewItems = page.locator('li[data-shp-contents-type="review"]');
      const reviewCount = await reviewItems.count();

      const maxToProcess = Math.min(reviewCount, maxReviews);

      for (let i = 0; i < maxToProcess; i++) {
        try {
          const review = reviewItems.nth(i);

          // 평점 추출
          let rating = 0;
          try {
            const ratingElements = review
              .locator("em")
              .filter({ hasText: /^[1-5]$/ });
            const ratingCount = await ratingElements.count();
            if (ratingCount > 0) {
              const ratingText = await ratingElements.first().innerText();
              rating = parseInt(ratingText) || 0;
            }
          } catch {}

          // 작성자 추출
          let author = "익명";
          try {
            const authorElements = review.locator("strong").first();
            const authorCount = await authorElements.count();
            if (authorCount > 0) {
              author = await authorElements.innerText();
            }
          } catch {}

          // 날짜 추출
          let date = new Date().toISOString().split("T")[0];
          try {
            const dateElements = review
              .locator("span")
              .filter({ hasText: /\d{2}\.\d{2}\.\d{2}\./ });
            const dateCount = await dateElements.count();
            if (dateCount > 0) {
              date = await dateElements.first().innerText();
            }
          } catch {}

          // 리뷰 텍스트 추출
          let content = "";
          try {
            const textElements = review
              .locator("span")
              .filter({ hasText: /.{20,}/ });
            const textElementsCount = await textElements.count();

            for (let j = 0; j < textElementsCount; j++) {
              const text = await textElements.nth(j).innerText();
              const cleanText = text.trim();

              const excludeWords = ["평점", "신고", "도움", "더보기"];
              const isReviewText =
                cleanText.length > 20 &&
                !excludeWords.some((word) => cleanText.includes(word)) &&
                !cleanText.match(/^\d{2}\.\d{2}\.\d{2}\.$$/);

              if (isReviewText) {
                content = cleanText;
                break;
              }
            }
          } catch {}

          // 유효한 데이터가 있을 때만 저장
          if (rating || author !== "익명" || content) {
            reviews.push({
              id: `${Date.now()}-${i}`,
              rating,
              author,
              content,
              date,
              helpfulCount: 0,
            });
          }

          await stealthPageFactory.randomDelay(100, 300);
        } catch (error) {
          console.log(`⚠️ 리뷰 ${i + 1} 추출 중 오류:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error("❌ Review crawling failed:", error);
    }

    return reviews;
  }

  private async scrollToPagination(
    page: Page,
    stealthPageFactory: StealthPageFactory
  ): Promise<void> {
    try {
      // 페이지네이션 영역 찾기
      const paginationSelector = 'div[data-shp-area="revlist.pgn"]';
      
      // 페이지네이션이 보일 때까지 스크롤
      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          const scrollStep = 500;
          const maxScrolls = 10;
          let scrollCount = 0;
          
          const scrollInterval = setInterval(() => {
            const paginationElement = document.querySelector('div[data-shp-area="revlist.pgn"]');
            
            if (paginationElement) {
              // 페이지네이션 요소를 화면 중앙으로 스크롤
              paginationElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
              });
              clearInterval(scrollInterval);
              resolve();
              return;
            }
            
            if (scrollCount >= maxScrolls) {
              clearInterval(scrollInterval);
              resolve();
              return;
            }
            
            window.scrollBy(0, scrollStep);
            scrollCount++;
          }, 300);
        });
      });
      
      // 스크롤 완료 후 안정화 대기
      await stealthPageFactory.randomDelay(1000, 2000);
      
      // 페이지네이션 영역이 보이는지 확인
      const paginationVisible = await page.locator(paginationSelector).isVisible();
      if (paginationVisible) {
        console.log("✅ Pagination area is now visible");
      } else {
        console.log("⚠️ Pagination area not found, continuing anyway");
      }
      
    } catch (error) {
      console.log("⚠️ Failed to scroll to pagination:", error);
    }
  }

  private async setReviewSortOrder(
    page: Page,
    sortOrder: ReviewSortOrder,
    stealthPageFactory: StealthPageFactory
  ): Promise<void> {
    try {
      const sortUl = page.locator(
        'ul[data-shp-inventory="revlist"][data-shp-area="revlist.sort"]'
      );
      const sortUlCount = await sortUl.count();

      if (sortUlCount === 0) {
        return;
      }

      const sortTextMap: Record<ReviewSortOrder, string> = {
        ranking: "랭킹순",
        latest: "최신순",
        "high-rating": "평점 높은순",
        "low-rating": "평점 낮은순",
      };

      const targetSortText = sortTextMap[sortOrder];
      if (!targetSortText) return;

      const sortItems = sortUl.locator('li a[role="radio"]');
      const sortItemsCount = await sortItems.count();

      for (let i = 0; i < sortItemsCount; i++) {
        const item = sortItems.nth(i);
        const text = await item.innerText();
        const isChecked = (await item.getAttribute("aria-checked")) === "true";

        if (text.trim() === targetSortText && !isChecked) {
          await item.click();
          await stealthPageFactory.randomDelay(2000, 3000);
          return;
        } else if (text.trim() === targetSortText && isChecked) {
          return;
        }
      }
    } catch (error) {
      console.log("⚠️ Failed to set sort order:", error);
    }
  }

  async cleanup() {
    if (this.browserManager) {
      await this.browserManager.cleanup();
      this.browserManager = null;
      this.stealthPageFactory = null;
    }
  }

  async crawlReviews(
    url: string,
    sortOrder: ReviewSortOrder = "latest",
    maxReviews: number = 50
  ) {
    // 기존 단일 요청용 메서드 (하위 호환성 유지)
    return this.crawlReviewsWithProgress(url, sortOrder, maxReviews, () => {});
  }

  async crawlReviewsWithProgress(
    url: string,
    sortOrder: ReviewSortOrder = "latest",
    maxPages: number = 5,
    onProgress: ProgressCallback
  ) {
    const { browserManager, stealthPageFactory } =
      await this.initializeBrowser();
    const startTime = Date.now();
    let allReviews: ProductReview[] = [];

    try {
      // 스텔스 페이지 생성
      const page = await stealthPageFactory.createStealthPage();

      // 인증이 필요한 경우
      if (env.NAVER_LOGIN_ID && env.NAVER_LOGIN_PASSWORD) {
        // 로그인 시작 진행상황 전송
        onProgress({
          totalReviews: 0,
          crawledReviews: 0,
          currentPage: 0,
          estimatedTotalPages: 0,
          elapsedTime: Date.now() - startTime,
          status: "logging_in",
          message: "네이버 로그인 중..."
        });

        await stealthPageFactory.navigateWithStealth(
          page,
          "https://www.naver.com"
        );

        const authService = new NaverAuthenticationService({
          username: env.NAVER_LOGIN_ID,
          password: env.NAVER_LOGIN_PASSWORD,
        });

        await authService.performAuthentication(page);
        
        // 로그인 완료 진행상황 전송
        onProgress({
          totalReviews: 0,
          crawledReviews: 0,
          currentPage: 0,
          estimatedTotalPages: 0,
          elapsedTime: Date.now() - startTime,
          status: "logged_in",
          message: "네이버 로그인 완료"
        });
      }

      // 상품 페이지로 이동
      onProgress({
        totalReviews: 0,
        crawledReviews: 0,
        currentPage: 0,
        estimatedTotalPages: 0,
        elapsedTime: Date.now() - startTime,
        status: "navigating",
        message: "상품 페이지로 이동 중..."
      });
      
      await stealthPageFactory.navigateWithStealth(page, url);
      
      // 페이지 로드 후 캡챠 체크
      await this.checkForCaptcha(page);

      // 리뷰 크롤링 실행 (페이지별 처리)
      const result = await this.crawlProductReviewsByPages(
        page,
        stealthPageFactory,
        sortOrder,
        maxPages,
        onProgress,
        startTime
      );

      await page.close();

      return result;
    } catch (error) {
      console.error("❌ Review crawling failed:", error);
      
      // 캡챠 감지로 인한 에러인 경우 이미 브라우저가 종료되었을 수 있음
      if (error instanceof Error && error.message.includes('캡챠가 감지되어')) {
        // 캡챠 에러는 그대로 전달
        throw error;
      } else {
        // 다른 에러의 경우 브라우저 정리 후 에러 전달
        try {
          if (this.browserManager) {
            await this.browserManager.cleanup();
            this.browserManager = null;
            this.stealthPageFactory = null;
          }
        } catch (cleanupError) {
          console.error('Failed to cleanup browser after error:', cleanupError);
        }
        
        throw new Error(
          `Failed to crawl reviews: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    } finally {
      // 브라우저 정리는 선택적 (재사용을 위해)
      // await browserManager.cleanup();
    }
  }

  private async crawlProductReviewsByPages(
    page: Page,
    stealthPageFactory: StealthPageFactory,
    sortOrder: ReviewSortOrder = "latest",
    maxPages: number = 5,
    onProgress: ProgressCallback,
    startTime: number
  ) {
    const allReviews: ProductReview[] = [];
    let currentPage = 1;
    let estimatedTotalPages = maxPages;
    let totalReviews = 0;

    try {
      // 리뷰 탭 클릭 진행상황
      onProgress({
        totalReviews: 0,
        crawledReviews: 0,
        currentPage: 1,
        estimatedTotalPages: maxPages,
        elapsedTime: Date.now() - startTime,
        status: "finding_reviews",
        message: "리뷰 탭 찾는 중..."
      });

      // 리뷰 탭으로 이동
      const reviewTabSelectors = [
        'a[href*="review"]',
        'button:has-text("리뷰")',
        '[data-testid*="review"]',
        ".review-tab",
        'a:has-text("리뷰")',
      ];

      let reviewTabFound = false;
      for (const selector of reviewTabSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 3000 });
          await page.click(selector);
          reviewTabFound = true;
          break;
        } catch {
          continue;
        }
      }

      // 리뷰 로드 대기
      onProgress({
        totalReviews: 0,
        crawledReviews: 0,
        currentPage: 1,
        estimatedTotalPages: maxPages,
        elapsedTime: Date.now() - startTime,
        status: "loading_reviews",
        message: "리뷰 데이터 로드 중..."
      });
      
      await stealthPageFactory.randomDelay(2000, 4000);

      // 리뷰 로드 후 캡챠 체크
      await this.checkForCaptcha(page);

      // 페이지네이션 영역까지 스크롤
      onProgress({
        totalReviews: 0,
        crawledReviews: 0,
        currentPage: 1,
        estimatedTotalPages: maxPages,
        elapsedTime: Date.now() - startTime,
        status: "scrolling",
        message: "페이지네이션 영역으로 스크롤 중..."
      });
      
      await this.scrollToPagination(page, stealthPageFactory);

      // 정렬 옵션 설정
      onProgress({
        totalReviews: 0,
        crawledReviews: 0,
        currentPage: 1,
        estimatedTotalPages: maxPages,
        elapsedTime: Date.now() - startTime,
        status: "setting_sort",
        message: "정렬 옵션 설정 중..."
      });
      
      await this.setReviewSortOrder(page, sortOrder, stealthPageFactory);

      // 총 리뷰 수 추출
      try {
        const reviewCountElement = page.locator(
          '[class*="count"], .total-count, [data-testid*="count"]'
        );
        const reviewCountText = await reviewCountElement.first().textContent();
        if (reviewCountText) {
          const match = reviewCountText.match(/(\d+)/);
          if (match) {
            totalReviews = parseInt(match[1]);
            estimatedTotalPages = Math.ceil(totalReviews / 20); // 한 페이지당 약 20개 리뷰
          }
        }
      } catch {
        // 총 리뷰 수를 못 구하면 기본값 사용
      }

      // 페이지별 크롤링
      for (
        let pageNum = 1;
        pageNum <= Math.min(maxPages, estimatedTotalPages);
        pageNum++
      ) {
        currentPage = pageNum;
        const elapsedTime = Date.now() - startTime;

        // 진행상황 업데이트
        onProgress({
          totalReviews,
          crawledReviews: allReviews.length,
          currentPage,
          estimatedTotalPages: Math.min(maxPages, estimatedTotalPages),
          elapsedTime,
        });

        // 첫 페이지가 아닌 경우 페이지 이동
        if (pageNum > 1) {
          // 페이지 이동 진행상황
          onProgress({
            totalReviews,
            crawledReviews: allReviews.length,
            currentPage: pageNum,
            estimatedTotalPages: Math.min(maxPages, estimatedTotalPages),
            elapsedTime: Date.now() - startTime,
            status: "navigating_page",
            message: `${pageNum} 페이지로 이동 중...`
          });
          
          // 페이지네이션 영역까지 스크롤 후 이동
          await this.scrollToPagination(page, stealthPageFactory);
          await this.navigateToNextPage(page, pageNum, stealthPageFactory);
        }

        // 현재 페이지의 리뷰 추출 시작
        onProgress({
          totalReviews,
          crawledReviews: allReviews.length,
          currentPage: pageNum,
          estimatedTotalPages: Math.min(maxPages, estimatedTotalPages),
          elapsedTime: Date.now() - startTime,
          status: "extracting_reviews",
          message: `${pageNum} 페이지 리뷰 추출 중...`
        });

        // 현재 페이지의 리뷰 추출
        const pageReviews = await this.extractReviewsFromCurrentPage(
          page,
          stealthPageFactory
        );
        allReviews.push(...pageReviews);

        // 페이지 완료 후 진행상황 업데이트
        onProgress({
          totalReviews,
          crawledReviews: allReviews.length,
          currentPage,
          estimatedTotalPages: Math.min(maxPages, estimatedTotalPages),
          elapsedTime: Date.now() - startTime,
        });

        // 다음 페이지가 없으면 중단
        const hasNextPage = await this.hasNextPage(page, pageNum);
        if (!hasNextPage) {
          estimatedTotalPages = pageNum;
          break;
        }

        // 페이지 간 딜레이
        await stealthPageFactory.randomDelay(2000, 4000);
      }

      return {
        reviews: allReviews,
        totalCount: allReviews.length,
        totalReviews,
        processedPages: currentPage,
        url: page.url(),
        sortOrder,
        crawledAt: new Date(),
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error("❌ Pages crawling failed:", error);
      throw error;
    }
  }

  private async navigateToNextPage(
    page: Page,
    pageNum: number,
    stealthPageFactory: StealthPageFactory
  ): Promise<void> {
    try {
      // 캡챠 감지
      await this.checkForCaptcha(page);

      // 네이버 스마트스토어 페이지네이션 구조에 맞춘 페이지 버튼 클릭
      const pageButton = page.locator(
        `div[data-shp-area="revlist.pgn"] a[role="menuitem"]:has-text("${pageNum}")`
      );

      if ((await pageButton.count()) > 0) {
        await pageButton.first().click();
        await page.waitForLoadState("networkidle", { timeout: 10000 });
        await stealthPageFactory.randomDelay(2000, 3000);
        
        // 페이지 이동 후 캡챠 재확인
        await this.checkForCaptcha(page);
      } else {
        // 다음 버튼 클릭 시도 (네이버 스마트스토어 구조)
        const nextButton = page.locator(
          'div[data-shp-area="revlist.pgn"] a:has-text("다음")'
        );
        if ((await nextButton.count()) > 0 && !(await nextButton.first().getAttribute('aria-hidden'))) {
          await nextButton.first().click();
          await page.waitForLoadState("networkidle", { timeout: 10000 });
          await stealthPageFactory.randomDelay(2000, 3000);
          
          // 페이지 이동 후 캡챠 재확인
          await this.checkForCaptcha(page);
        }
      }
    } catch (error) {
      console.log(`⚠️ Failed to navigate to page ${pageNum}:`, error);
      throw error;
    }
  }

  private async hasNextPage(page: Page, currentPage: number): Promise<boolean> {
    try {
      // 네이버 스마트스토어 페이지네이션 구조에 맞춘 다음 페이지 확인
      const nextPageNumber = currentPage + 1;
      
      // 다음 페이지 번호 버튼 확인
      const nextPageButton = page.locator(
        `div[data-shp-area="revlist.pgn"] a[role="menuitem"]:has-text("${nextPageNumber}")`
      );
      
      if ((await nextPageButton.count()) > 0) {
        return true;
      }
      
      // 다음 버튼 확인 (aria-hidden이 false인 경우만)
      const nextButton = page.locator('div[data-shp-area="revlist.pgn"] a:has-text("다음")');
      if ((await nextButton.count()) > 0) {
        const ariaHidden = await nextButton.first().getAttribute('aria-hidden');
        return ariaHidden !== 'true';
      }
      
      return false;
    } catch {
      return false;
    }
  }

  private async checkForCaptcha(page: Page): Promise<void> {
    const captchaSelectors = [
      '[id*="captcha"]',
      '[class*="captcha"]',
      'iframe[src*="captcha"]',
      '.nc_wrapper',
      '#nc_1_n1z',
      '[data-nc-idx]',
      '[class*="verify"]',
      '.robot-mag-wrap',
      '#robot_slider'
    ];

    for (const selector of captchaSelectors) {
      try {
        const captchaElement = await page.locator(selector).first();
        if (await captchaElement.isVisible().catch(() => false)) {
          console.log('🚫 Captcha detected, closing browser and stopping crawl...');
          
          // 브라우저 완전 종료
          try {
            const browser = page.context().browser();
            if (browser) {
              await browser.close();
            }
          } catch (browserError) {
            console.error('Failed to close browser:', browserError);
          }
          
          // 브라우저 매니저 정리
          if (this.browserManager) {
            try {
              await this.browserManager.cleanup();
              this.browserManager = null;
              this.stealthPageFactory = null;
            } catch (cleanupError) {
              console.error('Failed to cleanup browser manager:', cleanupError);
            }
          }
          
          throw new Error('캡챠가 감지되어 크롤링을 중단합니다. 잠시 후 다시 시도해주세요.');
        }
      } catch (error) {
        // 캡챠 에러인 경우 재throw, 아니면 무시
        if (error.message.includes('캡챠가 감지되어')) {
          throw error;
        }
      }
    }
  }

  private async extractReviewsFromCurrentPage(
    page: Page,
    stealthPageFactory: StealthPageFactory
  ): Promise<ProductReview[]> {
    const reviews: ProductReview[] = [];

    try {
      // 캡챠 감지
      await this.checkForCaptcha(page);

      // 네이버 스마트스토어 리뷰 섹션 찾기
      await page.waitForSelector('li[data-shp-contents-type="review"]', {
        timeout: 10000,
      });

      const reviewItems = page.locator('li[data-shp-contents-type="review"]');
      const reviewCount = await reviewItems.count();

      for (let i = 0; i < reviewCount; i++) {
        try {
          const review = reviewItems.nth(i);

          // 평점 추출
          let rating = 0;
          try {
            const ratingElements = review
              .locator("em")
              .filter({ hasText: /^[1-5]$/ });
            const ratingCount = await ratingElements.count();
            if (ratingCount > 0) {
              const ratingText = await ratingElements.first().innerText();
              rating = parseInt(ratingText) || 0;
            }
          } catch {}

          // 작성자 추출
          let author = "익명";
          try {
            const authorElements = review.locator("strong").first();
            const authorCount = await authorElements.count();
            if (authorCount > 0) {
              author = await authorElements.innerText();
            }
          } catch {}

          // 날짜 추출
          let date = new Date().toISOString().split("T")[0];
          try {
            const dateElements = review
              .locator("span")
              .filter({ hasText: /\d{2}\.\d{2}\.\d{2}\./ });
            const dateCount = await dateElements.count();
            if (dateCount > 0) {
              date = await dateElements.first().innerText();
            }
          } catch {}

          // 리뷰 텍스트 추출
          let content = "";
          try {
            const textElements = review
              .locator("span")
              .filter({ hasText: /.{20,}/ });
            const textElementsCount = await textElements.count();

            for (let j = 0; j < textElementsCount; j++) {
              const text = await textElements.nth(j).innerText();
              const cleanText = text.trim();

              const excludeWords = ["평점", "신고", "도움", "더보기"];
              const isReviewText =
                cleanText.length > 20 &&
                !excludeWords.some((word) => cleanText.includes(word)) &&
                !cleanText.match(/^\d{2}\.\d{2}\.\d{2}\.$/);

              if (isReviewText) {
                content = cleanText;
                break;
              }
            }
          } catch {}

          // 유효한 데이터가 있을 때만 저장
          if (rating || author !== "익명" || content) {
            reviews.push({
              id: `${Date.now()}-${i}`,
              rating,
              author,
              content,
              date,
              helpfulCount: 0,
            });
          }

          await stealthPageFactory.randomDelay(100, 300);
        } catch (error) {
          console.log(`⚠️ 리뷰 ${i + 1} 추출 중 오류:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error("❌ Current page review extraction failed:", error);
    }

    return reviews;
  }
}
