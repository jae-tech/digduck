import {
  CrawlOptions,
  CrawlProgressCallback,
  CrawlResultItem,
} from "@/services/crawlers/base-crawler";
import { CrawlSettings, SmartStoreReviewItem } from "@/types/crawl.types";
import axios from "axios";
import { JSDOM } from "jsdom";

export class SmartStoreCrawler {
  constructor() {}

  /**
   * 네이버 쇼핑 리뷰 크롤링 실행
   */
  async crawlNaverShoppingReview(
    searchUrl: string,
    options: CrawlOptions & CrawlSettings,
    callback?: CrawlProgressCallback,
  ): Promise<CrawlResultItem[]> {
    const urlInfo = this.parseNaverShoppingUrl(searchUrl);

    if (!urlInfo.isValid) {
      throw new Error("Invalid SmartStore URL");
    }

    const results: CrawlResultItem[] = [];
    const maxPages = Math.min(options.maxPages || 10, 50);
    const maxItems = options.maxItems || 2000;

    let currentPage = 1;
    let totalItemsFound = 0;

    callback?.onProgress?.({
      currentPage: 0,
      totalPages: maxPages,
      itemsFound: 0,
      itemsCrawled: 0,
      message: "스마트스토어 크롤링 시작",
    });

    while (
      currentPage <= maxPages &&
      results.length < maxItems &&
      !(options as any).shouldStop?.()
    ) {
      try {
        callback?.onProgress?.({
          currentPage,
          totalPages: maxPages,
          itemsFound: totalItemsFound,
          itemsCrawled: results.length,
          message: `${currentPage}페이지 처리중`,
        });

        const pageUrl = this.buildSmartStorePageUrl(searchUrl, currentPage);
        const response = await this.fetchWithRetry(pageUrl);
        const html = await response.text();

        const pageItems = await this.parseSmartStorePage(html, currentPage);

        if (pageItems.length === 0) {
          console.log(`Page ${currentPage} has no items, stopping crawl`);
          break;
        }

        totalItemsFound += pageItems.length;

        // 필터 적용
        const filteredItems = this.applySmartStoreFilters(
          pageItems,
          options.filters,
        );
        results.push(...filteredItems);

        // 각 아이템에 대해 콜백 호출
        filteredItems.forEach((item) => callback?.onItem?.(item));

        // 봇 탐지 회피를 위한 랜덤 지연
        await this.randomDelay();

        currentPage++;
      } catch (error) {
        console.error(`Error crawling page ${currentPage}:`, error);
        callback?.onError?.(error as Error);
        currentPage++;
        continue;
      }
    }

    callback?.onProgress?.({
      currentPage: currentPage - 1,
      totalPages: maxPages,
      itemsFound: totalItemsFound,
      itemsCrawled: results.length,
      message: `완료: ${results.length}개 아이템`,
    });

    return results.slice(0, maxItems);
  }

  private parseNaverShoppingUrl(url: string): {
    isValid: boolean;
    searchKeywords?: string;
    category?: string;
    filters?: any;
  } {
    try {
      const urlObj = new URL(url);

      if (!url.includes("smartstore.naver.com")) {
        return { isValid: false };
      }

      const params = urlObj.searchParams;
      const searchKeywords = params.get("q") || params.get("query");
      const category = params.get("cat_id");

      return {
        isValid: true,
        searchKeywords: searchKeywords || undefined,
        category: category || undefined,
        filters: {
          minPrice: params.get("minPrice"),
          maxPrice: params.get("maxPrice"),
          rating: params.get("rating"),
          delivery: params.get("delivery"),
        },
      };
    } catch {
      return { isValid: false };
    }
  }

  private async parseSmartStorePage(
    html: string,
    pageNumber: number,
  ): Promise<CrawlResultItem[]> {
    const dom = new JSDOM(html);
    const document = dom.window.document;

    // 리뷰 페이지인지 상품 목록 페이지인지 확인
    if (html.includes("review") && html.includes("rating")) {
      return this.parseSmartStoreReviewPage(document, pageNumber);
    } else {
      return this.parseSmartStoreProductPage(document, pageNumber);
    }
  }

  private parseSmartStoreReviewPage(
    document: Document,
    pageNumber: number,
  ): CrawlResultItem[] {
    const results: CrawlResultItem[] = [];

    const reviewSelectors = [
      ".review_list_item",
      ".reviewItems",
      '[data-testid="review-item"]',
      ".review-item",
    ];

    let reviewElements: NodeListOf<Element> | null = null;

    for (const selector of reviewSelectors) {
      reviewElements = document.querySelectorAll(selector);
      if (reviewElements.length > 0) break;
    }

    if (!reviewElements || reviewElements.length === 0) {
      return results;
    }

    reviewElements.forEach((element, index) => {
      try {
        const reviewItem = this.parseSmartStoreReviewElement(
          element,
          pageNumber,
          index + 1,
        );
        if (reviewItem) {
          results.push(reviewItem);
        }
      } catch (error) {
        console.error("Error parsing review element:", error);
      }
    });

    return results;
  }

