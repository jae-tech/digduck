import { SourceSite } from "@prisma/client";
import { CrawlSettings, SiteSpecificData } from "@/types/crawl.types";
import axios from "axios";

// 크롤링 결과 아이템 인터페이스
export interface CrawlResultItem {
  itemId?: string;
  title?: string;
  content?: string;
  url?: string;
  rating?: number;
  reviewDate?: Date;
  reviewerName?: string;
  isVerified?: boolean;
  price?: number;
  originalPrice?: number;
  discount?: number;
  stock?: number;
  imageUrls?: string[];
  videoUrls?: string[];
  siteSpecificData?: SiteSpecificData;
  itemOrder?: number;
  pageNumber?: number;
}

// 크롤링 진행 상황 콜백
export interface CrawlProgressCallback {
  onProgress?: (progress: {
    currentPage: number;
    totalPages: number;
    itemsFound: number;
    itemsCrawled: number;
    message?: string;
  }) => void;
  onError?: (error: Error) => void;
  onItem?: (item: CrawlResultItem) => void;
}

// 크롤링 옵션
export interface CrawlOptions {
  maxPages?: number;
  maxItems?: number;
  requestDelay?: number;
  userAgent?: string;
  proxyUrl?: string;
  timeout?: number;
  retries?: number;
}

// 추상 크롤러 베이스 클래스
export abstract class BaseCrawler {
  protected sourceSite: SourceSite;
  protected options: CrawlOptions;
  protected isRunning: boolean = false;
  protected shouldStop: boolean = false;

  constructor(sourceSite: SourceSite, options: CrawlOptions = {}) {
    this.sourceSite = sourceSite;
    this.options = {
      maxPages: 10,
      maxItems: 2000,
      requestDelay: 1000,
      timeout: 30000,
      retries: 3,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
      ...options,
    };
  }

  /**
   * 크롤링 실행
   */
  async crawl(
    searchUrl: string,
    settings?: CrawlSettings,
    callback?: CrawlProgressCallback
  ): Promise<CrawlResultItem[]> {
    if (this.isRunning) {
      throw new Error("Crawler is already running");
    }

    this.isRunning = true;
    this.shouldStop = false;

    try {
      const mergedOptions = {
        ...this.options,
        ...settings,
      };

      const results = await this.performCrawl(
        searchUrl,
        mergedOptions,
        callback
      );
      return results;
    } catch (error) {
      callback?.onError?.(error as Error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * 크롤링 중단
   */
  stop(): void {
    this.shouldStop = true;
  }

  /**
   * 크롤링 실행 상태
   */
  getStatus(): { isRunning: boolean; shouldStop: boolean } {
    return {
      isRunning: this.isRunning,
      shouldStop: this.shouldStop,
    };
  }

  /**
   * 실제 크롤링 로직 (구현 필요)
   */
  protected abstract performCrawl(
    searchUrl: string,
    options: CrawlOptions & CrawlSettings,
    callback?: CrawlProgressCallback
  ): Promise<CrawlResultItem[]>;

  /**
   * URL 파싱 및 검증 (구현 필요)
   */
  protected abstract parseUrl(url: string): {
    isValid: boolean;
    searchKeywords?: string;
    category?: string;
    filters?: any;
  };

  /**
   * 페이지 파싱 (구현 필요)
   */
  protected abstract parsePage(
    html: string,
    pageNumber: number
  ): Promise<CrawlResultItem[]>;

  /**
   * 지연 시간 적용
   */
  protected async delay(
    ms: number = this.options.requestDelay || 1000
  ): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 안전한 HTTP 요청
   */
  protected async fetchWithRetry(
    url: string,
    options: any = {},
    retries: number = this.options.retries || 3
  ): Promise<{ ok: boolean; status: number; statusText: string; text: () => Promise<string> }> {
    let lastError: Error;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await axios({
          url,
          method: options.method || 'GET',
          data: options.body,
          headers: {
            "User-Agent": this.options.userAgent!,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "ko-KR,ko;q=0.8,en-US;q=0.5,en;q=0.3",
            "Accept-Encoding": "gzip, deflate, br",
            DNT: "1",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            ...options.headers,
          },
          timeout: this.options.timeout || 30000,
          responseType: 'text',
          validateStatus: () => true, // axios가 모든 상태코드를 허용하도록
        });

        // Response 인터페이스와 호환되도록 래핑
        const wrappedResponse = {
          ok: response.status >= 200 && response.status < 300,
          status: response.status,
          statusText: response.statusText,
          text: async () => response.data
        };

        if (!wrappedResponse.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return wrappedResponse;
      } catch (error) {
        lastError = error as Error;

        if (i < retries - 1) {
          // 재시도 전 대기 (지수 백오프)
          await this.delay(Math.pow(2, i) * 1000);
        }
      }
    }

    throw lastError!;
  }

  /**
   * HTML에서 텍스트 추출 및 정리
   */
  protected cleanText(text: string): string {
    return text.replace(/\s+/g, " ").replace(/\n+/g, " ").trim();
  }

  /**
   * 상대 URL을 절대 URL로 변환
   */
  protected resolveUrl(baseUrl: string, relativeUrl: string): string {
    try {
      return new URL(relativeUrl, baseUrl).href;
    } catch {
      return relativeUrl;
    }
  }

  /**
   * 숫자 추출 (가격, 평점 등)
   */
  protected extractNumber(text: string): number | undefined {
    const match = text.replace(/[^\d.]/g, "");
    const number = parseFloat(match);
    return isNaN(number) ? undefined : number;
  }

  /**
   * 날짜 파싱
   */
  protected parseDate(dateString: string): Date | undefined {
    try {
      // 한국어 날짜 형식 처리
      const koreanDateRegex =
        /(\d{4})[\.\-\/년]\s*(\d{1,2})[\.\-\/월]\s*(\d{1,2})[\.\-\/일]?/;
      const match = dateString.match(koreanDateRegex);

      if (match) {
        const [, year, month, day] = match;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      // ISO 형식 시도
      return new Date(dateString);
    } catch {
      return undefined;
    }
  }

  /**
   * 봇 탐지 회피를 위한 랜덤 지연
   */
  protected async randomDelay(): Promise<void> {
    const baseDelay = this.options.requestDelay || 1000;
    const randomDelay = Math.random() * baseDelay * 0.5; // ±25% 변동
    await this.delay(baseDelay + randomDelay);
  }

  /**
   * 중단 확인
   */
  protected checkShouldStop(): boolean {
    return this.shouldStop;
  }
}
