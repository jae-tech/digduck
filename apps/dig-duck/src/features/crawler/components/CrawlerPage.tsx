import { useState } from "react";
import UserLayout from "@/components/layouts/UserLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useReviewsCrawlWithProgress } from "../hooks/useCrawler";
import { useLicenseStore } from "@/features/license/store/license.store";
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

  const { isAdminUser } = useLicenseStore();
  const isAdmin = isAdminUser();

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
    crawlWithProgress({ url, sort, maxPages, useUserIp: true });
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

  const CrawlerContent = () => (
    <div className="min-h-[calc(100vh-6rem)] p-4">
      {/* Mobile/Tablet: Stack layout */}
      <div className="space-y-4 lg:hidden">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CrawlerStats stats={stats} />
          <CrawlerProgress
            progress={progress}
            isLoading={isLoading}
            error={error || undefined}
            progressPercentage={stats.progressPercentage}
          />
        </div>

        <CrawlerResults
          finalResult={finalResult}
          isLoading={isLoading}
          crawledReviews={stats.crawledReviews}
        />
      </div>

      {/* Desktop: Grid layout */}
      <div className="hidden lg:grid lg:grid-cols-4 lg:grid-rows-3 gap-4 h-[calc(100vh-8rem)]">
        {/* Settings - spans 3 columns */}
        <div className="lg:col-span-3 lg:row-start-1">
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
        </div>

        {/* Stats sidebar - spans 2 rows */}
        <div className="lg:col-start-4 lg:row-span-3 flex flex-col h-full space-y-4">
          <CrawlerStats stats={stats} />
          <Card className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <CardContent className="p-3">
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <Globe className="w-3 h-3 text-blue-600" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    설정 요약
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
                    <span className="font-medium">페이지:</span> 최대 {maxPages}
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

        {/* Results - spans 3 columns */}
        <div className="lg:col-span-3 lg:row-span-3 lg:row-start-2 overflow-hidden">
          <CrawlerResults
            finalResult={finalResult}
            isLoading={isLoading}
            crawledReviews={stats.crawledReviews}
          />
        </div>
      </div>
    </div>
  );

  return isAdmin ? (
    <AdminLayout>
      <CrawlerContent />
    </AdminLayout>
  ) : (
    <UserLayout>
      <CrawlerContent />
    </UserLayout>
  );
}
