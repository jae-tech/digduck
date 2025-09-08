import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Share2,
  BarChart3,
  TrendingUp,
  Calendar,
  Target,
  Crown,
  AlertCircle,
} from "lucide-react";
import { InsightsChart } from "./InsightsChart";
import type {
  ShoppingInsightsResult,
} from "@/features/crawler/types/crawler.types";

interface InsightsDashboardProps {
  data: ShoppingInsightsResult;
  searchParams: {
    startDate: string;
    endDate: string;
    timeUnit: string;
    categoryName: string;
    device?: string;
    gender?: string;
    ages?: string[];
  };
  onExport: (format: "excel" | "csv" | "pdf") => void;
  onShareToSheets: () => void;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({
  data,
  searchParams,
  onExport,
  onShareToSheets,
}) => {
  const [selectedChart, setSelectedChart] = useState<
    "line" | "area" | "bar" | "doughnut"
  >("area");

  // 핵심 인사이트 계산
  const insights = useMemo(() => {
    const sortedData = [...data.data].sort((a, b) => b.ratio - a.ratio);
    const avgRatio =
      data.data.reduce((sum, d) => sum + d.ratio, 0) / data.data.length;
    const maxRatio = Math.max(...data.data.map((d) => d.ratio));
    const minRatio = Math.min(...data.data.map((d) => d.ratio));
    const peakPeriod = sortedData[0];
    const lowPeriod = [...data.data].sort((a, b) => a.ratio - b.ratio)[0];

    // 트렌드 분석
    const recent = data.data.slice(-7);
    const older = data.data.slice(-14, -7);
    let trendDirection = "stable";
    let trendPercentage = 0;

    if (recent.length && older.length) {
      const recentAvg =
        recent.reduce((sum, d) => sum + d.ratio, 0) / recent.length;
      const olderAvg =
        older.reduce((sum, d) => sum + d.ratio, 0) / older.length;
      trendPercentage = ((recentAvg - olderAvg) / olderAvg) * 100;

      if (Math.abs(trendPercentage) > 5) {
        trendDirection = trendPercentage > 0 ? "increasing" : "decreasing";
      }
    }

    return {
      avgRatio: avgRatio.toFixed(1),
      maxRatio,
      minRatio,
      peakPeriod,
      lowPeriod,
      trendDirection,
      trendPercentage: Math.abs(trendPercentage).toFixed(1),
      volatility: (((maxRatio - minRatio) / avgRatio) * 100).toFixed(1),
    };
  }, [data.data]);

  // 성과 요약 카드들
  const StatCard = ({ icon: Icon, title, value, subtitle, trend }: any) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          {trend && (
            <Badge
              variant={trend.type === "positive" ? "default" : "destructive"}
              className="ml-2"
            >
              {trend.value}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* 대시보드 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            인사이트 대시보드
          </h1>
          <p className="text-gray-600 mt-1">
            {searchParams.categoryName} 카테고리 분석 결과
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport("excel")}
            className="flex items-center space-x-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport("csv")}
            className="flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport("pdf")}
            className="flex items-center space-x-2"
          >
            <FileText className="w-4 h-4" />
            <span>PDF</span>
          </Button>
          <Button
            size="sm"
            onClick={onShareToSheets}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
          >
            <Share2 className="w-4 h-4" />
            <span>Google Sheets</span>
          </Button>
        </div>
      </div>

      {/* 핵심 지표 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BarChart3}
          title="평균 검색 비율"
          value={`${insights.avgRatio}`}
          subtitle="전체 기간 평균"
        />
        <StatCard
          icon={Crown}
          title="최고 검색 비율"
          value={`${insights.maxRatio}`}
          subtitle={`${insights.peakPeriod.period}`}
        />
        <StatCard
          icon={TrendingUp}
          title="최근 트렌드"
          value={
            insights.trendDirection === "increasing"
              ? "상승"
              : insights.trendDirection === "decreasing"
                ? "하락"
                : "안정"
          }
          subtitle={`${insights.trendPercentage}% 변화`}
          trend={
            insights.trendDirection !== "stable"
              ? {
                  type:
                    insights.trendDirection === "increasing"
                      ? "positive"
                      : "negative",
                  value: `${insights.trendPercentage}%`,
                }
              : null
          }
        />
        <StatCard
          icon={AlertCircle}
          title="변동성"
          value={`${insights.volatility}%`}
          subtitle="최고-최저 차이 비율"
        />
      </div>

      {/* 메인 차트 섹션 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>검색 클릭 추이 분석</CardTitle>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">차트 유형:</span>
              {["area", "line", "bar", "doughnut"].map((type) => (
                <Button
                  key={type}
                  variant={selectedChart === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedChart(type as any)}
                >
                  {type === "area"
                    ? "영역"
                    : type === "line"
                      ? "선"
                      : type === "bar"
                        ? "막대"
                        : "도넛"}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <InsightsChart
            data={data.data}
            title=""
            type={selectedChart}
            height={400}
            showTrend={true}
          />
        </CardContent>
      </Card>

      {/* 상세 분석 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 핵심 인사이트 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-blue-600" />
              <span>핵심 인사이트</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                🎯 최고 성과 기간
              </h4>
              <p className="text-sm text-gray-700">
                <strong>{insights.peakPeriod.period}</strong>에
                <strong className="text-blue-600">
                  {" "}
                  {insights.maxRatio}의 검색 비율
                </strong>
                을 기록하여 전체 기간 중 최고 성과를 달성했습니다.
              </p>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                📊 트렌드 분석
              </h4>
              <p className="text-sm text-gray-700">
                최근 데이터 기준으로 검색 비율이
                <strong
                  className={`ml-1 ${
                    insights.trendDirection === "increasing"
                      ? "text-green-600"
                      : insights.trendDirection === "decreasing"
                        ? "text-red-600"
                        : "text-gray-600"
                  }`}
                >
                  {insights.trendDirection === "increasing"
                    ? "상승 추세"
                    : insights.trendDirection === "decreasing"
                      ? "하락 추세"
                      : "안정 상태"}
                </strong>
                를 보이고 있습니다. ({insights.trendPercentage}% 변화)
              </p>
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">
                ⚡ 변동성 분석
              </h4>
              <p className="text-sm text-gray-700">
                전체 기간 동안 {insights.volatility}%의 변동성을 보였으며, 이는{" "}
                {parseFloat(insights.volatility) > 30
                  ? "높은"
                  : parseFloat(insights.volatility) > 15
                    ? "중간"
                    : "낮은"}
                변동성에 해당합니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 검색 조건 요약 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-600" />
              <span>분석 조건</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">분석 기간:</span>
                <p className="font-medium">
                  {searchParams.startDate} ~ {searchParams.endDate}
                </p>
              </div>
              <div>
                <span className="text-gray-600">데이터 구간:</span>
                <p className="font-medium">
                  {searchParams.timeUnit === "date"
                    ? "일간"
                    : searchParams.timeUnit === "week"
                      ? "주간"
                      : "월간"}
                </p>
              </div>
              <div>
                <span className="text-gray-600">카테고리:</span>
                <p className="font-medium">{searchParams.categoryName}</p>
              </div>
              <div>
                <span className="text-gray-600">총 데이터:</span>
                <p className="font-medium">{data.data.length}개 포인트</p>
              </div>
            </div>

            {(searchParams.device ||
              searchParams.gender ||
              searchParams.ages?.length) && (
              <>
                <Separator />
                <div>
                  <span className="text-gray-600 text-sm">적용된 필터:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {searchParams.device && (
                      <Badge variant="secondary">
                        기기: {searchParams.device === "pc" ? "PC" : "모바일"}
                      </Badge>
                    )}
                    {searchParams.gender && (
                      <Badge variant="secondary">
                        성별: {searchParams.gender === "m" ? "남성" : "여성"}
                      </Badge>
                    )}
                    {searchParams.ages?.map((age) => (
                      <Badge key={age} variant="secondary">
                        {age}대
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 키워드 분석 (있는 경우) */}
      {data.keywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>연관 키워드</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.keywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-sm px-3 py-1"
                >
                  #{keyword}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InsightsDashboard;
