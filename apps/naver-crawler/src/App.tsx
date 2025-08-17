import { useState, useMemo } from "react";
import LabelInput from "./components/LabelInput";
import LabelRadio from "./components/LabelRadio";
import AgGridTable from "./components/AgGridTable";
import { Button } from "./components/ui/button";
import MainLayout from "./components/layout/MainLayout";
import { useReviewsCrawlQuery } from "./hooks/useReviewsCrawl";
import {
  Play,
  Settings,
  Database,
  Globe,
  TrendingUp,
  Clock,
  FileText,
} from "lucide-react";

const VALID_URL = ["smartstore.naver.com", "brand.naver.com"];

const App = () => {
  const [url, setUrl] = useState("");
  const [sort, setSort] = useState<
    "ranking" | "latest" | "high-rating" | "low-rating"
  >("ranking");
  const [maxPage, setMaxPage] = useState(1);

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

  const { data, isLoading, refetch } = useReviewsCrawlQuery({
    url,
    sort,
    maxPage,
  });

  const sortOptions = [
    { value: "ranking", label: "랭킹순" },
    { value: "latest", label: "최신순" },
    { value: "high-rating", label: "높은평점순" },
    { value: "low-rating", label: "낮은평점순" },
  ];

  const handleStartCrawling = () => {
    if (!isValidUrl) return;
    refetch();
  };

  const columnDefs = [
    { field: "id", headerName: "리뷰 번호", flex: 1 },
    { field: "author", headerName: "작성자", flex: 1 },
    { field: "productInfo", headerName: "상품 정보", flex: 1 },
    { field: "rating", headerName: "평점", flex: 1 },
    { field: "content", headerName: "내용", flex: 1 },
    { field: "image", headerName: "이미지", flex: 1 },
    {
      field: "date",
      headerName: "날짜",
      flex: 1,
    },
  ];

  // 통계 데이터
  const stats = {
    totalReviews: data?.reviews?.length || 0,
    crawledPages: data?.crawledPages || 0,
    duration: data?.duration || 0,
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* 크롤링 설정 컨테이너 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">크롤링 설정</h2>
          </div>

          <div className="space-y-6">
            {/* URL 입력 */}
            <div className="space-y-2">
              <LabelInput
                id="url"
                label="스마트스토어 URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://smartstore.naver.com/..."
              />
              {urlError && (
                <p className="text-red-400 text-sm flex items-center gap-1">
                  <span className="w-4 h-4 text-red-400">⚠</span>
                  {urlError}
                </p>
              )}
              {url && isValidUrl && (
                <p className="text-green-400 text-sm flex items-center gap-1">
                  <span className="w-4 h-4 text-green-400">✓</span>
                  유효한 스마트스토어 URL입니다
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 정렬 기준 */}
              <div className="space-y-2">
                <LabelRadio
                  name="sort"
                  label="정렬 기준"
                  options={sortOptions}
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  orientation="vertical"
                />
              </div>

              {/* 최대 페이지 수 */}
              <div className="space-y-2">
                <LabelInput
                  id="maxPage"
                  label="최대 페이지 수"
                  type="number"
                  value={maxPage}
                  onChange={(e) => setMaxPage(Number(e.target.value))}
                  placeholder="1"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-gray-500">
                  1-100 페이지까지 설정 가능
                </p>
              </div>
            </div>

            {/* 크롤링 시작 버튼 */}
            <div className="flex justify-end pt-4 border-t border-white/10">
              <Button
                onClick={handleStartCrawling}
                disabled={!isValidUrl || isLoading}
                className={`
                  flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105
                  ${
                    !isValidUrl || isLoading
                      ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                      : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                  }
                `}
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    크롤링 중...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    크롤링 시작
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* 크롤링 정보 요약 */}
        {url && isValidUrl && (
          <div className="bg-blue-500/10 backdrop-blur-xl rounded-2xl p-4 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                <Globe className="w-4 h-4 text-white" />
              </div>
              <div className="space-y-1">
                <p className="text-blue-300 font-medium">크롤링 설정 요약</p>
                <div className="space-y-1 text-sm text-gray-300">
                  <p>
                    <span className="text-blue-400">URL:</span> {url}
                  </p>
                  <p>
                    <span className="text-blue-400">정렬:</span>{" "}
                    {sortOptions.find((opt) => opt.value === sort)?.label}
                  </p>
                  <p>
                    <span className="text-blue-400">페이지:</span> 최대{" "}
                    {maxPage}페이지
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 통계 정보 컨테이너 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">수집된 리뷰</p>
                <p className="text-white font-semibold">
                  {stats.totalReviews.toLocaleString()} 건
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">크롤링한 페이지</p>
                <p className="text-white font-semibold">
                  {stats.crawledPages} 페이지
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">소요 시간</p>
                <p className="text-white font-semibold">{stats.duration}초</p>
              </div>
            </div>
          </div>
        </div>

        {/* 리뷰 데이터 테이블 컨테이너 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <Database className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">크롤링 결과</h2>
            {stats.totalReviews > 0 && (
              <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                {stats.totalReviews}건
              </span>
            )}
          </div>

          {/* AG Grid 테이블 */}
          {data?.reviews && data.reviews.length > 0 ? (
            <AgGridTable columnDefs={columnDefs} rowData={data.reviews} />
          ) : !isLoading ? (
            <div className="w-full h-80 flex items-center justify-center border-2 border-dashed border-white/20 rounded-xl">
              <div className="text-center space-y-3">
                <Database className="w-12 h-12 text-gray-500 mx-auto" />
                <div className="space-y-1">
                  <p className="text-gray-400 font-medium">데이터가 없습니다</p>
                  <p className="text-gray-500 text-sm">
                    URL을 입력하고 크롤링을 시작해보세요
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-80 flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <p className="text-blue-400 font-medium">크롤링 진행 중...</p>
                  <p className="text-gray-500 text-sm">
                    데이터를 수집하고 있습니다
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default App;
