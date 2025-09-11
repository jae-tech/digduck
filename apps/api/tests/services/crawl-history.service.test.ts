import { describe, it, expect, beforeEach, vi } from "vitest";
import { CrawlStatus } from "@prisma/client";
import { CrawlHistoryService } from "../../src/services/crawl-history.service";
import { testPrisma } from "../setup";

describe("CrawlHistoryService", () => {
  let crawlHistoryService: CrawlHistoryService;

  beforeEach(() => {
    crawlHistoryService = new CrawlHistoryService(testPrisma);
  });

  describe("startCrawl", () => {
    it("크롤링을 시작해야 함", async () => {
      const request = {
        userEmail: "test@example.com",
        sourceSite: "SMARTSTORE" as const,
        searchUrl: "https://smartstore.naver.com/search?q=test",
        crawlSettings: {
          maxPages: 5,
          maxItems: 100,
        },
      };

      const result = await crawlHistoryService.startCrawl(request);

      expect(result.id).toBeDefined();
      expect(result.userEmail).toBe(request.userEmail);
      expect(result.sourceSite).toBe(request.sourceSite);
      expect(result.searchUrl).toBe(request.searchUrl);
      expect(result.status).toBe(CrawlStatus.PENDING);
    });
  });

  describe("completeCrawl", () => {
    it("성공적으로 크롤링을 완료해야 함", async () => {
      const request = {
        userEmail: "test@example.com",
        sourceSite: "SMARTSTORE" as const,
        searchUrl: "https://smartstore.naver.com/search?q=test",
        crawlSettings: {
          maxPages: 5,
          maxItems: 100,
        },
      };

      const crawl = await crawlHistoryService.startCrawl(request);
      await crawlHistoryService.completeCrawl(crawl.id, true);

      const updated = await crawlHistoryService.getCrawlHistoryDetail(crawl.id);
      expect(updated.status).toBe(CrawlStatus.COMPLETED);
      expect(updated.completedAt).toBeDefined();
      expect(updated.isSuccess).toBe(true);
    });

    it("실패로 크롤링을 완료해야 함", async () => {
      const request = {
        userEmail: "test@example.com",
        sourceSite: "SMARTSTORE" as const,
        searchUrl: "https://smartstore.naver.com/search?q=test",
        crawlSettings: {
          maxPages: 5,
          maxItems: 100,
        },
      };

      const crawl = await crawlHistoryService.startCrawl(request);
      const errorMessage = "Network error";
      await crawlHistoryService.completeCrawl(crawl.id, false, errorMessage);

      const updated = await crawlHistoryService.getCrawlHistoryDetail(crawl.id);
      expect(updated.status).toBe(CrawlStatus.FAILED);
      expect(updated.errorMessage).toBe(errorMessage);
      expect(updated.isSuccess).toBe(false);
    });
  });

  describe("addCrawlItems", () => {
    it("크롤링 아이템을 추가해야 함", async () => {
      const request = {
        userEmail: "test@example.com",
        sourceSite: "SMARTSTORE" as const,
        searchUrl: "https://smartstore.naver.com/search?q=test",
        crawlSettings: {
          maxPages: 5,
          maxItems: 100,
        },
      };

      const crawl = await crawlHistoryService.startCrawl(request);

      const items = [
        {
          crawlHistoryId: crawl.id,
          itemId: "item-1",
          title: "테스트 상품",
          content: "상품 설명",
          url: "https://example.com/product/1",
          price: 10000,
          itemOrder: 1,
          pageNumber: 1,
        },
      ];

      const result = await crawlHistoryService.addCrawlItems(items);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("테스트 상품");
    });
  });

  describe("getCrawlHistoryList", () => {
    it("크롤링 히스토리 목록을 조회해야 함", async () => {
      const userEmail = "test@example.com";

      // 테스트 데이터 생성
      await crawlHistoryService.startCrawl({
        userEmail,
        sourceSite: "SMARTSTORE" as const,
        searchUrl: "https://smartstore.naver.com/search?q=test1",
        crawlSettings: { maxPages: 1, maxItems: 10 },
      });

      await crawlHistoryService.startCrawl({
        userEmail,
        sourceSite: "SMARTSTORE" as const,
        searchUrl: "https://smartstore.naver.com/search?q=test2",
        crawlSettings: { maxPages: 1, maxItems: 10 },
      });

      const result = await crawlHistoryService.getCrawlHistoryList({
        userEmail,
        page: 1,
        limit: 10,
      });

      expect(result.histories).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);
    });

    it("필터링이 적용되어야 함", async () => {
      const userEmail = "test@example.com";

      await crawlHistoryService.startCrawl({
        userEmail,
        sourceSite: "SMARTSTORE" as const,
        searchUrl: "https://smartstore.naver.com/search?q=test",
        crawlSettings: { maxPages: 1, maxItems: 10 },
      });

      const result = await crawlHistoryService.getCrawlHistoryList({
        userEmail,
        sourceSite: "SMARTSTORE" as const,
        page: 1,
        limit: 10,
      });

      expect(result.histories).toHaveLength(1);
      expect(result.histories[0].sourceSite).toBe("SMARTSTORE");
    });
  });

  describe("getCrawlStatistics", () => {
    it("크롤링 통계를 조회해야 함", async () => {
      const userEmail = "test@example.com";

      const crawl = await crawlHistoryService.startCrawl({
        userEmail,
        sourceSite: "SMARTSTORE" as const,
        searchUrl: "https://smartstore.naver.com/search?q=test",
        crawlSettings: { maxPages: 1, maxItems: 10 },
      });

      await crawlHistoryService.completeCrawl(crawl.id, true);

      const stats = await crawlHistoryService.getCrawlStatistics(userEmail);

      expect(stats.totalCrawls).toBe(1);
      expect(stats.successfulCrawls).toBe(1);
      expect(stats.failedCrawls).toBe(0);
      expect(stats.successRate).toBe(100);
    });
  });
});
