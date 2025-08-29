import { SourceSite, CrawlStatus, PlatformType } from '@prisma/client'

// 크롤링 설정 타입
export interface CrawlSettings {
  maxPages?: number
  maxItems?: number
  requestDelay?: number
  userAgent?: string
  filters?: {
    rating?: { min?: number, max?: number }
    dateRange?: { from?: string, to?: string }
    keywords?: string[]
    excludeKeywords?: string[]
  }
  selectors?: {
    [key: string]: string
  }
}

// 스마트스토어 리뷰 아이템
export interface SmartStoreReviewItem {
  reviewId?: string
  title?: string
  content?: string
  rating?: number
  reviewDate?: string
  reviewerName?: string
  isVerified?: boolean
  helpfulCount?: number
  imageUrls?: string[]
  productInfo?: {
    name?: string
    option?: string
    price?: number
  }
}

// 상품 정보 아이템
export interface ProductItem {
  productId?: string
  title?: string
  description?: string
  price?: number
  originalPrice?: number
  discount?: number
  rating?: number
  reviewCount?: number
  stock?: number
  seller?: string
  imageUrls?: string[]
  videoUrls?: string[]
  category?: string
  tags?: string[]
}

// 사이트별 확장 데이터 타입
export interface SiteSpecificData {
  smartstore?: SmartStoreReviewItem | ProductItem
  coupang?: any
  gmarket?: any
  [key: string]: any
}

// 크롤링 아이템 생성 요청
export interface CreateCrawlItemRequest {
  crawlHistoryId: number
  itemId?: string
  title?: string
  content?: string
  url?: string
  rating?: number
  reviewDate?: Date
  reviewerName?: string
  isVerified?: boolean
  price?: number
  originalPrice?: number
  discount?: number
  stock?: number
  imageUrls?: string[]
  videoUrls?: string[]
  siteSpecificData?: SiteSpecificData
  itemOrder?: number
  pageNumber?: number
}

// 크롤링 히스토리 생성 요청
export interface CreateCrawlHistoryRequest {
  userEmail: string
  deviceId: string
  sourceSite: SourceSite
  searchUrl: string
  searchKeywords?: string
  crawlSettings?: CrawlSettings
  userAgent?: string
  proxyUsed?: string
  requestInterval?: number
}

// 크롤링 히스토리 업데이트 요청
export interface UpdateCrawlHistoryRequest {
  status?: CrawlStatus
  itemsFound?: number
  itemsCrawled?: number
  pagesProcessed?: number
  startedAt?: Date
  completedAt?: Date
  durationMs?: number
  errorMessage?: string
  errorDetails?: any
  metadata?: any
}

// 크롤링 시작 요청
export interface StartCrawlRequest {
  userEmail: string
  deviceId: string
  sourceSite: SourceSite
  searchUrl: string
  searchKeywords?: string
  crawlSettings?: CrawlSettings
  templateId?: number // 템플릿 사용 시
}

// 크롤링 템플릿 생성 요청
export interface CreateCrawlTemplateRequest {
  userEmail: string
  name: string
  description?: string
  sourceSite: SourceSite
  maxPages?: number
  maxItems?: number
  requestDelay?: number
  filters?: any
  selectors?: any
  isPublic?: boolean
}

// 크롤링 히스토리 필터
export interface CrawlHistoryFilter {
  userEmail?: string
  sourceSite?: SourceSite
  status?: CrawlStatus
  dateRange?: {
    from?: Date
    to?: Date
  }
  deviceId?: string
  searchKeywords?: string
}

// 크롤링 통계
export interface CrawlStatistics {
  totalCrawls: number
  successfulCrawls: number
  failedCrawls: number
  totalItemsCrawled: number
  averageDuration: number
  crawlsByStatus: {
    [status: string]: number
  }
  crawlsBySite: {
    [site: string]: number
  }
  crawlsByDate: {
    date: string
    count: number
    itemCount: number
  }[]
}

// 크롤링 히스토리 응답 (상세)
export interface CrawlHistoryResponse {
  id: number
  userEmail: string
  deviceId: string
  sourceSite: SourceSite
  searchUrl: string
  searchKeywords?: string
  status: CrawlStatus
  itemsFound: number
  itemsCrawled: number
  pagesProcessed: number
  startedAt?: Date
  completedAt?: Date
  durationMs?: number
  errorMessage?: string
  errorDetails?: any
  userAgent?: string
  proxyUsed?: string
  requestInterval?: number
  crawlSettings?: CrawlSettings
  metadata?: any
  createdAt: Date
  crawlItems?: CrawlItemResponse[]
}

// 크롤링 아이템 응답
export interface CrawlItemResponse {
  id: number
  crawlHistoryId: number
  itemId?: string
  title?: string
  content?: string
  url?: string
  rating?: number
  reviewDate?: Date
  reviewerName?: string
  isVerified?: boolean
  price?: number
  originalPrice?: number
  discount?: number
  stock?: number
  imageUrls?: string[]
  videoUrls?: string[]
  siteSpecificData?: SiteSpecificData
  itemOrder?: number
  pageNumber?: number
  createdAt: Date
}

// 크롤링 템플릿 응답
export interface CrawlTemplateResponse {
  id: number
  userEmail: string
  name: string
  description?: string
  sourceSite: SourceSite
  maxPages: number
  maxItems: number
  requestDelay: number
  filters?: any
  selectors?: any
  isPublic: boolean
  usageCount: number
  createdAt: Date
  updatedAt: Date
}

// 에러 타입
export class CrawlHistoryError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'CrawlHistoryError'
  }
}

// 에러 코드
export enum CrawlHistoryErrorCodes {
  CRAWL_NOT_FOUND = 'CRAWL_NOT_FOUND',
  INVALID_SOURCE_SITE = 'INVALID_SOURCE_SITE',
  CRAWL_ALREADY_RUNNING = 'CRAWL_ALREADY_RUNNING',
  CRAWL_LIMIT_EXCEEDED = 'CRAWL_LIMIT_EXCEEDED',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  DEVICE_NOT_ACTIVATED = 'DEVICE_NOT_ACTIVATED',
  LICENSE_EXPIRED = 'LICENSE_EXPIRED'
}