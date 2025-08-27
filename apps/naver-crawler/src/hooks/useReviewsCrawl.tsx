import { useState, useCallback } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiHelpers } from "@/lib/apiClient";

// API 요청 파라미터 타입
export interface CrawlParams {
  url: string;
  sort: "ranking" | "latest" | "high-rating" | "low-rating";
  maxPages: number; // maxPage에서 maxPages로 변경
}

// 개별 리뷰 타입
export interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
  helpfulCount?: number;
}

// SSE 진행상황 타입
export interface CrawlProgress {
  totalReviews: number;
  crawledReviews: number;
  currentPage: number;
  estimatedTotalPages: number;
  elapsedTime: number;
  isComplete?: boolean;
  reviews?: Review[];
  error?: string;
  status?: string;
  message?: string;
}

// API 응답 타입
export interface CrawlApiResponse {
  reviews: Review[];
  totalCount: number;
  totalReviews: number;
  processedPages: number;
  url: string;
  sortOrder: string;
  crawledAt: string;
  executionTime: number;
}

// SSE를 통한 크롤링 진행상황 추적 훅
export const useReviewsCrawlWithProgress = () => {
  const [progress, setProgress] = useState<CrawlProgress>({
    totalReviews: 0,
    crawledReviews: 0,
    currentPage: 0,
    estimatedTotalPages: 0,
    elapsedTime: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [finalResult, setFinalResult] = useState<CrawlApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const crawlWithProgress = useCallback(async (params: CrawlParams) => {
    setIsLoading(true);
    setError(null);
    setFinalResult(null);
    setProgress({
      totalReviews: 0,
      crawledReviews: 0,
      currentPage: 0,
      estimatedTotalPages: 0,
      elapsedTime: 0,
    });

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

      // POST 요청으로 SSE 스트림 시작
      const response = await fetch(`${API_BASE_URL}/naver/crawl/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: params.url,
          sort: params.sort,
          maxPages: params.maxPages,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // SSE 스트림 읽기
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // 마지막 줄은 불완전할 수 있으므로 보관
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = line.slice(6).trim();
              if (jsonData) {
                const data = JSON.parse(jsonData);
                
                console.log('SSE data received:', data); // 디버깅용
                
                if (data.error) {
                  setError(data.error);
                  setIsLoading(false);
                  return;
                }
                
                if (data.isComplete) {
                  setFinalResult(data);
                  setIsLoading(false);
                } else {
                  setProgress(data);
                }
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError, 'Line:', line);
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, []);

  return {
    crawlWithProgress,
    progress,
    isLoading,
    finalResult,
    error,
  };
};

// 기존 방식 유지 (하위 호환성)
const fetchReviews = async (params: CrawlParams): Promise<CrawlApiResponse> => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${API_BASE_URL}/naver/crawl/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: params.url,
        sort: params.sort,
        maxPages: params.maxPages,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
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
  });
};

export const useReviewsCrawlMutation = () => {
  return useMutation({
    mutationFn: (params: CrawlParams) => fetchReviews(params),
  });
};