  private parseSmartStoreProductPage(
    document: Document,
    pageNumber: number,
  ): CrawlResultItem[] {
    const results: CrawlResultItem[] = [];

    const productSelectors = [
      ".product_list_item",
      ".productItems",
      '[data-testid="product-item"]',
      ".product-item",
    ];

    let productElements: NodeListOf<Element> | null = null;

    for (const selector of productSelectors) {
      productElements = document.querySelectorAll(selector);
      if (productElements.length > 0) break;
    }

    if (!productElements || productElements.length === 0) {
      return results;
    }

    productElements.forEach((element, index) => {
      try {
        const productItem = this.parseSmartStoreProductElement(
          element,
          pageNumber,
          index + 1,
        );
        if (productItem) {
          results.push(productItem);
        }
      } catch (error) {
        console.error("Error parsing product element:", error);
      }
    });

    return results;
  }

  private parseSmartStoreReviewElement(
    element: Element,
    pageNumber: number,
    itemOrder: number,
  ): CrawlResultItem | null {
    try {
      const contentElement = element.querySelector(
        ".review_content, .review-text, .content",
      );
      const content = contentElement?.textContent
        ? this.cleanText(contentElement.textContent)
        : undefined;

      const ratingElement = element.querySelector(
        ".rating, .star-rating, .review-rating",
      );
      const ratingText =
        ratingElement?.textContent ||
        ratingElement?.getAttribute("aria-label") ||
        "";
      const rating = this.extractRatingFromText(ratingText);

      const reviewerElement = element.querySelector(
        ".reviewer, .review-author, .user-name",
      );
      const reviewerName = reviewerElement?.textContent
        ? this.cleanText(reviewerElement.textContent)
        : undefined;

      const dateElement = element.querySelector(
        ".review-date, .date, .created-at",
      );
      const dateText = dateElement?.textContent || "";
      const reviewDate = this.parseDate(dateText);

      const verifiedElement = element.querySelector(
        ".verified, .confirmed, .purchased",
      );
      const isVerified = verifiedElement !== null;

      const imageElements = element.querySelectorAll("img");
      const imageUrls: string[] = [];
      imageElements.forEach((img) => {
        const src = img.getAttribute("src") || img.getAttribute("data-src");
        if (src && !src.includes("icon") && !src.includes("sprite")) {
          imageUrls.push(this.resolveUrl("https://smartstore.naver.com", src));
        }
      });

      const itemId =
        element.getAttribute("data-review-id") ||
        element.getAttribute("id") ||
        `review_${pageNumber}_${itemOrder}`;

      const siteSpecificData: SmartStoreReviewItem = {
        reviewId: itemId,
        title: undefined,
        content,
        rating,
        reviewDate: reviewDate?.toISOString(),
        reviewerName,
        isVerified,
        imageUrls,
      };

      return {
        itemId,
        title: undefined,
        content,
        rating,
        reviewDate,
        reviewerName,
        isVerified,
        imageUrls,
        siteSpecificData: { smartStore: siteSpecificData },
        itemOrder,
        pageNumber,
      };
    } catch (error) {
      console.error("Error parsing review element:", error);
      return null;
    }
  }

  private parseSmartStoreProductElement(
    element: Element,
    pageNumber: number,
    itemOrder: number,
  ): CrawlResultItem | null {
    try {
      const titleElement = element.querySelector(
        ".product-title, .title, .name, h3, h4",
      );
      const title = titleElement?.textContent
        ? this.cleanText(titleElement.textContent)
        : undefined;

      const priceElement = element.querySelector(
        ".price, .current-price, .sale-price",
      );
      const priceText = priceElement?.textContent || "";
      const price = this.extractNumber(priceText);

      const originalPriceElement = element.querySelector(
        ".original-price, .before-price, .regular-price",
      );
      const originalPriceText = originalPriceElement?.textContent || "";
      const originalPrice = this.extractNumber(originalPriceText);

      const discountElement = element.querySelector(".discount, .sale-rate");
      const discountText = discountElement?.textContent || "";
      const discount = this.extractNumber(discountText);

      const ratingElement = element.querySelector(".rating, .star-rating");
      const ratingText = ratingElement?.textContent || "";
      const rating = this.extractRatingFromText(ratingText);

      const imageElement = element.querySelector("img");
      const imageSrc =
        imageElement?.getAttribute("src") ||
        imageElement?.getAttribute("data-src");
      const imageUrls = imageSrc
        ? [this.resolveUrl("https://smartstore.naver.com", imageSrc)]
        : [];

      const linkElement = element.querySelector("a");
      const url = linkElement?.getAttribute("href")
        ? this.resolveUrl(
            "https://smartstore.naver.com",
            linkElement.getAttribute("href")!,
          )
        : undefined;

      const itemId =
        linkElement?.getAttribute("data-product-id") ||
        element.getAttribute("data-id") ||
        `product_${pageNumber}_${itemOrder}`;

      return {
        itemId,
        title,
        url,
        price,
        originalPrice,
        discount,
        rating,
        imageUrls,
        siteSpecificData: {
          smartStore: {
            productId: itemId,
            title,
            price,
            originalPrice,
            discount,
            rating,
            imageUrls,
          },
        },
        itemOrder,
        pageNumber,
      };
    } catch (error) {
      console.error("Error parsing product element:", error);
      return null;
    }
  }

