import { useState } from "react";
import type { ShoppingInsightsParams, ShoppingInsightsResult } from "../types/crawler.types";

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

  const fetchInsights = async (params: ShoppingInsightsParams): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/naver/insights/shopping", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "인사이트 조회에 실패했습니다.");
      }

      const result: ShoppingInsightsResult = await response.json();
      setData(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
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