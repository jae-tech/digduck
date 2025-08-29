import { useState } from "react";
import FluidLayout from "@/components/layouts/FluidLayout";
import { useReviewsCrawlWithProgress } from "../hooks/useCrawler";
import type { CrawlSort } from "../types/crawler.types";
import { CrawlerSettings } from "./CrawlerSettings";
import { CrawlerProgress } from "./CrawlerProgress";
import { CrawlerStats } from "./CrawlerStats";
import { CrawlerResults } from "./CrawlerResults";
import { Card, CardContent } from "@/components/ui/card";
import { Globe } from "lucide-react";

export function CrawlerPage() {
  const [url, setUrl] = useState("");
  const [sort, setSort] = useState<CrawlSort>("ranking");
  const [maxPages, setMaxPages] = useState(5);

  const { crawlWithProgress, progress, isLoading, finalResult, error } =
    useReviewsCrawlWithProgress();

  const sortOptions = [
    {
      value: "ranking",
      label: "랭킹순",
    },
    {
      value: "latest",
      label: "최신순",
    },
    {
      value: "high-rating",
      label: "높은평점순",
    },
    {
      value: "low-rating",
      label: "낮은평점순",
    },
  ];

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
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 h-[calc(100vh-6rem)]">
        {/* 데스크톱: 왼쪽 영역 - 검색 필드와 데이터 테이블 / 모바일: 설정 */}
        <div className="xl:col-span-3 space-y-4 overflow-hidden xl:order-1 order-1">
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

          {/* 데스크톱에서만 테이블 표시 */}
          <div className="flex-1 overflow-hidden hidden xl:block min-h-[600px]">
            <CrawlerResults
              finalResult={finalResult}
              isLoading={isLoading}
              crawledReviews={stats.crawledReviews}
            />
          </div>
        </div>

        {/* 데스크톱: 오른쪽 영역 / 모바일: 통계, 설정, 진행상황을 한 줄로 */}
        <div className="xl:col-span-1 xl:order-2 order-2">
          {/* 데스크톱에서는 세로로 배치 */}
          <div className="hidden xl:flex xl:flex-col xl:space-y-4 xl:h-full xl:overflow-hidden">
            <CrawlerStats stats={stats} />

            {/* 설정요약 - 항상 표시 */}
            <Card className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <CardContent className="p-3">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      설정
                    </span>
                  </div>
                  <div className="space-y-1 text-blue-700 dark:text-blue-300">
                    <p className="truncate">
                      <span className="font-medium">URL:</span>{" "}
                      {url
                        ? (() => {
                            try {
                              return new URL(url).hostname;
                            } catch {
                              return url;
                            }
                          })()
                        : "URL을 입력하세요"}
                    </p>
                    <p>
                      <span className="font-medium">정렬:</span>{" "}
                      {sortOptions.find((opt) => opt.value === sort)?.label}
                    </p>
                    <p>
                      <span className="font-medium">페이지:</span> 최대{" "}
                      {maxPages}
                      페이지
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex-1 overflow-hidden min-h-[600px]">
              <CrawlerProgress
                progress={progress}
                isLoading={isLoading}
                error={error || undefined}
                progressPercentage={stats.progressPercentage}
              />
            </div>
          </div>

          {/* 모바일에서는 가로로 배치 */}
          <div className="xl:hidden grid grid-cols-3 gap-4">
            <CrawlerStats stats={stats} />

            {/* 설정요약 - 항상 표시 */}
            <Card className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 h-fit">
              <CardContent className="p-3">
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Globe className="w-3 h-3 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      설정
                    </span>
                  </div>
                  <div className="space-y-1 text-blue-700 dark:text-blue-300">
                    <p className="truncate">
                      <span className="font-medium">URL:</span>{" "}
                      {url
                        ? (() => {
                            try {
                              return new URL(url).hostname;
                            } catch {
                              return url;
                            }
                          })()
                        : "URL을 입력하세요"}
                    </p>
                    <p>
                      <span className="font-medium">정렬:</span>{" "}
                      {sortOptions.find((opt) => opt.value === sort)?.label}
                    </p>
                    <p>
                      <span className="font-medium">페이지:</span> 최대{" "}
                      {maxPages}
                      페이지
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <CrawlerProgress
              progress={progress}
              isLoading={isLoading}
              error={error || undefined}
              progressPercentage={stats.progressPercentage}
            />
          </div>
        </div>

        {/* 모바일에서만 테이블을 맨 아래에 표시 */}
        <div className="col-span-1 xl:hidden order-3 h-96">
          <CrawlerResults
            finalResult={finalResult}
            isLoading={isLoading}
            crawledReviews={stats.crawledReviews}
          />
        </div>
      </div>
    </FluidLayout>
  );
}
