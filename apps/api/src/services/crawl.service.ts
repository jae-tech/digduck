import { crawlLowPrice, crawlReviews } from "@/cralwer/smart-store.crawler";

export class CrawlService {
  async crawlProduct(url: string) {
    // 여기에 DB 저장 로직이나 데이터 변환 로직을 추가 가능
    const data = await crawlLowPrice(url);
    return { ...data, crawledAt: new Date() };
  }

  async crawlReviews(url: string) {
    const reviews = await crawlReviews(url);
    return { reviews, crawledAt: new Date() };
  }
}
