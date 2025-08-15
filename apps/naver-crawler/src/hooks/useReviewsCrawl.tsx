import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiHelpers, type ApiError } from "@/lib/apiClient";
import React from "react";

// API 요청 파라미터 타입
export interface CrawlParams {
  url: string;
  sort: "ranking" | "latest" | "high-rating" | "low-rating";
  maxPage: number;
}

// 개별 리뷰 타입
export interface Review {
  id: number;
  author: string;
  rating: number;
  content: string;
  date: string;
  images?: string[];
  verified: boolean;
}

// API 응답 타입
export interface CrawlApiResponse {
  id: string;
  name: string;
  url: string;
  reviews: Review[];
  totalReviews: number;
}

// Reviews 크롤링 API 호출 함수
const fetchReviews = async (params: CrawlParams): Promise<CrawlApiResponse> => {
  try {
    // apiHelpers.post 사용
    const data = await apiHelpers.post<CrawlApiResponse>(
      "/smart-store/crawl/reviews",
      {
        url: params.url,
        sort: params.sort,
        maxPage: params.maxPage,
      }
    );

    return data;
  } catch (error) {
    // ApiError는 이미 apiClient에서 처리됨
    throw error;
  }
};

// 리뷰 상세 조회 API 함수
const fetchReviewDetails = async (reviewId: string): Promise<Review> => {
  return await apiHelpers.get<Review>(`/smart-store/reviews/${reviewId}`);
};

// 크롤링 상태 확인 API 함수
const checkCrawlStatus = async (
  crawlId: number
): Promise<{ status: string; progress: number }> => {
  return await apiHelpers.get(`/smart-store/crawl/status/${crawlId}`);
};

// Query Keys Factory
export const reviewsQueryKeys = {
  all: ["reviews"] as const,
  crawl: (params: CrawlParams) =>
    [...reviewsQueryKeys.all, "crawl", params] as const,
  byUrl: (url: string) => [...reviewsQueryKeys.all, "byUrl", url] as const,
  detail: (reviewId: string) =>
    [...reviewsQueryKeys.all, "detail", reviewId] as const,
  status: (crawlId: number) =>
    [...reviewsQueryKeys.all, "status", crawlId] as const,
};

// Custom Hook for Reviews Crawling Query
export const useReviewsCrawlQuery = (
  params: CrawlParams,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchOnWindowFocus?: boolean;
    refetchInterval?: number;
  }
) => {
  return useQuery({
    queryKey: reviewsQueryKeys.crawl(params),
    queryFn: () => fetchReviews(params),
    enabled: options?.enabled ?? false,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5분
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    refetchInterval: options?.refetchInterval ?? false,
    retry: (failureCount, error) => {
      const apiError = error as ApiError;
      // 4xx 에러는 재시도하지 않음
      if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
        return false;
      }
      // 그 외는 2번까지 재시도
      return failureCount < 2;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Custom Hook for Reviews Crawling Mutation
export const useReviewsCrawlMutation = (
  onSuccess?: (data: CrawlApiResponse, variables: CrawlParams) => void,
  onError?: (error: ApiError, variables: CrawlParams) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fetchReviews,
    onSuccess: (data, variables) => {
      console.log("✅ 크롤링 성공:", data);

      // 성공 시 해당 쿼리 캐시 업데이트
      queryClient.setQueryData(reviewsQueryKeys.crawl(variables), data);

      // URL별 캐시도 업데이트
      queryClient.setQueryData(reviewsQueryKeys.byUrl(variables.url), data);

      // 전체 리뷰 캐시 무효화 (새로운 데이터가 있을 수 있음)
      queryClient.invalidateQueries({
        queryKey: reviewsQueryKeys.all,
        exact: false,
      });

      // 성공 콜백 실행
      onSuccess?.(data, variables);
    },
    onError: (error: ApiError, variables) => {
      console.error("❌ 크롤링 실패:", error);
      onError?.(error, variables);
    },
    retry: 1,
  });
};

// Custom Hook for Review Detail Query
export const useReviewDetailQuery = (
  reviewId: string,
  options?: {
    enabled?: boolean;
  }
) => {
  return useQuery({
    queryKey: reviewsQueryKeys.detail(reviewId),
    queryFn: () => fetchReviewDetails(reviewId),
    enabled: options?.enabled ?? !!reviewId,
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 30 * 60 * 1000, // 30분
  });
};

// Custom Hook for Crawl Status Query
export const useCrawlStatusQuery = (
  crawlId: number,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
) => {
  return useQuery({
    queryKey: reviewsQueryKeys.status(crawlId),
    queryFn: () => checkCrawlStatus(crawlId),
    enabled: options?.enabled ?? !!crawlId,
    refetchInterval: options?.refetchInterval ?? 2000, // 2초마다 폴링
    staleTime: 0, // 항상 최신 상태 확인
  });
};

// Cache Management Hook
export const useReviewsCache = () => {
  const queryClient = useQueryClient();

  const clearAllReviewsCache = () => {
    queryClient.removeQueries({ queryKey: reviewsQueryKeys.all });
    console.log("🗑️ 모든 리뷰 캐시가 삭제되었습니다");
  };

  const clearSpecificCrawlCache = (params: CrawlParams) => {
    queryClient.removeQueries({ queryKey: reviewsQueryKeys.crawl(params) });
    console.log("🗑️ 특정 크롤링 캐시가 삭제되었습니다");
  };

  const invalidateAllReviews = () => {
    queryClient.invalidateQueries({ queryKey: reviewsQueryKeys.all });
    console.log("🔄 모든 리뷰 캐시가 무효화되었습니다");
  };

  const prefetchReviews = (params: CrawlParams) => {
    return queryClient.prefetchQuery({
      queryKey: reviewsQueryKeys.crawl(params),
      queryFn: () => fetchReviews(params),
      staleTime: 5 * 60 * 1000,
    });
  };

  const getCachedReviews = (
    params: CrawlParams
  ): CrawlApiResponse | undefined => {
    return queryClient.getQueryData(reviewsQueryKeys.crawl(params));
  };

  const getCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const reviewQueries = queries.filter(
      (query) => query.queryKey[0] === "reviews"
    );

    return {
      totalQueries: queries.length,
      reviewQueries: reviewQueries.length,
      activeQueries: reviewQueries.filter((q) => q.isActive()).length,
      staleQueries: reviewQueries.filter((q) => q.isStale()).length,
      cacheSize: JSON.stringify(reviewQueries.map((q) => q.state.data)).length,
    };
  };

  return {
    clearAllReviewsCache,
    clearSpecificCrawlCache,
    invalidateAllReviews,
    prefetchReviews,
    getCachedReviews,
    getCacheStats,
  };
};

