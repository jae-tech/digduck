import React, { useState, useRef, useEffect } from "react";
import AgGridComponent, { type AgGridTableRef } from "@/components/AgGridTable";
import LabelInput from "./components/LabelInput";
import LabelRadio from "./components/LabelRadio";
import {
  useReviewsCrawlQuery,
  useReviewsCrawlMutation,
  useReviewsCache,
  type CrawlParams,
  type Review,
} from "./hooks/useReviewsCrawl";
import { Button } from "./components/ui/button";

const App: React.FC = () => {
  const [crawlParams, setCrawlParams] = useState<CrawlParams>({
    url: "",
    sort: "ranking",
    maxPage: 20,
  });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const gridRef = useRef<AgGridTableRef>(null);

  // Custom hooks 사용
  const { clearAllReviewsCache, invalidateAllReviews, getCachedReviews } =
    useReviewsCache();

  // Query - 자동 실행을 위한 쿼리
  const {
    data: apiResponse,
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
    isFetching,
    isStale,
  } = useReviewsCrawlQuery(crawlParams, {
    enabled: hasSubmitted && !!crawlParams.url.trim(),
    staleTime: 3 * 60 * 1000, // 3분
    refetchOnWindowFocus: false,
  });

  // Mutation - 수동 실행을 위한 뮤테이션
  const crawlMutation = useReviewsCrawlMutation(
    (data, variables) => {
      console.log("크롤링 성공:", data);
    },
    (error, variables) => {
      console.error("크롤링 실패:", error);
    }
  );

  // URL 변경 시 제출 상태 리셋
  useEffect(() => {
    if (crawlParams.url.trim() === "") {
      setHasSubmitted(false);
    }
  }, [crawlParams.url]);

  // 폼 제출 핸들러
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!crawlParams.url.trim()) {
      return;
    }

    setHasSubmitted(true);
    // Mutation 실행 (수동 트리거)
    crawlMutation.mutate(crawlParams);
  };

  // 데이터 새로고침
  const handleRefresh = () => {
    if (hasSubmitted && crawlParams.url.trim()) {
      // 캐시 무효화 후 refetch
      invalidateAllReviews();
      refetch();
    }
  };

  // 데이터 초기화
  const handleClear = () => {
    setCrawlParams({
      url: "",
      sort: "ranking",
      maxPage: 20,
    });
    setHasSubmitted(false);
    clearAllReviewsCache();
  };

  // 파라미터 업데이트 함수들
  const updateUrl = (url: string) => {
    setCrawlParams((prev) => ({ ...prev, url }));
  };

  const updateSortOrder = (
    sort: "ranking" | "latest" | "high-rating" | "low-rating"
  ) => {
    setCrawlParams((prev) => ({ ...prev, sort }));
  };

  const updateMaxPage = (maxPage: number) => {
    setCrawlParams((prev) => ({ ...prev, maxPage }));
  };

  // 상태 통합
  const isLoadingData = isQueryLoading || crawlMutation.isPending || isFetching;
  const errorMessage = queryError?.message || crawlMutation.error?.message;
  const reviews: Review[] = apiResponse?.reviews || [];
  const cachedData = getCachedReviews(crawlParams);

  // 통계 계산
  const statistics = {
    totalReviews: reviews.length,
    highRatingReviews: reviews.filter((review) => review.rating >= 4).length,
    averageRating:
      reviews.length > 0
        ? (
            reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
          ).toFixed(1)
        : "0.0",
    verifiedReviews: reviews.filter((review) => review.verified).length,
    totalData: apiResponse?.totalReviews || reviews.length,
  };

  const columnDefs = [
    {
      headerName: "리뷰 ID",
      field: "id",
      sortable: true,
      filter: true,
    },
    {
      headerName: "리뷰 내용",
      field: "content",
      sortable: true,
      filter: true,
    },
    {
      headerName: "작성자",
      field: "author",
      sortable: true,
      filter: true,
    },
    {
      headerName: "평점",
      field: "rating",
      sortable: true,
      filter: true,
    },
    {
      headerName: "작성일",
      field: "date",
      sortable: true,
      filter: true,
      valueFormatter: ({ value }) => new Date(value).toLocaleDateString(),
    },
    {
      headerName: "구매 확정",
      field: "verified",
      sortable: true,
      filter: true,
      cellRenderer: ({ value }) => (value ? "✅ 구매 확정" : "❌ 미확정"),
    },
    {
      headerName: "리뷰 이미지",
      field: "image",
      sortable: true,
      filter: true,
      cellRenderer: ({ value }) => (
        <img src={value} alt="리뷰 이미지" className="w-16 h-16 object-cover" />
      ),
    },
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 메인 컨텐츠 */}
        <div className="space-y-6">
          {/* 설정 패널 */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                크롤링 설정
                {isFetching && !crawlMutation.isPending && (
                  <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                    백그라운드 업데이트 중...
                  </span>
                )}
                {isStale && (
                  <span className="ml-2 text-xs bg-yellow-500/20 px-2 py-1 rounded-full">
                    데이터 갱신 필요
                  </span>
                )}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* URL 입력 */}
                <div className="lg:col-span-2">
                  <LabelInput
                    id="url"
                    label="스마트스토어 상품 URL"
                    placeholder="https://smartstore.naver.com/..."
                    value={crawlParams.url}
                    onChange={(e) => updateUrl(e.target.value)}
                    required
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    네이버 스마트스토어 상품 페이지 URL을 입력하세요
                  </p>
                </div>

                {/* 최대 페이지 */}
                <div>
                  <LabelInput
                    id="maxPage"
                    label="수집할 페이지 수"
                    type="number"
                    min="1"
                    max="50"
                    value={crawlParams.maxPage}
                    onChange={(e) => updateMaxPage(Number(e.target.value))}
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    최대 50페이지까지 수집 가능
                  </p>
                </div>
              </div>

              {/* 정렬 옵션 */}
              <div className="mb-6">
                <LabelRadio
                  label="리뷰 정렬 기준"
                  name="sort"
                  value={crawlParams.sort}
                  onChange={(e) =>
                    updateSortOrder(
                      e.target.value as
                        | "ranking"
                        | "latest"
                        | "high-rating"
                        | "low-rating"
                    )
                  }
                  options={[
                    { value: "ranking", label: "🏆 인기순" },
                    { value: "latest", label: "🆕 최신순" },
                    { value: "high-rating", label: "⭐ 높은 평점순" },
                    { value: "low-rating", label: "📉 낮은 평점순" },
                  ]}
                  orientation="horizontal"
                  className="bg-gray-50 p-4 rounded-lg"
                />
              </div>

              {/* 버튼 그룹 */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="submit"
                  disabled={isLoadingData || !crawlParams.url.trim()}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  {isLoadingData ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      리뷰 수집 중... (
                      {crawlMutation.isPending ? "처리중" : "업데이트중"})
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      리뷰 수집 시작
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  onClick={handleRefresh}
                  disabled={
                    !hasSubmitted || isLoadingData || !crawlParams.url.trim()
                  }
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-400 to-green-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  <svg
                    className="w-5 h-5 mr-2 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  새로고침
                </Button>

                <Button
                  type="button"
                  onClick={handleClear}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-400 to-red-600 text-white font-medium rounded-lg hover:from-red-700 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl"
                >
                  <svg
                    className="w-5 h-5 mr-2 inline"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  초기화
                </Button>
              </div>
            </form>
          </div>

          {/* React Query 상태 표시 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-blue-800">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">React Query 상태:</span>
                <div className="ml-4 flex gap-4 text-sm">
                  <span
                    className={`flex items-center ${isLoadingData ? "text-orange-600" : "text-green-600"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-1 ${isLoadingData ? "bg-orange-500 animate-pulse" : "bg-green-500"}`}
                    ></div>
                    {isLoadingData ? "로딩중" : "준비됨"}
                  </span>
                  <span
                    className={`flex items-center ${cachedData ? "text-green-600" : "text-gray-600"}`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mr-1 ${cachedData ? "bg-green-500" : "bg-gray-400"}`}
                    ></div>
                    캐시: {cachedData ? "활성" : "없음"}
                  </span>
                  <span className="text-blue-600">
                    데이터: {reviews.length}개
                  </span>
                </div>
              </div>

              {apiResponse && (
                <div className="text-sm text-gray-600">
                  상품: {apiResponse.name}
                </div>
              )}
            </div>
          </div>

          {/* 에러 메시지 */}
          {errorMessage && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg shadow-md">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-red-400 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-red-800 font-medium">
                    오류가 발생했습니다
                  </h3>
                  <p className="text-red-700 text-sm mt-1">{errorMessage}</p>
                  {(queryError as any)?.status && (
                    <p className="text-red-600 text-xs mt-1">
                      상태 코드: {(queryError as any).status}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 성공 메시지 */}
          {apiResponse && !isLoadingData && !errorMessage && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg shadow-md">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-green-400 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-green-800 font-medium">
                    리뷰 수집 완료!
                  </h3>
                  <p className="text-green-700 text-sm mt-1">
                    상품 "{apiResponse.name}"에서 총 {reviews.length}개의 리뷰를
                    수집했습니다.
                  </p>
                  {apiResponse.totalReviews &&
                    apiResponse.totalReviews > reviews.length && (
                      <p className="text-green-600 text-xs mt-1">
                        전체 {apiResponse.totalReviews}개 중 {reviews.length}개
                        표시됨
                      </p>
                    )}
                </div>
              </div>
            </div>
          )}

          {/* 데이터 요약 */}
          {reviews.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  리뷰 데이터 개요
                </h3>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
                  총 {statistics.totalReviews}개 리뷰
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">
                    {statistics.totalReviews}
                  </div>
                  <div className="text-blue-700 text-sm font-medium">
                    수집된 리뷰
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">
                    {statistics.highRatingReviews}
                  </div>
                  <div className="text-green-700 text-sm font-medium">
                    고평점 리뷰 (4점↑)
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">
                    {statistics.averageRating}
                  </div>
                  <div className="text-purple-700 text-sm font-medium">
                    평균 평점
                  </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">
                    {statistics.verifiedReviews}
                  </div>
                  <div className="text-orange-700 text-sm font-medium">
                    구매 확정 리뷰
                  </div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-4 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-gray-600">
                    {statistics.totalData}
                  </div>
                  <div className="text-gray-700 text-sm font-medium">
                    전체 데이터
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 데이터 테이블 */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  리뷰 데이터
                  {isLoadingData && (
                    <div className="ml-2 flex items-center text-sm text-gray-500">
                      <svg
                        className="animate-spin w-4 h-4 mr-1"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {crawlMutation.isPending
                        ? "데이터 수집 중..."
                        : "업데이트 중..."}
                    </div>
                  )}
                </h3>

                {apiResponse && (
                  <div className="text-sm text-gray-500">
                    마지막 업데이트: {new Date().toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6">
              {reviews.length === 0 && !isLoadingData ? (
                <div className="text-center py-12">
                  <svg
                    className="w-16 h-16 text-gray-300 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    리뷰 데이터가 없습니다
                  </h3>
                  <p className="text-gray-500">
                    위에서 스마트스토어 URL을 입력하고 리뷰를 수집해주세요.
                  </p>
                </div>
              ) : isLoadingData ? (
                <div className="text-center py-12">
                  <svg
                    className="animate-spin w-12 h-12 text-indigo-600 mx-auto mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {crawlMutation.isPending
                      ? "리뷰 데이터를 수집하고 있습니다"
                      : "데이터를 업데이트하고 있습니다"}
                  </h3>
                  <p className="text-gray-500">
                    {crawlMutation.isPending
                      ? "서버에서 리뷰를 크롤링 중입니다..."
                      : "최신 데이터를 가져오는 중입니다..."}
                  </p>
                </div>
              ) : (
                <AgGridComponent
                  ref={gridRef}
                  rowData={reviews}
                  columnDefs={columnDefs}
                  className="border-0"
                  paginationPageSize={Math.min(crawlParams.maxPage, 50)}
                  paginationPageSizeSelector={[10, 20, 50, 100].filter(
                    (size) => size <= crawlParams.maxPage * 2
                  )}
                />
              )}
            </div>
          </div>

          {/* 캐시 관리 도구 (개발 환경에서만 표시) */}
          {import.meta.env.MODE === "development" &&
            (apiResponse || cachedData) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-3">
                  개발자 도구 - 캐시 관리
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex gap-2 text-sm">
                      <Button
                        onClick={() => invalidateAllReviews()}
                        className="px-3 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-800 rounded transition-colors"
                      >
                        캐시 무효화
                      </Button>
                      <Button
                        onClick={() => clearAllReviewsCache()}
                        className="px-3 py-1 bg-red-200 hover:bg-red-300 text-red-800 rounded transition-colors"
                      >
                        캐시 삭제
                      </Button>
                    </div>
                    <div className="text-xs text-gray-600">
                      <div>캐시된 데이터: {cachedData ? "있음" : "없음"}</div>
                      <div>Stale 상태: {isStale ? "예" : "아니오"}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div>
                      마지막 업데이트: {new Date().toLocaleTimeString()}
                    </div>
                    <div>Query 상태: {isQueryLoading ? "로딩" : "완료"}</div>
                    <div>
                      Mutation 상태:{" "}
                      {crawlMutation.isPending ? "진행중" : "대기"}
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default App;
