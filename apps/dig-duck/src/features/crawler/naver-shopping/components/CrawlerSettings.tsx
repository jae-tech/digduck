import { useMemo } from "react";
import { Play, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CrawlSort, SortOption } from "../types";

const VALID_URL = ["smartstore.naver.com", "brand.naver.com"];

interface CrawlerSettingsProps {
  url: string;
  setUrl: (url: string) => void;
  sort: CrawlSort;
  setSort: (sort: CrawlSort) => void;
  maxPages: number;
  setMaxPages: (pages: number) => void;
  onStartCrawling: () => void;
  isLoading: boolean;
  progressPercentage: number;
}

export function CrawlerSettings({
  url,
  setUrl,
  sort,
  setSort,
  maxPages,
  setMaxPages,
  onStartCrawling,
  isLoading,
  progressPercentage,
}: CrawlerSettingsProps) {
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

  const sortOptions: SortOption[] = [
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
  ];

  return (
    <>
      {/* 크롤링 설정 */}
      <Card className="bg-white dark:bg-gray-900 shadow-lg border border-gray-200 dark:border-gray-800">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* URL 입력 - 첫 번째 줄 */}
            <div className="space-y-2">
              <Label htmlFor="url">스마트스토어 URL</Label>
              <Input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://brand.naver.com/..."
                autoComplete="off"
                className={
                  urlError
                    ? "border-red-500"
                    : url && isValidUrl
                      ? "border-green-500"
                      : ""
                }
              />
              {urlError && (
                <p className="text-xs text-red-600 dark:text-red-400">
                  {urlError}
                </p>
              )}
              {url && isValidUrl && !urlError && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  유효한 URL입니다
                </p>
              )}
            </div>

            {/* 나머지 설정들 - 두 번째 줄 */}
            <div className="flex gap-4 items-end">
              {/* 정렬 기준 */}
              <div className="w-32 space-y-2">
                <Label>정렬 기준</Label>
                <Select
                  value={sort}
                  onValueChange={(value) => setSort(value as CrawlSort)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="정렬 방식" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 최대 페이지 수 */}
              <div className="flex-1 space-y-2">
                <Label>최대 페이지 수</Label>
                <div className="flex gap-2">
                  {/* 빠른 선택 버튼들 */}
                  {[30, 50, 100].map((page) => (
                    <Button
                      key={page}
                      variant={maxPages === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMaxPages(page)}
                      className="px-3 py-1 text-xs h-9 flex-shrink-0"
                    >
                      {page}
                    </Button>
                  ))}
                  {/* 직접 입력 */}
                  <Input
                    type="number"
                    value={maxPages || ""}
                    onChange={(e) => setMaxPages(Number(e.target.value) || 0)}
                    placeholder="페이지"
                    min="0"
                    max="100"
                    className="h-9 text-xs w-20"
                  />
                </div>
              </div>

              {/* 크롤링 시작 버튼 */}
              <Button
                onClick={onStartCrawling}
                disabled={!isValidUrl || isLoading}
                size="default"
                className="h-9 px-6"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    {progressPercentage}%
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    크롤링 시작
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
