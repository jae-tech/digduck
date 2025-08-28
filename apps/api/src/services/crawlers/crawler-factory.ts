import { SourceSite } from '@prisma/client'
import { BaseCrawler, CrawlOptions } from './base-crawler'
import { SmartStoreCrawler } from './smartstore-crawler'

/**
 * 크롤러 팩토리 - 사이트별 크롤러 인스턴스 생성
 */
export class CrawlerFactory {
  /**
   * 사이트별 크롤러 생성
   */
  static createCrawler(sourceSite: SourceSite, options?: CrawlOptions): BaseCrawler {
    switch (sourceSite) {
      case SourceSite.SMARTSTORE:
        return new SmartStoreCrawler(options)
      
      case SourceSite.COUPANG:
        throw new Error('Coupang crawler is not implemented yet')
      
      case SourceSite.GMARKET:
        throw new Error('Gmarket crawler is not implemented yet')
      
      case SourceSite.AUCTION:
        throw new Error('Auction crawler is not implemented yet')
      
      case SourceSite.ELEVENST:
        throw new Error('11st crawler is not implemented yet')
      
      default:
        throw new Error(`Unsupported source site: ${sourceSite}`)
    }
  }

  /**
   * 지원되는 사이트 목록
   */
  static getSupportedSites(): SourceSite[] {
    return [
      SourceSite.SMARTSTORE,
      // TODO: 다른 사이트들 추가 시 여기에 포함
    ]
  }

  /**
   * 사이트 지원 여부 확인
   */
  static isSupported(sourceSite: SourceSite): boolean {
    return this.getSupportedSites().includes(sourceSite)
  }

  /**
   * 사이트별 기본 설정
   */
  static getDefaultOptions(sourceSite: SourceSite): CrawlOptions {
    const baseOptions: CrawlOptions = {
      maxPages: 10,
      maxItems: 2000,
      requestDelay: 1000,
      timeout: 30000,
      retries: 3
    }

    switch (sourceSite) {
      case SourceSite.SMARTSTORE:
        return {
          ...baseOptions,
          requestDelay: 1500, // 네이버는 좀 더 보수적으로
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      
      case SourceSite.COUPANG:
        return {
          ...baseOptions,
          requestDelay: 2000, // 쿠팡은 더 보수적으로
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      
      default:
        return baseOptions
    }
  }
}