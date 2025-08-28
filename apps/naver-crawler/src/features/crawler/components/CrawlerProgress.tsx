import {
  LogIn,
  Navigation,
  MousePointer,
  Search,
  Download,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProgressData {
  totalReviews: number;
  crawledReviews: number;
  currentPage: number;
  estimatedTotalPages: number;
  elapsedTime: number;
  status?: string;
  message?: string;
}

interface CrawlerProgressProps {
  progress: ProgressData;
  isLoading: boolean;
  error?: string;
  progressPercentage: number;
}

export function CrawlerProgress({
  progress,
  isLoading,
  error,
  progressPercentage,
}: CrawlerProgressProps) {
  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "logging_in":
        return <LogIn className="w-5 h-5 text-white" />;
      case "navigating":
        return <Navigation className="w-5 h-5 text-white" />;
      case "scrolling":
        return <MousePointer className="w-5 h-5 text-white" />;
      case "finding_reviews":
      case "loading_reviews":
        return <Search className="w-5 h-5 text-white" />;
      case "extracting_reviews":
        return <Download className="w-5 h-5 text-white" />;
      default:
        return (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        );
    }
  };

  return (
    <>
      {/* 진행 상황 표시 */}
      {(isLoading || progress.elapsedTime > 0) && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                  {getStatusIcon(progress.status)}
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
                    {progressPercentage}%
                  </span>
                </div>
                <div className="w-full bg-blue-100 dark:bg-blue-900/50 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
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
    </>
  );
}