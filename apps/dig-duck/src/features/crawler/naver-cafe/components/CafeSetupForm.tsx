import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertCircle,
  FolderOpen,
  Link,
  Loader2,
  Lock,
  Play,
  Search,
  Settings,
  User,
} from "lucide-react";
import React, { useState } from "react";

interface Category {
  id: string;
  name: string;
  postCount: number;
}

interface CafeSetupData {
  username: string;
  password: string;
  cafeUrl: string;
  selectedCategories: Category[];
  extractionType: "category" | "keyword";
  keyword?: string;
}

interface CafeSetupFormProps {
  onSubmit: (data: CafeSetupData) => void;
  loading?: boolean;
  categories?: Category[];
  error?: string;
  onFetchCategories?: (
    credentials: { username: string; password: string },
    cafeUrl: string,
  ) => void;
  categoriesLoading?: boolean;
}

export function CafeSetupForm({
  onSubmit,
  loading = false,
  categories = [],
  error,
  onFetchCategories,
  categoriesLoading = false,
}: CafeSetupFormProps) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    cafeUrl: "",
  });
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    new Set(),
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [extractionType, setExtractionType] = useState<"category" | "keyword">(
    "category",
  );
  const [keyword, setKeyword] = useState("");

  const isValidNaverCafeUrl = (url: string) => {
    const pattern = /^https?:\/\/cafe\.naver\.com\/[a-zA-Z0-9_-]+/;
    return pattern.test(url);
  };

  const canFetchCategories =
    formData.username &&
    formData.password &&
    formData.cafeUrl &&
    isValidNaverCafeUrl(formData.cafeUrl);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFetchCategories = () => {
    if (
      canFetchCategories &&
      onFetchCategories &&
      extractionType === "category"
    ) {
      onFetchCategories(
        { username: formData.username, password: formData.password },
        formData.cafeUrl,
      );
      setShowCategories(true);
    }
  };

  const handleExtractionTypeChange = (value: "category" | "keyword") => {
    setExtractionType(value);
    if (value === "category") {
      setKeyword("");
    } else {
      setShowCategories(false);
      setSelectedCategoryIds(new Set());
    }
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newSelected = new Set(selectedCategoryIds);
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId);
    } else {
      newSelected.add(categoryId);
    }
    setSelectedCategoryIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedCategoryIds.size === filteredCategories.length) {
      setSelectedCategoryIds(new Set());
    } else {
      const allIds = new Set(filteredCategories.map((cat) => cat.id));
      setSelectedCategoryIds(allIds);
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedCategories = categories.filter((cat) =>
    selectedCategoryIds.has(cat.id),
  );
  const totalSelectedPosts = selectedCategories.reduce(
    (sum, cat) => sum + cat.postCount,
    0,
  );

  const canSubmit =
    extractionType === "category"
      ? selectedCategories.length > 0
      : keyword.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onSubmit({
        username: formData.username,
        password: formData.password,
        cafeUrl: formData.cafeUrl,
        selectedCategories:
          extractionType === "category" ? selectedCategories : [],
        extractionType,
        keyword: extractionType === "keyword" ? keyword : "",
      });
    }
  };

  return (
    <Card className="w-full h-[calc(100vh-8rem)] flex flex-col">
      <CardContent className="p-3 flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 로그인 정보 - 각 필드별 로우 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>로그인</span>
            </h3>

            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <Input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  placeholder="아이디"
                  className="pl-7 h-7 text-xs"
                  required
                  disabled={loading || categoriesLoading}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="비밀번호"
                  className="pl-7 h-7 text-xs"
                  required
                  disabled={loading || categoriesLoading}
                />
              </div>
            </div>
          </div>

          {/* 카페 URL - 각 필드별 로우 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
              <Link className="w-3 h-3" />
              <span>카페 URL</span>
            </h3>

            <div className="relative">
              <Link className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
              <Input
                type="url"
                value={formData.cafeUrl}
                onChange={(e) => handleInputChange("cafeUrl", e.target.value)}
                placeholder="https://cafe.naver.com/cafeurl"
                className="pl-7 h-7 text-xs"
                required
                disabled={loading || categoriesLoading}
              />
            </div>

            {formData.cafeUrl && !isValidNaverCafeUrl(formData.cafeUrl) && (
              <p className="text-xs text-red-600 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                올바른 URL을 입력해주세요
              </p>
            )}
          </div>

          {/* 추출 옵션 */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
              <Settings className="w-3 h-3" />
              <span>추출 방식</span>
            </h3>

            <RadioGroup
              value={extractionType}
              onValueChange={handleExtractionTypeChange}
              className="flex flex-col lg:flex-row gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="category"
                  id="category"
                  className="scale-75"
                />
                <Label
                  htmlFor="category"
                  className="text-xs font-medium cursor-pointer"
                >
                  카테고리별 수집
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="keyword"
                  id="keyword"
                  className="scale-75"
                />
                <Label
                  htmlFor="keyword"
                  className="text-xs font-medium cursor-pointer"
                >
                  키워드별 수집
                </Label>
              </div>
            </RadioGroup>

            <p className="text-xs text-gray-500">
              {extractionType === "category"
                ? "• 선택한 카테고리의 모든 게시글 수집"
                : "• 특정 키워드가 포함된 게시글만 수집"}
            </p>

            {/* 카테고리별 수집 시 불러오기 버튼 */}
            {extractionType === "category" && (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleFetchCategories}
                  disabled={!canFetchCategories || categoriesLoading}
                  className="h-7 px-2 text-xs w-full"
                >
                  {categoriesLoading && (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  )}
                  카테고리 불러오기
                </Button>
              </div>
            )}
          </div>

          {/* 키워드 입력 필드 */}
          {extractionType === "keyword" && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                <Search className="w-3 h-3" />
                <span>검색 키워드</span>
              </h3>

              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                <Input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="검색할 키워드를 입력하세요..."
                  className="pl-7 h-7 text-xs"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {/* 에러 표시 */}
          {error && (
            <Alert variant="destructive" className="py-1">
              <AlertCircle className="h-3 w-3" />
              <div>
                <p className="text-xs">{error}</p>
              </div>
            </Alert>
          )}

          {/* 카테고리 선택 */}
          {extractionType === "category" &&
            showCategories &&
            categories.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center space-x-1">
                    <FolderOpen className="w-3 h-3" />
                    <span>카테고리 ({categories.length})</span>
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-6 px-2 text-xs"
                  >
                    {selectedCategoryIds.size === filteredCategories.length
                      ? "해제"
                      : "전체"}
                  </Button>
                </div>

                {/* 검색 */}
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
                  <Input
                    type="text"
                    placeholder="카테고리 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-6 text-xs"
                  />
                </div>

                {/* 선택된 항목 요약 */}
                {selectedCategories.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-blue-900 text-xs">
                        {selectedCategories.length}개 선택
                      </span>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800 text-xs scale-75"
                      >
                        {totalSelectedPosts.toLocaleString()}개 글
                      </Badge>
                    </div>
                  </div>
                )}

                {/* 카테고리 목록 */}
                <div className="max-h-32 overflow-y-auto space-y-1 border border-gray-200 rounded p-1">
                  {filteredCategories.length === 0 ? (
                    <div className="text-center py-2 text-gray-500">
                      <p className="text-xs">검색 결과 없음</p>
                    </div>
                  ) : (
                    filteredCategories.map((category) => (
                      <div
                        key={category.id}
                        className={`flex items-center space-x-1 p-1 rounded border transition-colors cursor-pointer ${
                          selectedCategoryIds.has(category.id)
                            ? "border-blue-300 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                        onClick={() => handleCategoryToggle(category.id)}
                      >
                        <Checkbox
                          checked={selectedCategoryIds.has(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                          className="pointer-events-none scale-75"
                        />

                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-900 truncate">
                            {category.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-xs scale-75 ml-1"
                          >
                            {category.postCount.toLocaleString()}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          {/* 제출 버튼 */}
          <div className="pt-1">
            <Button
              type="submit"
              size="sm"
              disabled={!canSubmit || loading}
              className="h-7 px-3 text-xs w-full"
            >
              {loading && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
              {loading ? (
                "크롤링 중..."
              ) : (
                <>
                  <Play className="w-3 h-3 mr-1" />
                  {extractionType === "category"
                    ? `시작 (${selectedCategories.length}개)`
                    : "시작"}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* 진행상황 표시 */}
        <div className="text-xs text-gray-500 bg-gray-50 rounded p-1 mt-2">
          <p className="font-medium mb-1 text-xs">📊 진행상황</p>
          <div className="space-y-1 text-xs text-gray-600">
            {extractionType === "category" ? (
              <>
                <div className="flex justify-between">
                  <span>선택된 카테고리:</span>
                  <span className="font-medium">
                    {selectedCategories.length}개
                  </span>
                </div>
                {totalSelectedPosts > 0 && (
                  <div className="flex justify-between">
                    <span>예상 게시글:</span>
                    <span className="font-medium">
                      {totalSelectedPosts.toLocaleString()}개
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>검색 키워드:</span>
                  <span className="font-medium">{keyword || "미입력"}</span>
                </div>
                <div className="flex justify-between">
                  <span>수집 방식:</span>
                  <span className="font-medium">키워드 검색</span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
