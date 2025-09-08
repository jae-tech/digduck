import {
  CrawlOptions,
  CrawlResultItem,
  CrawlProgressCallback,
} from "@/services/crawlers/base-crawler";
import { CrawlSettings } from "@/types/crawl.types";
import {
  NaverBlogCrawler,
  NaverBlogCategory,
} from "@/services/crawlers/naver-blog-crawler";
import { SmartStoreCrawler } from "@/services/crawlers/smart-store-crawler";

export class CrawlService {
  private naverBlogCrawler: NaverBlogCrawler;
  private smartStoreCrawler: SmartStoreCrawler;

  constructor() {
    this.naverBlogCrawler = new NaverBlogCrawler();
    this.smartStoreCrawler = new SmartStoreCrawler();
  }

  /**
   * 네이버 블로그 크롤링 실행
   */
  async crawlNaverBlog(
    searchUrl: string,
    options: CrawlOptions & CrawlSettings,
    callback?: CrawlProgressCallback
  ): Promise<CrawlResultItem[]> {
    return await this.naverBlogCrawler.crawlNaverBlog(
      searchUrl,
      options,
      callback
    );
  }

  /**
   * 네이버 블로그 카테고리 목록 조회
   */
  public async getNaverBlogCategories(
    blogId: string
  ): Promise<NaverBlogCategory[]> {
    return await this.naverBlogCrawler.getNaverBlogCategories(blogId);
  }

  /**
   * 스마트스토어 크롤링 실행
   */
  async crawlSmartStore(
    searchUrl: string,
    options: CrawlOptions & CrawlSettings,
    callback?: CrawlProgressCallback
  ): Promise<CrawlResultItem[]> {
    return await this.smartStoreCrawler.crawlSmartStore(
      searchUrl,
      options,
      callback
    );
  }
}
