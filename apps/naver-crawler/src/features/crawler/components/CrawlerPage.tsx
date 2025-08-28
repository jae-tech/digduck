import { useState } from "react";
import FluidLayout from "@/components/layouts/FluidLayout";
import { useReviewsCrawlWithProgress } from "../hooks/useCrawler";
import type { CrawlSort } from "../types/crawler.types";
import { CrawlerSettings } from "./CrawlerSettings";
import { CrawlerProgress } from "./CrawlerProgress";
import { CrawlerStats } from "./CrawlerStats";
import { CrawlerResults } from "./CrawlerResults";

export function CrawlerPage() {
  const [url, setUrl] = useState("");
  const [sort, setSort] = useState<CrawlSort>("ranking");
  const [maxPages, setMaxPages] = useState(5);

  const { crawlWithProgress, progress, isLoading, finalResult, error } =
    useReviewsCrawlWithProgress();

  const handleStartCrawling = () => {
    crawlWithProgress({ url, sort, maxPages });
  };

  // 통계 데이터
  const stats = {
    totalReviews: progress.totalReviews || finalResult?.totalReviews || 0,
    crawledReviews: progress.crawledReviews || finalResult?.totalCount || 0,
    crawledPages: progress.currentPage || finalResult?.processedPages || 0,
    estimatedPages: progress.estimatedTotalPages || maxPages,
    duration: Math.floor(
      (progress.elapsedTime || finalResult?.executionTime || 0) / 1000
    ),
    progressPercentage:
      progress.totalReviews > 0
        ? Math.round((progress.crawledReviews / progress.totalReviews) * 100)
        : 0,
  };

  return (
    <FluidLayout>
      <div className="space-y-6">
        {/* 크롤링 설정 */}
        <CrawlerSettings
          url={url}
          setUrl={setUrl}
          sort={sort}
          setSort={setSort}
          maxPages={maxPages}
          setMaxPages={setMaxPages}
          onStartCrawling={handleStartCrawling}
          isLoading={isLoading}
          progressPercentage={stats.progressPercentage}
        />

        {/* 진행 상황 및 에러 표시 */}
        <CrawlerProgress
          progress={progress}
          isLoading={isLoading}
          error={error}
          progressPercentage={stats.progressPercentage}
        />

        {/* 통계 정보 */}
        <CrawlerStats stats={stats} />

        {/* 크롤링 결과 테이블 */}
        <CrawlerResults
          finalResult={finalResult}
          isLoading={isLoading}
          crawledReviews={stats.crawledReviews}
        />
      </div>
    </FluidLayout>
  );
}
