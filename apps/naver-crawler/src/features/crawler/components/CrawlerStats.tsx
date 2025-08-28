import { Database, FileText, TrendingUp, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsData {
  totalReviews: number;
  crawledReviews: number;
  crawledPages: number;
  estimatedPages: number;
  duration: number;
  progressPercentage: number;
}

interface CrawlerStatsProps {
  stats: StatsData;
}

export function CrawlerStats({ stats }: CrawlerStatsProps) {
  const statsCards = [
    {
      title: "총 리뷰",
      value: stats.totalReviews.toLocaleString(),
      icon: Database,
      bgColor: "bg-purple-600",
    },
    {
      title: "수집된 리뷰",
      value: stats.crawledReviews.toLocaleString(),
      icon: FileText,
      bgColor: "bg-green-600",
    },
    {
      title: "크롤링한 페이지",
      value: `${stats.crawledPages}/${stats.estimatedPages}`,
      icon: TrendingUp,
      bgColor: "bg-blue-600",
    },
    {
      title: "소요 시간",
      value: `${stats.duration}초`,
      icon: Clock,
      bgColor: "bg-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:shadow-lg transition-shadow"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}