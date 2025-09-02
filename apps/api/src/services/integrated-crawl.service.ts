import { PrismaClient, CrawlStatus } from "@prisma/client";
import { CrawlHistoryService } from "./crawl-history.service";
import { CrawlerFactory } from "./crawlers/crawler-factory";
import {
  BaseCrawler,
  CrawlResultItem,
  CrawlProgressCallback,
} from "./crawlers/base-crawler";
import {
  StartCrawlRequest,
  CreateCrawlItemRequest,
  CrawlHistoryResponse,
  CrawlHistoryError,
  CrawlHistoryErrorCodes,
} from "../types/crawl-history.types";

/**
 * 통합 크롤링 서비스
 * 크롤링 히스토리 관리와 실제 크롤링 작업을 통합
 */
export class IntegratedCrawlService {
  private crawlHistoryService: CrawlHistoryService;
  private activeCrawlers: Map<number, BaseCrawler> = new Map();

  constructor(private prisma: PrismaClient) {
    this.crawlHistoryService = new CrawlHistoryService(prisma);
  }

  /**
   * 크롤링 작업 시작
   */
  async startCrawlJob(request: StartCrawlRequest): Promise<{
    crawlHistory: CrawlHistoryResponse;
    jobId: number;
  }> {
    // 지원 사이트 확인
    if (!CrawlerFactory.isSupported(request.sourceSite)) {
      throw new CrawlHistoryError(
        `Unsupported source site: ${request.sourceSite}`,
        CrawlHistoryErrorCodes.INVALID_SOURCE_SITE,
        400
      );
    }

    // 크롤링 히스토리 생성
    const crawlHistory = await this.crawlHistoryService.startCrawl(request);
    const crawlId = crawlHistory.id;

    // 백그라운드에서 실제 크롤링 실행
    this.executeCrawlJob(crawlId, request).catch((error) => {
      console.error(`Crawl job ${crawlId} failed:`, error);
      this.crawlHistoryService.completeCrawl(crawlId, false, error.message);
    });

    return {
      crawlHistory,
      jobId: crawlId,
    };
  }

  /**
   * 크롤링 작업 중단
   */
  async stopCrawlJob(crawlId: number, _userEmail?: string): Promise<boolean> {
    const crawler = this.activeCrawlers.get(crawlId);

    if (crawler) {
      crawler.stop();
      this.activeCrawlers.delete(crawlId);

      // 상태 업데이트
      await this.crawlHistoryService.updateCrawlHistory(crawlId, {
        status: CrawlStatus.CANCELLED,
      });

      return true;
    }

    return false;
  }

  /**
   * 크롤링 작업 상태 조회
   */
  async getCrawlJobStatus(
    crawlId: number,
    userEmail?: string
  ): Promise<{
    crawlHistory: CrawlHistoryResponse;
    isActive: boolean;
    progress?: any;
  }> {
    const crawlHistory = await this.crawlHistoryService.getCrawlHistoryDetail(
      crawlId,
      userEmail
    );
    const crawler = this.activeCrawlers.get(crawlId);

    return {
      crawlHistory,
      isActive: crawler?.getStatus().isRunning || false,
      progress: crawler ? crawler.getStatus() : undefined,
    };
  }

  /**
   * 활성 크롤링 작업 목록
   */
  getActiveCrawlJobs(): number[] {
    return Array.from(this.activeCrawlers.keys());
  }

