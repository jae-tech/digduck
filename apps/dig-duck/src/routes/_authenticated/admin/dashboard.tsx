import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { requireAdmin } from "@/middleware/auth.middleware";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Activity,
  Users,
  Search,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Globe,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  beforeLoad: requireAdmin,
  component: RouteComponent,
});

// 모의 데이터 타입 정의
interface CrawlingStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  todayRequests: number;
  averageResponseTime: number;
}

interface UserActivity {
  activeUsers: number;
  totalUsers: number;
  newUsersToday: number;
  userGrowth: number;
}

interface SystemStatus {
  apiStatus: "healthy" | "warning" | "error";
  crawlerStatus: "running" | "idle" | "maintenance";
  dbStatus: "connected" | "slow" | "disconnected";
  uptime: string;
}

interface RecentActivity {
  id: string;
  type: "crawl" | "user" | "system";
  message: string;
  timestamp: string;
  status: "success" | "warning" | "error";
}

function RouteComponent() {
  const [crawlingStats, setCrawlingStats] = useState<CrawlingStats>({
    totalRequests: 45231,
    successfulRequests: 42156,
    failedRequests: 3075,
    todayRequests: 1247,
    averageResponseTime: 1.8,
  });

  const [userActivity] = useState<UserActivity>({
    activeUsers: 156,
    totalUsers: 2847,
    newUsersToday: 23,
    userGrowth: 12.5,
  });

  const [systemStatus] = useState<SystemStatus>({
    apiStatus: "healthy",
    crawlerStatus: "running",
    dbStatus: "connected",
    uptime: "15일 4시간 23분",
  });

  const [recentActivity] = useState<RecentActivity[]>([
    {
      id: "1",
      type: "crawl",
      message: "네이버 쇼핑 크롤링 완료 - 1,234개 상품",
      timestamp: "2분 전",
      status: "success",
    },
    {
      id: "2",
      type: "user",
      message: "새 사용자 등록: user@digduck.app",
      timestamp: "5분 전",
      status: "success",
    },
    {
      id: "3",
      type: "system",
      message: "일일 백업 완료",
      timestamp: "1시간 전",
      status: "success",
    },
    {
      id: "4",
      type: "crawl",
      message: "쿠팡 크롤링 일시 지연",
      timestamp: "2시간 전",
      status: "warning",
    },
    {
      id: "5",
      type: "system",
      message: "서버 메모리 사용률 85%",
      timestamp: "3시간 전",
      status: "warning",
    },
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // 실제 API 호출 시뮬레이션
    setTimeout(() => {
      setCrawlingStats((prev) => ({
        ...prev,
        todayRequests: prev.todayRequests + Math.floor(Math.random() * 10),
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 10),
      }));
      setIsRefreshing(false);
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "running":
      case "success":
        return "text-green-600 bg-green-100";
      case "warning":
      case "slow":
      case "idle":
        return "text-yellow-600 bg-yellow-100";
      case "error":
      case "disconnected":
      case "maintenance":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
      case "connected":
      case "running":
      case "success":
        return <CheckCircle className="w-4 h-4" />;
      case "warning":
      case "slow":
      case "idle":
        return <AlertTriangle className="w-4 h-4" />;
      case "error":
      case "disconnected":
      case "maintenance":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 헤더 영역 */}
        <div className="flex justify-end items-center">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "새로고침 중..." : "새로고침"}
          </Button>
        </div>

        {/* 주요 지표 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 오늘의 크롤링 요청 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">오늘 크롤링</CardTitle>
              <Search className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {crawlingStats.todayRequests.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600">
                성공률:{" "}
                {Math.round(
                  (crawlingStats.successfulRequests /
                    crawlingStats.totalRequests) *
                    100
                )}
                %
              </p>
            </CardContent>
          </Card>

          {/* 활성 사용자 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 사용자</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {userActivity.activeUsers}
              </div>
              <p className="text-xs text-gray-600">
                전체 {userActivity.totalUsers.toLocaleString()}명 중
              </p>
            </CardContent>
          </Card>

          {/* 평균 응답 시간 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                평균 응답시간
              </CardTitle>
              <Activity className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {crawlingStats.averageResponseTime}초
              </div>
              <p className="text-xs text-gray-600">지난 24시간 평균</p>
            </CardContent>
          </Card>

          {/* 시스템 가동시간 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                시스템 가동시간
              </CardTitle>
              <Clock className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {systemStatus.uptime}
              </div>
              <p className="text-xs text-gray-600">안정적으로 운영 중</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 시스템 상태 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                시스템 상태
              </CardTitle>
              <CardDescription>
                각 시스템 컴포넌트의 실시간 상태를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">API 서버</span>
                </div>
                <Badge className={getStatusColor(systemStatus.apiStatus)}>
                  {getStatusIcon(systemStatus.apiStatus)}
                  <span className="ml-1">정상</span>
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">크롤러</span>
                </div>
                <Badge className={getStatusColor(systemStatus.crawlerStatus)}>
                  {getStatusIcon(systemStatus.crawlerStatus)}
                  <span className="ml-1">실행 중</span>
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">데이터베이스</span>
                </div>
                <Badge className={getStatusColor(systemStatus.dbStatus)}>
                  {getStatusIcon(systemStatus.dbStatus)}
                  <span className="ml-1">연결됨</span>
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 최근 활동 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                최근 활동
              </CardTitle>
              <CardDescription>
                시스템에서 발생한 최근 이벤트를 확인하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50"
                  >
                    <div
                      className={`p-1 rounded-full ${getStatusColor(activity.status)}`}
                    >
                      {getStatusIcon(activity.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 크롤링 통계 상세 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              크롤링 통계
            </CardTitle>
            <CardDescription>
              전체 크롤링 요청에 대한 상세 통계입니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {crawlingStats.totalRequests.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">전체 요청 수</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {crawlingStats.successfulRequests.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">성공한 요청</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {crawlingStats.failedRequests.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600">실패한 요청</p>
              </div>
            </div>

            {/* 진행률 바 */}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>성공률</span>
                <span>
                  {Math.round(
                    (crawlingStats.successfulRequests /
                      crawlingStats.totalRequests) *
                      100
                  )}
                  %
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(crawlingStats.successfulRequests / crawlingStats.totalRequests) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
