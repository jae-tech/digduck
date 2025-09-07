import React from "react";
import UserLayout from "@/components/layouts/UserLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Search,
  Globe,
  FileText,
  Download,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  Users,
  Calendar,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useLicenseStore } from "@/features/license/store/license.store";

export function UserDashboard() {
  const { licenseInfo } = useLicenseStore();

  // 예시 데이터 - 실제로는 API에서 가져올 데이터
  const quickStats = {
    totalCrawls: 142,
    monthlyUsage: 1250,
    dataExports: 23,
    activeSessions: 3,
  };

  const recentActivities = [
    {
      id: 1,
      type: "crawl",
      title: "스마트스토어 리뷰 크롤링 완료",
      description: "1,245개의 리뷰 데이터 수집",
      time: "2시간 전",
      status: "completed",
    },
    {
      id: 2,
      type: "export",
      title: "네이버 블로그 데이터 내보내기",
      description: "Excel 파일로 332개 포스트 내보내기 완료",
      time: "5시간 전",
      status: "completed",
    },
    {
      id: 3,
      type: "insight",
      title: "쇼핑 인사이트 분석 시작",
      description: "2024년 1분기 쇼핑 트렌드 분석 중",
      time: "1일 전",
      status: "processing",
    },
  ];

  const quickActions = [
    {
      title: "스마트스토어 리뷰",
      description: "상품 리뷰를 수집하고 분석하세요",
      icon: <Search className="w-6 h-6 text-blue-600" />,
      href: "/crawler/review",
      badge: "인기",
    },
    {
      title: "네이버 블로그",
      description: "블로그 포스트를 체계적으로 수집하세요",
      icon: <Globe className="w-6 h-6 text-green-600" />,
      href: "/crawler/naver-blog",
      badge: "새로운",
    },
    {
      title: "쇼핑 인사이트",
      description: "시장 트렌드와 소비자 행동을 분석하세요",
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      href: "/crawler/insights",
      badge: undefined,
    },
  ];

  return (
    <UserLayout>
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">안녕하세요! 👋</h1>
            <p className="text-gray-600 mt-2">
              {licenseInfo?.userEmail || "사용자"}님의 크롤링 대시보드입니다
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 lg:mt-0">
            <Badge
              variant="outline"
              className="text-green-600 border-green-300"
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              라이센스 활성
            </Badge>
            <span className="text-sm text-gray-500">
              {new Date().toLocaleDateString("ko-KR")}
            </span>
          </div>
        </div>

        {/* 빠른 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    전체 크롤링
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {quickStats.totalCrawls.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Activity className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    이번 달 사용량
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {quickStats.monthlyUsage.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    데이터 내보내기
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {quickStats.dataExports}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Download className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">활성 세션</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {quickStats.activeSessions}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* 빠른 시작 */}
          <div className="xl:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  빠른 시작
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action) => (
                    <Link key={action.href} to={action.href}>
                      <Card className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] border border-gray-200 hover:border-blue-300">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="p-2 bg-gray-50 rounded-lg">
                              {action.icon}
                            </div>
                            {action.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {action.badge}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {action.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {action.description}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 최근 활동 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                최근 활동
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      {activity.status === "completed" ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {activity.description}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {activity.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 도움말 및 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              서비스 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center p-4">
                <div className="p-3 bg-blue-100 rounded-full w-fit mx-auto mb-3">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  크롤링 서비스
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  네이버 상품 리뷰와 블로그 포스트를 수집하세요
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/crawler/review">시작하기</Link>
                </Button>
              </div>

              <div className="text-center p-4">
                <div className="p-3 bg-green-100 rounded-full w-fit mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  쇼핑 인사이트
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  네이버 쇼핑 트렌드와 카테고리별 분석 데이터
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/crawler/insights">분석 보기</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UserLayout>
  );
}