  /**
   * 실제 크롤링 작업 실행 (내부)
   */
  private async executeCrawlJob(
    crawlId: number,
    request: StartCrawlRequest
  ): Promise<void> {
    let crawler: BaseCrawler | undefined;

    try {
      // 크롤러 생성
      const crawlerOptions = CrawlerFactory.getDefaultOptions(
        request.sourceSite
      );
      crawler = CrawlerFactory.createCrawler(request.sourceSite, {
        ...crawlerOptions,
        ...request.crawlSettings,
        userAgent: request.crawlSettings?.userAgent || crawlerOptions.userAgent,
      });

      this.activeCrawlers.set(crawlId, crawler);

      // 크롤링 상태를 RUNNING으로 업데이트
      await this.crawlHistoryService.updateCrawlHistory(crawlId, {
        status: CrawlStatus.RUNNING,
        startedAt: new Date(),
      });

      // 진행 상황 추적을 위한 콜백 설정
      const progressCallback: CrawlProgressCallback = {
        onProgress: async (progress) => {
          await this.crawlHistoryService.updateCrawlHistory(crawlId, {
            itemsFound: progress.itemsFound,
            itemsCrawled: progress.itemsCrawled,
            pagesProcessed: progress.currentPage,
          });
        },
        onError: (error) => {
          console.error(`Crawl ${crawlId} error:`, error);
        },
        onItem: (item) => {
          // 개별 아이템 처리 시 로그 (필요시)
          console.log(
            `Crawl ${crawlId} found item:`,
            item.title || item.itemId
          );
        },
      };

      // 크롤링 실행
      const results = await crawler.crawl(
        request.searchUrl,
        request.crawlSettings,
        progressCallback
      );

      // 결과를 배치로 데이터베이스에 저장
      if (results.length > 0) {
        await this.saveCrawlResults(crawlId, results);
      }

      // 크롤링 완료
      await this.crawlHistoryService.completeCrawl(crawlId, true);
    } catch (error) {
      console.error(`Crawl job ${crawlId} execution failed:`, error);

      // 에러 상태로 완료
      await this.crawlHistoryService.completeCrawl(
        crawlId,
        false,
        error instanceof Error ? error.message : "Unknown error"
      );

      throw error;
    } finally {
      // 활성 크롤러 목록에서 제거
      this.activeCrawlers.delete(crawlId);
    }
  }

  /**
   * 크롤링 결과를 데이터베이스에 저장
   */
  private async saveCrawlResults(
    crawlId: number,
    results: CrawlResultItem[]
  ): Promise<void> {
    const batchSize = 100; // 배치 크기

    for (let i = 0; i < results.length; i += batchSize) {
      const batch = results.slice(i, i + batchSize);

      const crawlItems: CreateCrawlItemRequest[] = batch.map((item) => ({
        crawlHistoryId: crawlId,
        itemId: item.itemId,
        title: item.title,
        content: item.content,
        url: item.url,
        rating: item.rating,
        reviewDate: item.reviewDate,
        reviewerName: item.reviewerName,
        isVerified: item.isVerified,
        price: item.price,
        originalPrice: item.originalPrice,
        discount: item.discount,
        stock: item.stock,
        imageUrls: item.imageUrls,
        videoUrls: item.videoUrls,
        siteSpecificData: item.siteSpecificData,
        itemOrder: item.itemOrder,
        pageNumber: item.pageNumber,
      }));

      try {
        await this.crawlHistoryService.addCrawlItems(crawlItems);
      } catch (error) {
        console.error(`Failed to save batch ${i / batchSize + 1}:`, error);
        // 배치 저장 실패 시 개별 저장 시도
        for (const crawlItem of crawlItems) {
          try {
            await this.crawlHistoryService.addCrawlItems([crawlItem]);
          } catch (itemError) {
            console.error(
              "Failed to save individual item:",
              itemError,
              crawlItem
            );
          }
        }
      }

      // 배치 간 짧은 지연
      if (i + batchSize < results.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  }

  /**
   * 크롤링 히스토리 서비스 접근자
   */
  getCrawlHistoryService(): CrawlHistoryService {
    return this.crawlHistoryService;
  }

  /**
   * 서비스 종료 시 정리
   */
  async cleanup(): Promise<void> {
    // 모든 활성 크롤러 중단
    const activeJobs = Array.from(this.activeCrawlers.keys());

    await Promise.all(
      activeJobs.map(async (crawlId) => {
        try {
          await this.stopCrawlJob(crawlId);
        } catch (error) {
          console.error(`Failed to stop crawl job ${crawlId}:`, error);
        }
      })
    );

    this.activeCrawlers.clear();
  }

  /**
   * 크롤링 한도 체크 (라이센스별)
   */
  async checkCrawlLimits(userEmail: string): Promise<{
    canCrawl: boolean;
    dailyLimit: number;
    dailyUsed: number;
    monthlyLimit: number;
    monthlyUsed: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [dailyCount, monthlyCount] = await Promise.all([
      this.prisma.crawlHistory.count({
        where: {
          userEmail,
          createdAt: { gte: startOfDay },
        },
      }),
      this.prisma.crawlHistory.count({
        where: {
          userEmail,
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    // TODO: 라이센스별 한도 설정 (현재는 하드코딩)
    const dailyLimit = 50;
    const monthlyLimit = 1000;

    return {
      canCrawl: dailyCount < dailyLimit && monthlyCount < monthlyLimit,
      dailyLimit,
      dailyUsed: dailyCount,
      monthlyLimit,
      monthlyUsed: monthlyCount,
    };
  }
}
