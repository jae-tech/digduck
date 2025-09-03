// 크롤링 정렬 옵션 타입
export type CrawlSort = "ranking" | "latest" | "high-rating" | "low-rating";

// 크롤링 요청 매개변수
export interface CrawlParams {
  url: string;
  sort: CrawlSort;
  maxPages: number;
  useUserIp?: boolean;
}

// 리뷰 데이터 타입
export interface Review {
  id: string;
  author: string;
  productInfo: string;
  rating: number;
  content: string;
  image?: string;
  date: string;
}

// 크롤링 진행 상태 타입
export type CrawlStatus = 
  | "logging_in"
  | "navigating"
  | "scrolling"
  | "finding_reviews"
  | "loading_reviews"
  | "extracting_reviews"
  | "completed"
  | "error";

// 크롤링 진행 정보
export interface CrawlProgress {
  status: CrawlStatus;
  message: string;
  currentPage: number;
  estimatedTotalPages: number;
  totalReviews: number;
  crawledReviews: number;
  elapsedTime: number;
}

// 크롤링 최종 결과
export interface CrawlResult {
  reviews: Review[];
  totalCount: number;
  totalReviews: number;
  processedPages: number;
  executionTime: number;
}

// 정렬 옵션 설정
export interface SortOption {
  value: CrawlSort;
  label: string;
  description: string;
  icon: React.ReactNode;
}

// 통계 정보
export interface CrawlStats {
  totalReviews: number;
  crawledReviews: number;
  crawledPages: number;
  estimatedPages: number;
  duration: number;
  progressPercentage: number;
}

// 네이버 쇼핑인사이트 관련 타입
export type TimeUnit = "date" | "week" | "month";
export type DeviceType = "pc" | "mo";
export type GenderType = "m" | "f";
export type AgeGroup = "10" | "20" | "30" | "40" | "50" | "60";

export interface ShoppingInsightsParams {
  startDate: string;
  endDate: string;
  timeUnit: TimeUnit;
  category?: string;
  device?: DeviceType;
  gender?: GenderType;
  ages?: AgeGroup[];
}

export interface InsightsDataPoint {
  period: string;
  ratio: number;
}

export interface ShoppingInsightsResult {
  title: string;
  keywords: string[];
  data: InsightsDataPoint[];
}