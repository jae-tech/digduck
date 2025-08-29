export interface ProductReview {
  author: string;
  rating: number;
  review: string;
  date: string;
  productVariant?: string;
  reviewPoints?: string;
  image?: string;
}

export interface CrawledProduct {
  id: string;
  name: string;
  url: string;
}

export interface CrawlExecutionResult {
  product: CrawledProduct;
  reviews: ProductReview[];
  totalAvailableReviews: number;
  actualCrawledReviews: number;
  processedPages: number;
  executionDurationMs: number;
}

export interface CrawlProgressData {
  totalReviews: number;
  crawledReviews: number;
  currentPage: number;
  estimatedTotalPages: number;
  elapsedTime: number;
  isComplete?: boolean;
  reviews?: ProductReview[];
  status?: string;
  message?: string;
}

export type ProgressCallback = (progress: CrawlProgressData) => void;

export interface CrawlConfiguration {
  maxPagesToProcess: number;
  sortOrder: ReviewSortOrder;
  enableRetryOnFailure: boolean;
  maxRetryAttempts: number;
}

export type ReviewSortOrder =
  | "ranking"
  | "latest"
  | "low-rating"
  | "high-rating";

export interface PaginationInfo {
  currentPageNumber: number;
  totalEstimatedPages: number;
  totalReviewCount: number;
  reviewsPerPage: number;
}

export interface AuthenticationCredentials {
  id: string;
  password: string;
}

export interface CrawlerErrorContext {
  operation: string;
  pageUrl: string;
  attempt: number;
  errorCode?: number;
}
