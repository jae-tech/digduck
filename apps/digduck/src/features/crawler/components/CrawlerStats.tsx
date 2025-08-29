import { Database } from "lucide-react";
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
  const statsData = [
    { label: "총 리뷰", value: stats.totalReviews.toLocaleString() },
    { label: "수집", value: stats.crawledReviews.toLocaleString() },
    { label: "페이지", value: `${stats.crawledPages}/${stats.estimatedPages}` },
    { label: "시간", value: `${stats.duration}초` },
  ];

  return (
    <Card className="bg-white dark:bg-gray-900 shadow border h-fit">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium">통계</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {statsData.map((stat, index) => (
              <div key={index} className="flex justify-between">
                <span className="text-gray-500">{stat.label}:</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
