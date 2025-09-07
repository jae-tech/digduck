import { useState } from "react";
import UserLayout from "@/components/layouts/UserLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import { useLicenseStore } from "@/features/license/store/license.store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CompactRadio } from "@/components/ui/compact-radio";
import {
  Globe,
  Play,
  Pause,
  FileText,
  User,
  Calendar,
  Eye,
  MessageCircle,
  Tags,
  BookOpen,
  Folder,
  Link,
  AlertCircle,
  CheckCircle,
  Clock,
  ChevronLeft,
} from "lucide-react";
import { apiHelpers, type ApiError } from "@/lib/apiClient";

interface NaverBlogPost {
  title: string;
  content: string;
  author: string;
  publishDate: string;
  url: string;
  viewCount?: number;
  commentCount?: number;
  tags?: string[];
  category?: string;
  thumbnailUrl?: string;
}

interface BlogCategory {
  categoryNo: number;
  name: string;
  postCount: number;
  parentCategoryNo?: number;
  depth: number;
}

interface CrawlProgress {
  currentPage: number;
  totalPages: number;
  itemsFound: number;
  itemsCrawled: number;
  message?: string;
}

type CrawlMode = "single" | "category" | "blog";
type SearchStep = "blogId" | "mode" | "category" | "crawl";

export function NaverBlogCrawlerPage() {
  const [currentStep, setCurrentStep] = useState<SearchStep>("blogId");
  const [blogId, setBlogId] = useState("");
  const [mode, setMode] = useState<CrawlMode>("blog");
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [maxPages, setMaxPages] = useState(5);
  const [maxItems, setMaxItems] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingCategories, setIsFetchingCategories] = useState(false);
  const [progress, setProgress] = useState<CrawlProgress>({
    currentPage: 0,
    totalPages: 0,
    itemsFound: 0,
    itemsCrawled: 0,
  });
  const [results, setResults] = useState<NaverBlogPost[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { isAdminUser } = useLicenseStore();
  const isAdmin = isAdminUser();

  const modeOptions = [
    {
      value: "blog",
      label: "전체 블로그",
      description: "블로그의 모든 카테고리",
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      value: "category",
      label: "카테고리 선택",
      description: "원하는 카테고리만 선택하여 크롤링",
      icon: <Folder className="w-4 h-4" />,
    },
  ];

  // 블로그 ID 검색
  const handleSearchBlog = async () => {
    if (!blogId.trim()) {
      setError("블로그 ID를 입력해주세요.");
      return;
    }

    setCurrentStep("mode");
    setError(null);
  };

  // 카테고리 가져오기
  const handleFetchCategories = async () => {
    setIsFetchingCategories(true);
    setError(null);
    setCategories([]); // 기존 카테고리 초기화

    try {
      const data = await apiHelpers.post("/naver/blog/categories", {
        blogId,
      });

      setCategories(data.categories || []);
      if (data.categories && data.categories.length > 0) {
        setCurrentStep("category");
      } else {
        setError("카테고리를 찾을 수 없습니다. 블로그 ID를 확인해주세요.");
      }
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || "카테고리 조회 중 오류가 발생했습니다.");
    } finally {
      setIsFetchingCategories(false);
    }
  };

  // 모드 선택 완료
  const handleModeSelect = () => {
    if (mode === "blog") {
      // 전체 블로그 크롤링은 바로 시작
      setCurrentStep("crawl");
    } else if (mode === "category") {
      // 카테고리 선택 모드는 카테고리 가져오기
      handleFetchCategories();
    }
  };

  // 카테고리 선택 토글
  const toggleCategory = (categoryNo: number) => {
    const category = categories.find(cat => cat.categoryNo === categoryNo);
    if (!category) return;

    setSelectedCategories((prev) => {
      const isSelected = prev.includes(categoryNo);
      
      if (category.depth === 1) {
        // 1뎁스 카테고리 클릭 시
        if (isSelected) {
          // 1뎁스 카테고리 해제 - 해당 1뎁스와 그 하위 2뎁스들도 모두 해제
          const childCategories = categories
            .filter(cat => cat.depth === 2 && cat.parentCategoryNo === categoryNo)
            .map(cat => cat.categoryNo);
          return prev.filter(no => no !== categoryNo && !childCategories.includes(no));
        } else {
          // 1뎁스 카테고리 선택 - 해당 1뎁스와 그 하위 2뎁스들도 모두 선택
          const childCategories = categories
            .filter(cat => cat.depth === 2 && cat.parentCategoryNo === categoryNo)
            .map(cat => cat.categoryNo);
          return [...prev, categoryNo, ...childCategories.filter(no => !prev.includes(no))];
        }
      } else {
        // 2뎁스 카테고리 클릭 시 - 해당 카테고리만 토글
        return isSelected
          ? prev.filter(no => no !== categoryNo)
          : [...prev, categoryNo];
      }
    });
  };

  // 전체 카테고리 선택/해제
  const toggleAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map((cat) => cat.categoryNo));
    }
  };

  // 카테고리 선택 완료
  const handleCategorySelect = () => {
    if (selectedCategories.length === 0) {
      setError("최소 하나의 카테고리를 선택해주세요.");
      return;
    }
    setCurrentStep("crawl");
    setError(null);
  };

  // 크롤링 시작
  const handleStartCrawling = async () => {
    let finalUrl = "";

    if (mode === "blog") {
      finalUrl = `https://blog.naver.com/${blogId}`;
    } else if (mode === "category" && selectedCategories.length > 0) {
      // 첫 번째 선택된 카테고리로 URL 생성 (여러 카테고리는 백엔드에서 처리)
      finalUrl = `https://blog.naver.com/PostList.naver?blogId=${blogId}&categoryNo=${selectedCategories[0]}`;
    }

    setIsLoading(true);
    setError(null);
    setResults([]);
    setProgress({
      currentPage: 0,
      totalPages: 0,
      itemsFound: 0,
      itemsCrawled: 0,
    });

    try {
      // POST 요청으로 SSE 스트림 시작
      const API_BASE_URL =
        import.meta.env.VITE_API_URL || "http://localhost:8000";

      const response = await fetch(`${API_BASE_URL}/naver/crawl/blog`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: finalUrl,
          mode,
          maxPages,
          maxItems,
          blogId,
          ...(mode === "category" && {
            selectedCategories,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // SSE 스트림 읽기
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        // 마지막 줄은 불완전할 수 있으므로 보관
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const jsonData = line.slice(6).trim();
              if (jsonData) {
                const data = JSON.parse(jsonData);

                console.log("SSE data received:", data);

                if (data.type === "progress") {
                  setProgress(data.progress);
                } else if (data.type === "item") {
                  setResults((prev) => [...prev, data.item]);
                } else if (data.type === "error") {
                  setError(data.message);
                  setIsLoading(false);
                  return;
                } else if (data.type === "complete") {
                  setIsLoading(false);
                  return;
                }
              }
            } catch (parseError) {
              console.error(
                "Failed to parse SSE data:",
                parseError,
                "Line:",
                line
              );
            }
          }
        }
      }
    } catch (error) {
      const apiError = error as Error;
      setError(apiError.message || "크롤링 요청에 실패했습니다.");
      setIsLoading(false);
    }
  };

  // 뒤로가기
  const handleGoBack = () => {
    if (currentStep === "mode") {
      setCurrentStep("blogId");
    } else if (currentStep === "category") {
      setCurrentStep("mode");
    } else if (currentStep === "crawl") {
      if (mode === "category") {
        setCurrentStep("category");
      } else {
        setCurrentStep("mode");
      }
    }
    setError(null);
  };

  // 처음부터 다시 시작
  const handleReset = () => {
    setCurrentStep("blogId");
    setBlogId("");
    setCategories([]);
    setSelectedCategories([]);
    setResults([]);
    setError(null);
    setProgress({
      currentPage: 0,
      totalPages: 0,
      itemsFound: 0,
      itemsCrawled: 0,
    });
  };

  const progressPercentage =
    progress.totalPages > 0
      ? Math.round((progress.currentPage / progress.totalPages) * 100)
      : 0;

  const renderStepContent = () => {
    switch (currentStep) {
      case "blogId":
        return (
          <Card className="max-w-2xl mx-auto shadow-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="flex items-center justify-center gap-3 text-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Globe className="w-6 h-6 text-blue-600" />
                </div>
                블로그 ID 입력
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                크롤링할 네이버 블로그의 ID를 입력해주세요
              </p>
            </CardHeader>
            <CardContent className="space-y-8 px-8 pb-8">
              <div className="space-y-4">
                <Label htmlFor="blogId" className="text-base font-medium">
                  네이버 블로그 ID
                </Label>
                <div className="relative">
                  <Input
                    id="blogId"
                    value={blogId}
                    onChange={(e) => setBlogId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && blogId.trim()) {
                        handleSearchBlog();
                      }
                    }}
                    placeholder="예: yangsa254"
                    className="w-full h-12 text-lg px-4 border-2 focus:border-blue-500 transition-colors"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Globe className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    💡 <strong>예시:</strong> blog.naver.com/
                    <span className="font-mono bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                      yangsa254
                    </span>
                    에서
                    <span className="font-mono bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded ml-1">
                      yangsa254
                    </span>{" "}
                    부분만 입력하세요
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSearchBlog}
                disabled={!blogId.trim()}
                className="w-full h-12 text-base"
                size="lg"
              >
                <Play className="w-5 h-5 mr-2" />
                다음 단계로 이동
              </Button>
            </CardContent>
          </Card>
        );

      case "mode":
        return (
          <Card className="max-w-4xl mx-auto shadow-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-3 text-xl">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Folder className="w-6 h-6 text-purple-600" />
                </div>
                크롤링 모드 선택
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong className="text-blue-600">{blogId}</strong> 블로그를
                어떤 방식으로 크롤링하시겠습니까?
              </p>
            </CardHeader>
            <CardContent className="space-y-8 px-8 pb-8">
              <div className="space-y-4">
                <Label className="text-base font-medium">크롤링 모드</Label>
                <CompactRadio
                  value={mode}
                  onChange={(value) => setMode(value as CrawlMode)}
                  options={modeOptions}
                  name="crawl-mode"
                  variant="cards"
                  size="lg"
                />
              </div>

              {/* Options - Desktop Grid */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border">
                <Label className="text-base font-medium mb-4 block">
                  크롤링 설정
                </Label>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="maxPages"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      최대 페이지 수
                    </Label>
                    <Input
                      id="maxPages"
                      type="number"
                      value={maxPages}
                      onChange={(e) => setMaxPages(Number(e.target.value))}
                      min={1}
                      max={50}
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">
                      수집할 페이지의 최대 개수
                    </p>
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="maxItems"
                      className="text-sm font-medium flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      최대 포스트 수
                    </Label>
                    <Input
                      id="maxItems"
                      type="number"
                      value={maxItems}
                      onChange={(e) => setMaxItems(Number(e.target.value))}
                      min={1}
                      max={1000}
                      className="h-11"
                    />
                    <p className="text-xs text-gray-500">
                      수집할 포스트의 최대 개수
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={handleGoBack}
                  className="flex-1 h-12"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  이전
                </Button>
                <Button
                  onClick={handleModeSelect}
                  disabled={isFetchingCategories}
                  className="flex-2 h-12"
                  size="lg"
                >
                  {mode === "blog" ? (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      크롤링 시작
                    </>
                  ) : isFetchingCategories ? (
                    <>
                      <div className="animate-spin w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      카테고리 조회 중...
                    </>
                  ) : (
                    <>
                      <Folder className="w-5 h-5 mr-2" />
                      카테고리 선택
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "category":
        return (
          <Card className="max-w-4xl mx-auto shadow-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-3 text-xl">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Folder className="w-6 h-6 text-green-600" />
                </div>
                카테고리 선택
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong className="text-blue-600">{blogId}</strong> 블로그에서
                크롤링할 카테고리를 선택하세요
              </p>
            </CardHeader>
            <CardContent className="space-y-8 px-8 pb-8">
              {isFetchingCategories ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 text-lg">
                    카테고리 정보를 가져오는 중...
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    잠시만 기다려주세요
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium">
                          선택된 카테고리:{" "}
                          <span className="text-blue-600">
                            {selectedCategories.length}
                          </span>{" "}
                          / {categories.length}
                        </p>
                        <p className="text-sm text-gray-500">
                          원하는 카테고리를 클릭하여 선택하세요
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleAllCategories}
                      className="h-10"
                    >
                      {selectedCategories.length === categories.length
                        ? "전체 해제"
                        : "전체 선택"}
                    </Button>
                  </div>

                  <div className="max-h-96 overflow-y-auto space-y-2 border rounded-lg p-2">
                    {categories.map((category) => {
                      const isSelected = selectedCategories.includes(category.categoryNo);
                      const isParentCategory = category.depth === 1;
                      const hasChildren = categories.some(cat => cat.depth === 2 && cat.parentCategoryNo === category.categoryNo);
                      
                      return (
                        <div
                          key={category.categoryNo}
                          className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                            isSelected
                              ? isParentCategory 
                                ? "bg-blue-50 border-blue-300 shadow-sm dark:bg-blue-950/30" 
                                : "bg-green-50 border-green-300 shadow-sm dark:bg-green-950/30"
                              : "hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300"
                          } ${category.depth === 2 ? "ml-6 border-dashed" : "border-solid"}`}
                          onClick={() => toggleCategory(category.categoryNo)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleCategory(category.categoryNo)}
                                className="w-4 h-4 rounded border-2"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="flex items-center gap-2">
                                {category.depth === 1 && hasChildren && (
                                  <Folder className="w-4 h-4 text-blue-500" />
                                )}
                                {category.depth === 2 && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-gray-400 text-xs">└</span>
                                    <FileText className="w-3 h-3 text-green-500" />
                                  </div>
                                )}
                                <span
                                  className={`${
                                    category.depth === 2 
                                      ? "text-sm text-gray-600 dark:text-gray-400" 
                                      : "font-medium text-base text-gray-900 dark:text-gray-100"
                                  }`}
                                >
                                  {category.name}
                                </span>
                                {category.depth === 1 && hasChildren && (
                                  <Badge variant="outline" className="text-xs ml-2">
                                    하위 {categories.filter(cat => cat.depth === 2 && cat.parentCategoryNo === category.categoryNo).length}개
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge
                              variant={isSelected ? "default" : "outline"}
                              className="text-xs"
                            >
                              {category.postCount || 0}개
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="outline"
                      onClick={handleGoBack}
                      className="flex-1 h-12"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      이전
                    </Button>
                    <Button
                      onClick={handleCategorySelect}
                      disabled={selectedCategories.length === 0}
                      className="flex-2 h-12"
                      size="lg"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      선택된 카테고리로 크롤링 시작
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );

      case "crawl":
        return (
          <Card className="max-w-4xl mx-auto shadow-lg">
            <CardHeader className="text-center pb-6">
              <CardTitle className="flex items-center justify-center gap-3 text-xl">
                <div
                  className={`p-2 rounded-lg ${isLoading ? "bg-orange-100 dark:bg-orange-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"}`}
                >
                  {isLoading ? (
                    <div className="animate-spin w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-emerald-600" />
                  )}
                </div>
                {isLoading ? "크롤링 진행중" : "크롤링 실행"}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                설정을 확인하고 크롤링을 시작하세요
              </p>
            </CardHeader>
            <CardContent className="space-y-8 px-8 pb-8">
              {/* 설정 요약 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                      블로그 정보
                    </h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700 dark:text-blue-300">
                        블로그 ID
                      </span>
                      <span className="font-mono font-medium text-blue-900 dark:text-blue-100">
                        {blogId}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-blue-700 dark:text-blue-300">
                        크롤링 모드
                      </span>
                      <span className="font-medium text-blue-900 dark:text-blue-100">
                        {mode === "blog" ? "전체 블로그" : "선택된 카테고리"}
                      </span>
                    </div>
                    {mode === "category" && (
                      <div className="flex items-center justify-between">
                        <span className="text-blue-700 dark:text-blue-300">
                          선택된 카테고리
                        </span>
                        <span className="font-medium text-blue-900 dark:text-blue-100">
                          {selectedCategories.length}개
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100">
                      크롤링 설정
                    </h3>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700 dark:text-purple-300">
                        최대 페이지
                      </span>
                      <span className="font-medium text-purple-900 dark:text-purple-100">
                        {maxPages}개
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700 dark:text-purple-300">
                        최대 포스트
                      </span>
                      <span className="font-medium text-purple-900 dark:text-purple-100">
                        {maxItems}개
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700 dark:text-purple-300">
                        예상 소요시간
                      </span>
                      <span className="font-medium text-purple-900 dark:text-purple-100">
                        {Math.ceil(maxPages * 0.5)}분
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  onClick={handleGoBack}
                  disabled={isLoading}
                  className="flex-1 h-12"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  이전
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isLoading}
                  className="flex-1 h-12"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  처음부터
                </Button>
                <Button
                  onClick={handleStartCrawling}
                  disabled={isLoading}
                  className="flex-2 h-12"
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      크롤링 중...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      크롤링 시작하기
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const CrawlerContent = () => (
    <div className="min-h-screen p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3 pb-6">
        {/* Step Indicator - Desktop Optimized */}
        <div className="flex items-center justify-center space-x-4 mt-8 bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm border">
          {["blogId", "mode", "category", "crawl"].map((step, index) => {
            const stepLabels = ["블로그 ID", "모드 선택", "카테고리", "크롤링"];
            const stepIcons = [Globe, Folder, Folder, Play];
            const StepIcon = stepIcons[index];
            const isActive = currentStep === step;
            const isCompleted =
              ["blogId", "mode", "category", "crawl"].indexOf(currentStep) >
              index;
            const shouldShow = step !== "category" || mode === "category";

            if (!shouldShow) return null;

            return (
              <div key={step} className="flex items-center">
                <div
                  className={`flex flex-col items-center space-y-2 ${
                    isActive
                      ? "text-blue-600"
                      : isCompleted
                        ? "text-green-600"
                        : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                      isCompleted
                        ? "bg-green-500 text-white shadow-lg"
                        : isActive
                          ? "bg-blue-500 text-white shadow-lg scale-110"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-400"
                    }`}
                  >
                    {isCompleted ? "✓" : <StepIcon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-blue-600"
                        : isCompleted
                          ? "text-green-600"
                          : "text-gray-400"
                    }`}
                  >
                    {stepLabels[index]}
                  </span>
                </div>
                {index < 3 && shouldShow && (
                  <div
                    className={`w-16 h-0.5 mx-4 transition-all duration-300 ${
                      isCompleted
                        ? "bg-green-500"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {renderStepContent()}

      {/* Progress Card - Desktop Optimized */}
      {(isLoading || progress.currentPage > 0) && (
        <Card className="max-w-6xl mx-auto shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader className="text-center pb-4">
            <CardTitle className="flex items-center justify-center gap-3 text-xl">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              실시간 진행 상황
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 px-8 pb-8">
            {/* Main Progress Bar */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">페이지 진행률</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {progress.currentPage} / {progress.totalPages}
                  </div>
                  <div className="text-sm text-gray-500">페이지</div>
                </div>
              </div>
              <Progress value={progressPercentage} className="w-full h-3" />
              <div className="text-center text-sm text-gray-600">
                {progressPercentage}% 완료
              </div>
            </div>

            {/* Stats Grid - Desktop Optimized */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-6 bg-blue-100 dark:bg-blue-950/50 rounded-xl shadow-sm border border-blue-200 dark:border-blue-800">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {progress.currentPage}
                </div>
                <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  현재 페이지
                </div>
              </div>
              <div className="text-center p-6 bg-green-100 dark:bg-green-950/50 rounded-xl shadow-sm border border-green-200 dark:border-green-800">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {progress.itemsFound}
                </div>
                <div className="text-sm font-medium text-green-700 dark:text-green-300">
                  포스트 발견
                </div>
              </div>
              <div className="text-center p-6 bg-purple-100 dark:bg-purple-950/50 rounded-xl shadow-sm border border-purple-200 dark:border-purple-800">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {progress.itemsCrawled}
                </div>
                <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  크롤링 완료
                </div>
              </div>
              <div className="text-center p-6 bg-orange-100 dark:bg-orange-950/50 rounded-xl shadow-sm border border-orange-200 dark:border-orange-800">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {progressPercentage}%
                </div>
                <div className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  전체 진행률
                </div>
              </div>
            </div>

            {progress.message && (
              <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  {progress.message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Card - Desktop Optimized */}
      {results.length > 0 && (
        <Card className="max-w-6xl mx-auto shadow-lg">
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center gap-3 text-xl">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              크롤링 결과 ({results.length}개 포스트)
            </CardTitle>
            <div className="flex justify-center gap-4 mt-4">
              <Badge variant="outline" className="text-sm px-3 py-1">
                총 {results.length}개 포스트 수집 완료
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 max-h-[600px] overflow-y-auto pr-2">
              {results.map((post, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-4 hover:shadow-md transition-shadow bg-white dark:bg-gray-900/50"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-lg line-clamp-2 flex-1 text-gray-900 dark:text-gray-100">
                      {post.title}
                    </h3>
                    <Badge variant="outline" className="ml-3 shrink-0 text-xs">
                      #{index + 1}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-gray-400">
                    {post.author && (
                      <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded-full">
                        <User className="w-3 h-3" />
                        <span className="font-medium">{post.author}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-full">
                      <Calendar className="w-3 h-3" />
                      {new Date(post.publishDate).toLocaleDateString("ko-KR")}
                    </div>
                    {post.viewCount && (
                      <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded-full">
                        <Eye className="w-3 h-3" />
                        {post.viewCount.toLocaleString()}
                      </div>
                    )}
                    {post.commentCount && (
                      <div className="flex items-center gap-1.5 bg-purple-50 dark:bg-purple-950/30 px-2 py-1 rounded-full">
                        <MessageCircle className="w-3 h-3" />
                        {post.commentCount}
                      </div>
                    )}
                  </div>

                  {post.content && (
                    <div className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      {post.content}
                    </div>
                  )}

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Tags className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 4).map((tag, tagIndex) => (
                          <Badge
                            key={tagIndex}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {post.tags.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{post.tags.length - 4}개
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                    {post.category && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-indigo-50 dark:bg-indigo-950/30"
                      >
                        📁 {post.category}
                      </Badge>
                    )}
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                    >
                      <Link className="w-3 h-3" />
                      원본 보기
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return isAdmin ? (
    <AdminLayout>
      <CrawlerContent />
    </AdminLayout>
  ) : (
    <UserLayout>
      <CrawlerContent />
    </UserLayout>
  );
}
