import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Play,
  Settings,
  Database,
  Globe,
  TrendingUp,
  Clock,
  FileText,
  AlertCircle,
  LogIn,
  Navigation,
  MousePointer,
  Download,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import AgGridTable from "@/components/AgGridTable";
import { useReviewsCrawlWithProgress } from "@/hooks/useReviewsCrawl";
import LabelRadio from "@/components/LabelRadio";
import LabelInput from "@/components/LabelInput";
import { formatMilliSecondsToMinutes } from "@/lib/utils";
import FluidLayout from "@/components/layouts/FluidLayout";

const VALID_URL = ["smartstore.naver.com", "brand.naver.com"];

export const Route = createFileRoute("/_authenticated/crawler")({
  component: CrawlerComponent,
});

function CrawlerComponent() {
  const [url, setUrl] = useState("");
  const [sort, setSort] = useState<
    "ranking" | "latest" | "high-rating" | "low-rating"
  >("ranking");
  const [maxPages, setMaxPages] = useState(5);

  const { 
    crawlWithProgress, 
    progress, 
    isLoading, 
    finalResult, 
    error 
  } = useReviewsCrawlWithProgress();

  // URL 유효성 검사
  const isValidUrl = useMemo(() => {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return VALID_URL.includes(urlObj.hostname);
    } catch {
      return false;
    }
  }, [url]);

  const urlError = useMemo(() => {
    if (!url) return null;
    if (!isValidUrl) {
      return "올바른 네이버 스마트스토어 URL을 입력해주세요";
    }
    return null;
  }, [url, isValidUrl]);

  const sortOptions = [
    { value: "ranking", label: "랭킹순" },
    { value: "latest", label: "최신순" },
    { value: "high-rating", label: "높은평점순" },
    { value: "low-rating", label: "낮은평점순" },
  ];

  const handleStartCrawling = () => {
    if (!isValidUrl) return;
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

  const columnDefs = [
    { headerName: "리뷰 번호", field: "id" },
    { headerName: "작성자", field: "author" },
    { headerName: "상품 정보", field: "productInfo" },
    { headerName: "평점", field: "rating" },
    { headerName: "내용", field: "content" },
    {
      headerName: "이미지",
      field: "image",
      cellRenderer: ({ value }: { value: string }) =>
        (value && (
          <img
            src={value}
            alt="리뷰 이미지"
            className="w-16 h-16 object-cover rounded-md"
          />
        )) ||
        "없음",
    },
    { headerName: "날짜", field: "date" },
  ];

  return (
    <FluidLayout>
      <div className="space-y-6">
        {/* 크롤링 설정 */}
        <Card className="bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800">
          <CardHeader className="space-y-1 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-gray-900 dark:text-white">
                  크롤링 설정
                </CardTitle>
                <CardDescription>
                  수집할 리뷰의 조건을 설정해주세요
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* URL 입력 */}
            <div className="space-y-2">
              <LabelInput
                variant="default"
                id="url"
                label="스마트스토어 URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://brand.naver.com/..."
                error={urlError}
                success={url && isValidUrl ? "유효한 URL입니다" : null}
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 정렬 기준 */}
              <div className="space-y-3">
                <LabelRadio
                  variant="card"
                  label="정렬 기준"
                  name="sort"
                  value={sort}
                  onValueChange={(value) =>
                    setSort(
                      value as
                        | "ranking"
                        | "latest"
                        | "high-rating"
                        | "low-rating"
                    )
                  }
                  options={[
                    {
                      value: "ranking",
                      label: "랭킹순",
                      description: "인기도 기준으로 정렬",
                      icon: <TrendingUp className="w-4 h-4" />,
                    },
                    {
                      value: "latest",
                      label: "최신순",
                      description: "최근 작성된 순서로 정렬",
                      icon: <Clock className="w-4 h-4" />,
                    },
                    {
                      value: "high-rating",
                      label: "높은평점순",
                      description: "평점이 높은 순서로 정렬",
                      icon: <TrendingUp className="w-4 h-4" />,
                    },
                    {
                      value: "low-rating",
                      label: "낮은평점순",
                      description: "평점이 낮은 순서로 정렬",
                      icon: <TrendingUp className="w-4 h-4" />,
                    },
                  ]}
                />
              </div>

              {/* 최대 페이지 수 */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  최대 페이지 수
                </label>

                {/* 빠른 선택 버튼들 */}
                <div className="flex flex-wrap gap-2">
                  {[1, 5, 10, 20, 50, 100].map((page) => (
                    <Button
                      key={page}
                      variant={maxPages === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMaxPages(page)}
                      className={`
                          px-3 py-1 text-sm font-medium rounded-md transition-all duration-200
                          ${
                            maxPages === page
                              ? "bg-blue-600 text-white shadow-md"
                              : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }
                        `}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                {/* 직접 입력 */}
                <div className="space-y-2">
                  <LabelInput
                    variant="default"
                    id="maxPages"
                    label="또는 직접 입력"
                    type="number"
                    value={maxPages}
                    onChange={(e) => setMaxPages(Number(e.target.value))}
                    placeholder="페이지 수 입력"
                    min="1"
                    max="100"
                    className="max-w-xs"
                  />
                  <p className="text-xs text-muted-foreground">
                    1-100 페이지까지 설정 가능 • 현재 설정:{" "}
                    <span className="font-semibold text-blue-600">
                      {maxPages}페이지
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <Separator className="bg-gray-200 dark:bg-gray-700" />

            {/* 크롤링 시작 버튼 */}
            <div className="flex justify-end">
              <Button
                onClick={handleStartCrawling}
                disabled={!isValidUrl || isLoading}
                className={`
                    px-8 py-3 font-medium rounded-lg transition-all duration-200 
                    ${
                      !isValidUrl || isLoading
                        ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                    }
                  `}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                    크롤링 중... ({stats.progressPercentage}%)
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    크롤링 시작
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 크롤링 정보 요약 */}
        {url && isValidUrl && (
          <Card className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div className="space-y-2 flex-1 min-w-0">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    크롤링 설정 요약
                  </h3>
                  <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                    <div className="space-y-1">
                      <span className="font-medium">URL:</span>
                      <p className="break-all text-xs sm:text-sm bg-white/50 dark:bg-gray-800/50 px-2 py-1 rounded border ml-0 mt-1">
                        {url}
                      </p>
                    </div>
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
              </div>
            </CardContent>
          </Card>
        )}

        {/* 진행 상황 표시 */}
        {(isLoading || progress.elapsedTime > 0) && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    {progress.status === "logging_in" ? (
                      <LogIn className="w-5 h-5 text-white" />
                    ) : progress.status === "navigating" ? (
                      <Navigation className="w-5 h-5 text-white" />
                    ) : progress.status === "scrolling" ? (
                      <MousePointer className="w-5 h-5 text-white" />
                    ) : progress.status === "finding_reviews" ||
                      progress.status === "loading_reviews" ? (
                      <Search className="w-5 h-5 text-white" />
                    ) : progress.status === "extracting_reviews" ? (
                      <Download className="w-5 h-5 text-white" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      크롤링 진행 중...
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {progress.message || "리뷰 데이터를 수집하고 있습니다..."}
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      페이지 {progress.currentPage}/
                      {progress.estimatedTotalPages} | 리뷰{" "}
                      {progress.crawledReviews.toLocaleString()}/
                      {progress.totalReviews.toLocaleString()} | 소요시간{" "}
                      {Math.floor(progress.elapsedTime / 1000)}초
                    </p>
                  </div>
                </div>

                {/* 프로그레스 바 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700 dark:text-blue-300">
                      진행률
                    </span>
                    <span className="text-blue-700 dark:text-blue-300">
                      {stats.progressPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-blue-100 dark:bg-blue-900/50 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 에러 표시 */}
        {error && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-300">
              크롤링 중 오류가 발생했습니다: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* 통계 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">총 리뷰</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.totalReviews.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">수집된 리뷰</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.crawledReviews.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    크롤링한 페이지
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.crawledPages}/{stats.estimatedPages}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-600 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">소요 시간</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.duration}초
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 리뷰 데이터 테이블 */}
        <Card className="bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800">
          <CardHeader className="space-y-1 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
                  <Database className="w-4 h-4 text-white dark:text-gray-900" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 dark:text-white">
                    크롤링 결과
                  </CardTitle>
                  <CardDescription>
                    수집된 리뷰 데이터를 확인하세요
                  </CardDescription>
                </div>
                {stats.crawledReviews > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100"
                  >
                    {stats.crawledReviews}건
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {finalResult?.reviews && finalResult.reviews.length > 0 ? (
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <AgGridTable columnDefs={columnDefs} rowData={finalResult.reviews} />
              </div>
            ) : !isLoading ? (
              <div className="w-full h-64 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="text-center space-y-3">
                  <Database className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto" />
                  <div className="space-y-1">
                    <p className="font-medium text-gray-600 dark:text-gray-400">
                      데이터가 없습니다
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500">
                      URL을 입력하고 크롤링을 시작해보세요
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-64 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                  <div className="space-y-1">
                    <p className="font-medium text-blue-600">
                      크롤링 진행 중...
                    </p>
                    <p className="text-sm text-muted-foreground">
                      데이터를 수집하고 있습니다
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </FluidLayout>
  );
}