// Status Hook - 현재 진행 중인 쿼리/뮤테이션 상태 확인
export const useReviewsStatus = () => {
  const queryClient = useQueryClient();

  const getQueryStatus = (params: CrawlParams) => {
    const queryState = queryClient.getQueryState(
      reviewsQueryKeys.crawl(params)
    );
    return {
      isLoading: queryState?.fetchStatus === "fetching",
      isError: queryState?.status === "error",
      isSuccess: queryState?.status === "success",
      isStale: queryState?.isStale,
      lastUpdated: queryState?.dataUpdatedAt,
      error: queryState?.error as ApiError | null,
      data: queryState?.data as CrawlApiResponse | undefined,
    };
  };

  const getMutationStatus = () => {
    const mutations = queryClient.getMutationCache().getAll();
    const reviewsMutation = mutations.find(
      (m) => m.options.mutationFn === fetchReviews
    );

    return {
      isPending: reviewsMutation?.state.status === "pending",
      isError: reviewsMutation?.state.status === "error",
      isSuccess: reviewsMutation?.state.status === "success",
      error: reviewsMutation?.state.error as ApiError | null,
      variables: reviewsMutation?.state.variables as CrawlParams | undefined,
    };
  };

  const getAllQueriesStatus = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    return queries
      .filter((query) => query.queryKey[0] === "reviews")
      .map((query) => ({
        queryKey: query.queryKey,
        status: query.state.status,
        fetchStatus: query.state.fetchStatus,
        isStale: query.isStale(),
        lastUpdated: query.state.dataUpdatedAt,
      }));
  };

  return {
    getQueryStatus,
    getMutationStatus,
    getAllQueriesStatus,
  };
};

// Optimistic Updates Hook
export const useOptimisticReviews = () => {
  const queryClient = useQueryClient();

  const addOptimisticReview = (params: CrawlParams, newReview: Review) => {
    queryClient.setQueryData(
      reviewsQueryKeys.crawl(params),
      (oldData: CrawlApiResponse | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          reviews: [...oldData.reviews, newReview],
          totalCount: (oldData.totalReviews || 0) + 1,
        };
      }
    );
  };

  const removeOptimisticReview = (params: CrawlParams, reviewId: number) => {
    queryClient.setQueryData(
      reviewsQueryKeys.crawl(params),
      (oldData: CrawlApiResponse | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          reviews: oldData.reviews.filter((review) => review.id !== reviewId),
          totalCount: Math.max((oldData.totalReviews || 0) - 1, 0),
        };
      }
    );
  };

  const updateOptimisticReview = (
    params: CrawlParams,
    reviewId: number,
    updates: Partial<Review>
  ) => {
    queryClient.setQueryData(
      reviewsQueryKeys.crawl(params),
      (oldData: CrawlApiResponse | undefined) => {
        if (!oldData) return oldData;

        return {
          ...oldData,
          reviews: oldData.reviews.map((review) =>
            review.id === reviewId ? { ...review, ...updates } : review
          ),
        };
      }
    );
  };

  return {
    addOptimisticReview,
    removeOptimisticReview,
    updateOptimisticReview,
  };
};

// Background Sync Hook
export const useBackgroundSync = (
  params: CrawlParams,
  options?: {
    enabled?: boolean;
    intervalMs?: number;
  }
) => {
  const { enabled = false, intervalMs = 5 * 60 * 1000 } = options || {};
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!enabled || !params.url) return;

    const interval = setInterval(() => {
      queryClient.invalidateQueries({
        queryKey: reviewsQueryKeys.crawl(params),
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [enabled, params.url, intervalMs, queryClient, params]);
};

// Batch Operations Hook
export const useBatchOperations = () => {
  const queryClient = useQueryClient();

  const batchInvalidate = (urls: string[]) => {
    urls.forEach((url) => {
      queryClient.invalidateQueries({
        queryKey: reviewsQueryKeys.byUrl(url),
      });
    });
  };

  const batchPrefetch = async (paramsList: CrawlParams[]) => {
    const promises = paramsList.map((params) =>
      queryClient.prefetchQuery({
        queryKey: reviewsQueryKeys.crawl(params),
        queryFn: () => fetchReviews(params),
      })
    );

    return await Promise.allSettled(promises);
  };

  return {
    batchInvalidate,
    batchPrefetch,
  };
};

// Export all types
