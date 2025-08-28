import { useMemo } from "react";
import { Play, Settings, Globe, TrendingUp, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import LabelRadio from "@/components/LabelRadio";
import LabelInput from "@/components/LabelInput";
import { CrawlSort, SortOption } from "../types/crawler.types";

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
                onValueChange={(value) => setSort(value as CrawlSort)}
                options={sortOptions.map((option) => ({
                  value: option.value,
                  label: option.label,
                  description: option.description,
                  icon: option.icon,
                }))}
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
              onClick={onStartCrawling}
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
                  크롤링 중... ({progressPercentage}%)
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
    </>
  );
}