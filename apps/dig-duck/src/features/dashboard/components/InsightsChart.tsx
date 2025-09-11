import React, { useMemo, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
  type ChartData,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Users, Calendar } from "lucide-react";
import type { InsightsDataPoint } from "@/features/crawler/types/crawler.types";

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

interface InsightsChartProps {
  data: InsightsDataPoint[];
  title: string;
  type: "line" | "area" | "bar" | "doughnut";
  showTrend?: boolean;
  height?: number;
}

// 2025 트렌디 컬러 팔레트 (Glassmorphism 스타일)
const COLORS = [
  "rgba(59, 130, 246, 0.8)", // Blue
  "rgba(239, 68, 68, 0.8)", // Red
  "rgba(16, 185, 129, 0.8)", // Green
  "rgba(245, 158, 11, 0.8)", // Orange
  "rgba(139, 92, 246, 0.8)", // Purple
  "rgba(6, 182, 212, 0.8)", // Cyan
  "rgba(236, 72, 153, 0.8)", // Pink
  "rgba(132, 204, 22, 0.8)", // Lime
];

const BORDER_COLORS = [
  "rgb(59, 130, 246)",
  "rgb(239, 68, 68)",
  "rgb(16, 185, 129)",
  "rgb(245, 158, 11)",
  "rgb(139, 92, 246)",
  "rgb(6, 182, 212)",
  "rgb(236, 72, 153)",
  "rgb(132, 204, 22)",
];

export const InsightsChart: React.FC<InsightsChartProps> = ({
  data,
  title,
  type,
  showTrend = true,
  height = 300,
}) => {
  const chartRef = useRef<ChartJS>(null);

  // 트렌드 계산
  const trendData = useMemo(() => {
    if (!data.length || !showTrend) return null;

    const recent = data.slice(-7);
    const older = data.slice(-14, -7);

    if (!recent.length || !older.length) return null;

    const recentAvg =
      recent.reduce((sum, d) => sum + d.ratio, 0) / recent.length;
    const olderAvg = older.reduce((sum, d) => sum + d.ratio, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    const isPositive = change > 0;

    return {
      change: Math.abs(change).toFixed(1),
      isPositive,
      recentAvg: recentAvg.toFixed(1),
    };
  }, [data, showTrend]);

  // Chart.js 데이터 및 옵션 설정
  const chartData: ChartData<any> = useMemo(() => {
    const labels = data.map((d) => d.period);
    const values = data.map((d) => d.ratio);

    switch (type) {
      case "line":
        return {
          labels,
          datasets: [
            {
              label: "검색 비율",
              data: values,
              borderColor: BORDER_COLORS[0],
              backgroundColor: COLORS[0],
              borderWidth: 3,
              pointRadius: 6,
              pointHoverRadius: 8,
              pointBackgroundColor: BORDER_COLORS[0],
              pointBorderColor: "#ffffff",
              pointBorderWidth: 2,
              tension: 0.4,
            },
          ],
        };

      case "area":
        return {
          labels,
          datasets: [
            {
              label: "검색 비율",
              data: values,
              borderColor: BORDER_COLORS[0],
              backgroundColor: COLORS[0],
              borderWidth: 3,
              fill: true,
              tension: 0.4,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        };

      case "bar":
        return {
          labels,
          datasets: [
            {
              label: "검색 비율",
              data: values,
              backgroundColor: values.map(
                (_, index) => COLORS[index % COLORS.length],
              ),
              borderColor: values.map(
                (_, index) => BORDER_COLORS[index % BORDER_COLORS.length],
              ),
              borderWidth: 2,
              borderRadius: 8,
              borderSkipped: false,
            },
          ],
        };

      case "doughnut":
        return {
          labels: labels.slice(0, 8), // 최대 8개만 표시
          datasets: [
            {
              data: values.slice(0, 8),
              backgroundColor: COLORS,
              borderColor: BORDER_COLORS,
              borderWidth: 3,
              hoverBorderWidth: 4,
            },
          ],
        };

      default:
        return { labels: [], datasets: [] };
    }
  }, [data, type]);

  // Chart.js 옵션 (2025 트렌디 스타일)
  const chartOptions: ChartOptions<any> = useMemo(() => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: type === "doughnut",
          position: "bottom" as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            font: {
              size: 12,
              family: "Inter, system-ui, sans-serif",
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          borderColor: "rgba(255, 255, 255, 0.2)",
          borderWidth: 1,
          cornerRadius: 12,
          displayColors: true,
          padding: 12,
          titleFont: {
            size: 14,
            weight: "bold" as const,
          },
          bodyFont: {
            size: 13,
          },
        },
      },
      animation: {
        duration: 1200,
        easing: "easeInOutQuart" as const,
      },
      interaction: {
        intersect: false,
        mode: "index" as const,
      },
    };

    if (type === "doughnut") {
      return {
        ...baseOptions,
        cutout: "70%",
        plugins: {
          ...baseOptions.plugins,
          legend: {
            ...baseOptions.plugins.legend,
            display: true,
          },
        },
      };
    }

    return {
      ...baseOptions,
      scales: {
        x: {
          grid: {
            color: "rgba(156, 163, 175, 0.2)",
            lineWidth: 1,
          },
          ticks: {
            color: "#6B7280",
            font: {
              size: 11,
              family: "Inter, system-ui, sans-serif",
            },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: "rgba(156, 163, 175, 0.2)",
            lineWidth: 1,
          },
          ticks: {
            color: "#6B7280",
            font: {
              size: 11,
              family: "Inter, system-ui, sans-serif",
            },
          },
        },
      },
    };
  }, [type]);

  // 차트 렌더링 함수
  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <Line ref={chartRef as any} data={chartData} options={chartOptions} />
        );

      case "area":
        return (
          <Line ref={chartRef as any} data={chartData} options={chartOptions} />
        );

      case "bar":
        return (
          <Bar ref={chartRef as any} data={chartData} options={chartOptions} />
        );

      case "doughnut":
        return (
          <Doughnut
            ref={chartRef as any}
            data={chartData}
            options={chartOptions}
          />
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full"
    >
      <Card className="w-full backdrop-blur-sm bg-white/90 shadow-xl border border-gray-200/50 rounded-2xl">
        <CardHeader className="pb-2">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center justify-between"
          >
            <CardTitle className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
              <span>{title}</span>
            </CardTitle>
            {trendData && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                className="flex items-center space-x-2"
              >
                <Badge
                  variant={trendData.isPositive ? "default" : "destructive"}
                  className={`flex items-center space-x-1 ${
                    trendData.isPositive
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0"
                      : "bg-gradient-to-r from-red-500 to-pink-600 text-white border-0"
                  }`}
                >
                  {trendData.isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{trendData.change}%</span>
                </Badge>
                <span className="text-sm text-gray-600 font-medium">
                  평균 {trendData.recentAvg}
                </span>
              </motion.div>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="flex items-center space-x-4 text-xs text-gray-500"
          >
            <div className="flex items-center space-x-1">
              <Calendar className="w-3 h-3" />
              <span>총 {data.length}개 데이터포인트</span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3" />
              <span>최대값: {Math.max(...data.map((d) => d.ratio))}</span>
            </div>
          </motion.div>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="w-full"
            style={{ height }}
          >
            {renderChart()}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default InsightsChart;
