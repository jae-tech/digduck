import { useState } from "react";
import { apiHelpers } from "@/lib/apiClient";
import type {
  ShoppingInsightsParams,
  ShoppingInsightsResult,
} from "../types/crawler.types";

interface UseShoppingInsightsReturn {
  fetchInsights: (params: ShoppingInsightsParams) => Promise<void>;
  isLoading: boolean;
  data: ShoppingInsightsResult | null;
  error: string | null;
  reset: () => void;
}

export function useShoppingInsights(): UseShoppingInsightsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ShoppingInsightsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async (
    params: ShoppingInsightsParams
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await apiHelpers.post<ShoppingInsightsResult>(
        "/naver/insights/shopping",
        params
      );
      setData(result);
    } catch (err: any) {
      const errorMessage = err.message || "인사이트 조회에 실패했습니다.";
      setError(errorMessage);
      console.error("Shopping insights fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setIsLoading(false);
  };

  return {
    fetchInsights,
    isLoading,
    data,
    error,
    reset,
  };
}
