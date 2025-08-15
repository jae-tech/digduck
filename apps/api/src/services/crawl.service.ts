import { NaverCrawler } from "@/cralwer/smart-store.crawler";

export class CrawlService {
  private naverCrawler: NaverCrawler;

  constructor() {
    this.naverCrawler = new NaverCrawler();
  }

  async crawlProduct(url: string) {
    // 여기에 DB 저장 로직이나 데이터 변환 로직을 추가 가능
    // const data = await this.naverCrawler.crawlProduct(url);
    // return { ...data, crawledAt: new Date() };
  }

  async crawlReviews(
    url: string,
    sort: "ranking" | "latest" | "row-rating" | "high-rating",
    maxPage: number
  ) {
    const reviews = await this.naverCrawler.crawlReviews(url, sort, maxPage);
    return { reviews, crawledAt: new Date() };
  }
}