  private extractRatingFromText(text: string): number | undefined {
    const numberMatch = text.match(/(\\d+(?:\\.\\d+)?)/)?.[1];
    if (numberMatch) {
      const rating = parseFloat(numberMatch);
      return rating <= 5 ? rating : rating / 2;
    }

    const starCount = (text.match(/★/g) || []).length;
    if (starCount > 0) {
      return starCount;
    }

    return undefined;
  }

  private buildSmartStorePageUrl(baseUrl: string, pageNumber: number): string {
    const url = new URL(baseUrl);
    url.searchParams.set("page", pageNumber.toString());
    return url.toString();
  }

  private applySmartStoreFilters(
    items: CrawlResultItem[],
    filters?: any,
  ): CrawlResultItem[] {
    if (!filters) return items;

    return items.filter((item) => {
      if (
        filters.rating?.min &&
        item.rating &&
        item.rating < filters.rating.min
      ) {
        return false;
      }
      if (
        filters.rating?.max &&
        item.rating &&
        item.rating > filters.rating.max
      ) {
        return false;
      }

      if (filters.price?.min && item.price && item.price < filters.price.min) {
        return false;
      }
      if (filters.price?.max && item.price && item.price > filters.price.max) {
        return false;
      }

      if (filters.keywords && filters.keywords.length > 0) {
        const text = `${item.title || ""} ${item.content || ""}`.toLowerCase();
        const hasKeyword = filters.keywords.some((keyword: string) =>
          text.includes(keyword.toLowerCase()),
        );
        if (!hasKeyword) return false;
      }

      if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
        const text = `${item.title || ""} ${item.content || ""}`.toLowerCase();
        const hasExcludeKeyword = filters.excludeKeywords.some(
          (keyword: string) => text.includes(keyword.toLowerCase()),
        );
        if (hasExcludeKeyword) return false;
      }

      return true;
    });
  }

  private async fetchWithRetry(
    url: string,
    retries: number = 3,
  ): Promise<{ text: () => Promise<string> }> {
    let lastError: Error;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios.get(url, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3",
            "Accept-Encoding": "gzip, deflate, br",
            DNT: "1",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
          },
          timeout: 30000,
          responseType: "text",
        });

        // Response 인터페이스와 호환되도록 text() 메서드 제공
        return {
          text: async () => response.data,
        };
      } catch (error) {
        lastError = error as Error;

        if (i < retries - 1) {
          await this.randomDelay(Math.pow(2, i) * 1000, Math.pow(2, i) * 1500);
        }
      }
    }

    throw lastError!;
  }

  private cleanText(text: string): string {
    return text.replace(/\\s+/g, " ").replace(/\\n+/g, " ").trim();
  }

  private resolveUrl(baseUrl: string, relativeUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).href;
    } catch {
      return relativeUrl;
    }
  }

  private extractNumber(text: string): number | undefined {
    const match = text.replace(/[^\\d.]/g, "");
    const number = parseFloat(match);
    return isNaN(number) ? undefined : number;
  }

  private parseDate(dateString: string): Date | undefined {
    try {
      const koreanDateRegex =
        /(\\d{4})[\\.\\-\\/년]\\s*(\\d{1,2})[\\.\\-\\/월]\\s*(\\d{1,2})[\\.\\-\\/일]?/;
      const match = dateString.match(koreanDateRegex);

      if (match) {
        const [, year, month, day] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      return new Date(dateString);
    } catch {
      return undefined;
    }
  }

  private async randomDelay(
    minMs: number = 1000,
    maxMs: number = 3000,
  ): Promise<void> {
    const delayTime = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    await new Promise((resolve) => setTimeout(resolve, delayTime));
  }
}
