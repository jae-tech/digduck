import { useQuery } from "@tanstack/react-query";
import { apiHelpers, type ApiError } from "@/lib/apiClient";

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

const fetchReviews = async (params: CrawlParams): Promise<CrawlApiResponse> => {
  try {
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
    throw error;
  }
};

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
    queryKey: ["crawl", params],
    queryFn: () => fetchReviews(params),
    enabled: options?.enabled ?? false,
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5분
    gcTime: options?.gcTime ?? 10 * 60 * 1000, // 10분
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    refetchInterval: options?.refetchInterval ?? false,
    // retry: (failureCount, error) => {
    //   const apiError = error as ApiError;
    //   // 4xx 에러는 재시도하지 않음
    //   if (apiError.status && apiError.status >= 400 && apiError.status < 500) {
    //     return false;
    //   }
    //   // 그 외는 2번까지 재시도
    //   return failureCount < 2;
    // },
    // retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
