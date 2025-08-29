import { useState, useEffect } from "react";
import {
  LogIn,
  Navigation,
  MousePointer,
  Search,
  Download,
  AlertCircle,
  Clock,
  Activity,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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

interface LogEntry {
  timestamp: string;
  status?: string;
  message: string;
  icon: React.ReactNode;
}

export function CrawlerProgress({
  progress,
  isLoading,
  error,
  progressPercentage,
}: CrawlerProgressProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "logging_in":
        return <LogIn className="w-3 h-3" />;
      case "navigating":
        return <Navigation className="w-3 h-3" />;
      case "scrolling":
        return <MousePointer className="w-3 h-3" />;
      case "finding_reviews":
      case "loading_reviews":
        return <Search className="w-3 h-3" />;
      case "extracting_reviews":
        return <Download className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  // 진행상황이 변경될 때마다 로그 추가 (최신이 위로)
  useEffect(() => {
    // 크롤링이 실제로 진행 중일 때만 로그 추가
    if (isLoading && (progress.message || progress.status)) {
      const newLog: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        status: progress.status,
        message: progress.message || `${progress.status} 진행 중...`,
        icon: getStatusIcon(progress.status),
      };
      
      setLogs(prev => {
        // 중복 메시지 방지
        const isDuplicate = prev.length > 0 && 
          prev[0].message === newLog.message;
        
        if (!isDuplicate) {
          return [newLog, ...prev.slice(0, 4)]; // 최신을 맨 위에, 최대 5개 유지
        }
        return prev;
      });
    }

    // 에러가 발생했을 때 로그에 추가
    if (error) {
      const errorLog: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        status: "error",
        message: error,
        icon: <AlertCircle className="w-3 h-3 text-red-500" />,
      };
      
      setLogs(prev => {
        const isDuplicate = prev.length > 0 && 
          prev[0].message === errorLog.message;
        
        if (!isDuplicate) {
          return [errorLog, ...prev.slice(0, 4)];
        }
        return prev;
      });
    }
  }, [progress.message, progress.status, progress.currentPage, isLoading, error]);

  // 새로운 크롤링 시작시 로그 초기화
  useEffect(() => {
    if (isLoading) {
      // 완전히 초기화 후 시작 메시지 추가
      setLogs([{
        timestamp: new Date().toLocaleTimeString(),
        message: "크롤링을 시작합니다...",
        icon: <Activity className="w-3 h-3" />,
      }]);
    }
  }, [isLoading]);

  return (
    <>
      {/* 진행 상황 로그 - 항상 표시 */}
      <Card className="bg-white dark:bg-gray-900 shadow border flex-1">
        <CardContent className="p-4 h-full flex flex-col">
          <div className="space-y-3 flex-1">
            {/* 현재 상태 */}
            <div className="flex items-center gap-2">
              {error ? (
                <AlertCircle className="w-4 h-4 text-red-500" />
              ) : (
                <Clock className="w-4 h-4 text-blue-600" />
              )}
              <span className="text-sm font-medium">
                {error ? "오류 발생" : "진행상황"}
              </span>
              {progressPercentage > 0 && !error && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {progressPercentage}%
                </span>
              )}
              {error && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                  오류
                </span>
              )}
            </div>

            {/* 로그 엔트리들 */}
            <div className="space-y-1 flex-1 overflow-y-auto">
              {logs.length > 0 ? (
                logs.map((log, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-16 flex-shrink-0">
                      {log.timestamp}
                    </span>
                    <div className="text-gray-600 flex-shrink-0">
                      {log.icon}
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 truncate">
                      {log.message}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-500 text-center flex-1 flex items-center justify-center">
                  크롤링을 시작하면 진행상황이 여기에 표시됩니다
                </div>
              )}
            </div>

            {/* 현재 진행률 바 */}
            {progressPercentage > 0 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                <div
                  className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </>
  );
}