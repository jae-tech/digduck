// src/services/index.ts
import { NaverShoppingAPI } from "@/external/apis/naver-shopping-api";
import { ComparisonService } from "./comparison.service";
import { CrawlService } from "./crawl.service";

// 1. API 레이어
const naverShoppingAPI = new NaverShoppingAPI();

// 2. 비즈니스 서비스들 (의존성 수동 주입)
export const comparisonService = new ComparisonService(naverShoppingAPI);
export const crawlService = new CrawlService();

// 만약 서비스가 늘어나면 이런 식으로 계속 추가
// export const priceTrackingService = new PriceTrackingService(
//   comparisonService,
//   databaseService
// );
