import { httpClient } from "@/external/clients/http-client";
import type {
  ShoppingInsightsParams,
  CategoryKeywordParams,
  InsightsDataPoint,
  ShoppingInsightsResult,
  NaverInsightsApiResponse,
} from "@/types/api/naver-shopping.types";
import { env } from "process";

export class NaverShoppingAPI {
  private clientId: string;
  private clientSecret: string;

  constructor() {
    this.clientId = env.NAVER_CLIENT_ID || "";
    this.clientSecret = env.NAVER_CLIENT_SECRET || "";
  }

  async searchProducts(query: string) {
    const { data } = await httpClient.get(
      "https://openapi.naver.com/v1/search/shop",
      {
        headers: {
          "X-Naver-Client-Id": this.clientId,
          "X-Naver-Client-Secret": this.clientSecret,
        },
        params: {
          query,
          display: 100,
          start: 1,
          sort: "sim",
        },
      },
    );

    return data;
  }

  /**
   * 쇼핑 분야별 검색 클릭 추이 조회
   */
  async getShoppingCategories(
    params: ShoppingInsightsParams,
  ): Promise<ShoppingInsightsResult> {
    console.log("📊 네이버 쇼핑 인사이트 요청:", params);

    if (!this.isConfigured()) {
      console.error("❌ 네이버 API 키가 설정되지 않았습니다");
      throw new Error(
        "네이버 API 키가 설정되지 않았습니다. NAVER_CLIENT_ID, NAVER_CLIENT_SECRET를 확인해주세요.",
      );
    }

    try {
      const requestData = {
        startDate: params.startDate,
        endDate: params.endDate,
        timeUnit: params.timeUnit,
        category: params.category || [],
        ...(params.device && { device: params.device }),
        ...(params.gender && { gender: params.gender }),
        ...(params.ages && params.ages.length > 0 && { ages: params.ages }),
      };

      console.log("🚀 네이버 API 요청 데이터:", requestData);

      const { data } = await httpClient.post(
        "https://openapi.naver.com/v1/datalab/shopping/categories",
        requestData,
        {
          headers: {
            "X-Naver-Client-Id": this.clientId,
            "X-Naver-Client-Secret": this.clientSecret,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      console.log("✅ 네이버 API 응답:", data);

      return this.transformApiResponse(data);
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  /**
   * 특정 쇼핑 분야의 키워드별 검색 클릭 추이 조회
   */
  async getCategoryKeywords(
    params: CategoryKeywordParams,
  ): Promise<ShoppingInsightsResult> {
    try {
      const requestData = {
        startDate: params.startDate,
        endDate: params.endDate,
        timeUnit: params.timeUnit,
        category: params.category,
        keyword: params.keyword,
        ...(params.device && { device: params.device }),
        ...(params.gender && { gender: params.gender }),
        ...(params.ages && params.ages.length > 0 && { ages: params.ages }),
      };

      const { data } = await httpClient.post(
        "https://openapi.naver.com/v1/datalab/shopping/category/keywords",
        requestData,
        {
          headers: {
            "X-Naver-Client-Id": this.clientId,
            "X-Naver-Client-Secret": this.clientSecret,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      return this.transformApiResponse(data);
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  /**
   * 특정 쇼핑 분야의 기기별 검색 클릭 추이 조회
   */
  async getCategoryByDevice(
    params: Omit<ShoppingInsightsParams, "device"> & { category: string },
  ): Promise<ShoppingInsightsResult> {
    try {
      const requestData = {
        startDate: params.startDate,
        endDate: params.endDate,
        timeUnit: params.timeUnit,
        category: params.category,
        ...(params.gender && { gender: params.gender }),
        ...(params.ages && params.ages.length > 0 && { ages: params.ages }),
      };

      const { data } = await httpClient.post(
        "https://openapi.naver.com/v1/datalab/shopping/category/device",
        requestData,
        {
          headers: {
            "X-Naver-Client-Id": this.clientId,
            "X-Naver-Client-Secret": this.clientSecret,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      return this.transformApiResponse(data);
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  /**
   * 특정 쇼핑 분야의 성별 검색 클릭 추이 조회
   */
  async getCategoryByGender(
    params: Omit<ShoppingInsightsParams, "gender"> & { category: string },
  ): Promise<ShoppingInsightsResult> {
    try {
      const requestData = {
        startDate: params.startDate,
        endDate: params.endDate,
        timeUnit: params.timeUnit,
        category: params.category,
        ...(params.device && { device: params.device }),
        ...(params.ages && params.ages.length > 0 && { ages: params.ages }),
      };

      const { data } = await httpClient.post(
        "https://openapi.naver.com/v1/datalab/shopping/category/gender",
        requestData,
        {
          headers: {
            "X-Naver-Client-Id": this.clientId,
            "X-Naver-Client-Secret": this.clientSecret,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      return this.transformApiResponse(data);
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  /**
   * 특정 쇼핑 분야의 연령별 검색 클릭 추이 조회
   */
  async getCategoryByAge(
    params: Omit<ShoppingInsightsParams, "ages"> & { category: string },
  ): Promise<ShoppingInsightsResult> {
    try {
      const requestData = {
        startDate: params.startDate,
        endDate: params.endDate,
        timeUnit: params.timeUnit,
        category: params.category,
        ...(params.device && { device: params.device }),
        ...(params.gender && { gender: params.gender }),
      };

      const { data } = await httpClient.post(
        "https://openapi.naver.com/v1/datalab/shopping/category/age",
        requestData,
        {
          headers: {
            "X-Naver-Client-Id": this.clientId,
            "X-Naver-Client-Secret": this.clientSecret,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      return this.transformApiResponse(data);
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  /**
   * 키워드의 기기별 검색 클릭 추이 조회
   */
  async getKeywordByDevice(
    params: Omit<CategoryKeywordParams, "device"> & { keyword: string },
  ): Promise<ShoppingInsightsResult> {
    try {
      const requestData = {
        startDate: params.startDate,
        endDate: params.endDate,
        timeUnit: params.timeUnit,
        category: params.category,
        keyword: params.keyword,
        ...(params.gender && { gender: params.gender }),
        ...(params.ages && params.ages.length > 0 && { ages: params.ages }),
      };

      const { data } = await httpClient.post(
        "https://openapi.naver.com/v1/datalab/shopping/category/keyword/device",
        requestData,
        {
          headers: {
            "X-Naver-Client-Id": this.clientId,
            "X-Naver-Client-Secret": this.clientSecret,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      return this.transformApiResponse(data);
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  /**
   * 키워드의 성별 검색 클릭 추이 조회
   */
  async getKeywordByGender(
    params: Omit<CategoryKeywordParams, "gender"> & { keyword: string },
  ): Promise<ShoppingInsightsResult> {
    try {
      const requestData = {
        startDate: params.startDate,
        endDate: params.endDate,
        timeUnit: params.timeUnit,
        category: params.category,
        keyword: params.keyword,
        ...(params.device && { device: params.device }),
        ...(params.ages && params.ages.length > 0 && { ages: params.ages }),
      };

      const { data } = await httpClient.post(
        "https://openapi.naver.com/v1/datalab/shopping/category/keyword/gender",
        requestData,
        {
          headers: {
            "X-Naver-Client-Id": this.clientId,
            "X-Naver-Client-Secret": this.clientSecret,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      return this.transformApiResponse(data);
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  /**
   * 키워드의 연령별 검색 클릭 추이 조회
   */
  async getKeywordByAge(
    params: Omit<CategoryKeywordParams, "ages"> & { keyword: string },
  ): Promise<ShoppingInsightsResult> {
    try {
      const requestData = {
        startDate: params.startDate,
        endDate: params.endDate,
        timeUnit: params.timeUnit,
        category: params.category,
        keyword: params.keyword,
        ...(params.device && { device: params.device }),
        ...(params.gender && { gender: params.gender }),
      };

      const { data } = await httpClient.post(
        "https://openapi.naver.com/v1/datalab/shopping/category/keyword/age",
        requestData,
        {
          headers: {
            "X-Naver-Client-Id": this.clientId,
            "X-Naver-Client-Secret": this.clientSecret,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      return this.transformApiResponse(data);
    } catch (error: any) {
      throw this.handleApiError(error);
    }
  }

  /**
   * API 응답 데이터 변환
   */
  private transformApiResponse(
    data: NaverInsightsApiResponse,
  ): ShoppingInsightsResult {
    const result: ShoppingInsightsResult = {
      title: data.title || "쇼핑 인사이트 데이터",
      keywords: data.keywords || [],
      data: [],
    };

    // results 배열에서 모든 데이터를 합치기
    if (data.results && Array.isArray(data.results)) {
      data.results.forEach((resultItem: any) => {
        if (resultItem.data && Array.isArray(resultItem.data)) {
          const transformedData = resultItem.data.map((item: any) => ({
            period: item.period,
            ratio: item.ratio,
            title: resultItem.title, // 각 결과의 제목 추가
          }));
          result.data = result.data.concat(transformedData);
        }
      });
    }

    return result;
  }

  /**
   * API 오류 처리
   */
  private handleApiError(error: any): Error {
    console.error("네이버 쇼핑 인사이트 API 오류:", error);

    const status = error.response?.status;
    const message = error.response?.data?.errorMessage || error.message;

    switch (status) {
      case 401:
        return new Error(
          "네이버 API 인증에 실패했습니다. API 키를 확인해주세요.",
        );
      case 403:
        return new Error(
          "네이버 API 접근이 거부되었습니다. API 권한을 확인해주세요.",
        );
      case 429:
        return new Error(
          "API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
        );
      case 400:
        return new Error(`잘못된 요청입니다: ${message}`);
      case 500:
        return new Error(
          "네이버 서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        );
      default:
        return new Error(`네이버 API 호출 실패: ${message}`);
    }
  }

  // API 키 설정 확인
  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }

  // 테스트용 목업 데이터 생성
  async getMockInsights(
    params: ShoppingInsightsParams,
  ): Promise<ShoppingInsightsResult> {
    const mockData: InsightsDataPoint[] = [];
    const start = new Date(params.startDate);
    const end = new Date(params.endDate);

    // 시간 단위에 따른 데이터 생성
    const timeIncrement =
      params.timeUnit === "date" ? 1 : params.timeUnit === "week" ? 7 : 30;

    for (
      let current = new Date(start);
      current <= end;
      current.setDate(current.getDate() + timeIncrement)
    ) {
      mockData.push({
        period: current.toISOString().split("T")[0],
        ratio: Math.floor(Math.random() * 100) + 1,
      });
    }

    // 카테고리에서 키워드 추출
    const categoryNames = params.category?.map((cat) => cat.name) || [
      "테스트 카테고리",
    ];

    return {
      title: "쇼핑 인사이트 데이터 (테스트)",
      keywords: categoryNames,
      data: mockData,
    };
  }
}
