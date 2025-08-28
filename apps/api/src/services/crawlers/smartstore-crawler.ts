import { SourceSite } from '@prisma/client'
import { JSDOM } from 'jsdom'
import { 
  BaseCrawler, 
  CrawlResultItem, 
  CrawlOptions, 
  CrawlProgressCallback 
} from './base-crawler'
import { CrawlSettings, SmartStoreReviewItem } from '../../types/crawl-history.types'

export class SmartStoreCrawler extends BaseCrawler {
  constructor(options: CrawlOptions = {}) {
    super(SourceSite.SMARTSTORE, options)
  }

  /**
   * 스마트스토어 크롤링 실행
   */
  protected async performCrawl(
    searchUrl: string,
    options: CrawlOptions & CrawlSettings,
    callback?: CrawlProgressCallback
  ): Promise<CrawlResultItem[]> {
    const urlInfo = this.parseUrl(searchUrl)
    
    if (!urlInfo.isValid) {
      throw new Error('Invalid SmartStore URL')
    }

    const results: CrawlResultItem[] = []
    const maxPages = Math.min(options.maxPages || 10, 50) // 최대 50페이지
    const maxItems = options.maxItems || 2000
    
    let currentPage = 1
    let totalItemsFound = 0

    callback?.onProgress?.({
      currentPage: 0,
      totalPages: maxPages,
      itemsFound: 0,
      itemsCrawled: 0,
      message: '크롤링을 시작합니다...'
    })

    while (currentPage <= maxPages && results.length < maxItems && !this.checkShouldStop()) {
      try {
        callback?.onProgress?.({
          currentPage,
          totalPages: maxPages,
          itemsFound: totalItemsFound,
          itemsCrawled: results.length,
          message: `${currentPage}페이지 처리 중...`
        })

        const pageUrl = this.buildPageUrl(searchUrl, currentPage)
        const response = await this.fetchWithRetry(pageUrl)
        const html = await response.text()

        const pageItems = await this.parsePage(html, currentPage)
        
        if (pageItems.length === 0) {
          console.log(`Page ${currentPage} has no items, stopping crawl`)
          break
        }

        totalItemsFound += pageItems.length

        // 필터 적용
        const filteredItems = this.applyFilters(pageItems, options.filters)
        results.push(...filteredItems)

        // 각 아이템에 대해 콜백 호출
        filteredItems.forEach(item => callback?.onItem?.(item))

        // 봇 탐지 회피를 위한 랜덤 지연
        await this.randomDelay()
        
        currentPage++

      } catch (error) {
        console.error(`Error crawling page ${currentPage}:`, error)
        callback?.onError?.(error as Error)
        
        // 페이지 오류 시 다음 페이지로 계속 진행
        currentPage++
        continue
      }
    }

    callback?.onProgress?.({
      currentPage: currentPage - 1,
      totalPages: maxPages,
      itemsFound: totalItemsFound,
      itemsCrawled: results.length,
      message: `크롤링 완료: ${results.length}개 아이템 수집`
    })

    return results.slice(0, maxItems)
  }

  /**
   * 스마트스토어 URL 파싱
   */
  protected parseUrl(url: string): {
    isValid: boolean
    searchKeywords?: string
    category?: string
    filters?: any
  } {
    try {
      const urlObj = new URL(url)
      
      // 스마트스토어 도메인 확인
      if (!url.includes('smartstore.naver.com')) {
        return { isValid: false }
      }

      const params = urlObj.searchParams
      const searchKeywords = params.get('q') || params.get('query')
      const category = params.get('cat_id')

      return {
        isValid: true,
        searchKeywords: searchKeywords || undefined,
        category: category || undefined,
        filters: {
          minPrice: params.get('minPrice'),
          maxPrice: params.get('maxPrice'),
          rating: params.get('rating'),
          delivery: params.get('delivery')
        }
      }
    } catch {
      return { isValid: false }
    }
  }

  /**
   * 페이지 HTML 파싱
   */
  protected async parsePage(html: string, pageNumber: number): Promise<CrawlResultItem[]> {
    const dom = new JSDOM(html)
    const document = dom.window.document

    const results: CrawlResultItem[] = []
    
    // 리뷰 페이지인지 상품 목록 페이지인지 확인
    if (html.includes('review') && html.includes('rating')) {
      return this.parseReviewPage(document, pageNumber)
    } else {
      return this.parseProductPage(document, pageNumber)
    }
  }

  /**
   * 리뷰 페이지 파싱
   */
  private parseReviewPage(document: Document, pageNumber: number): CrawlResultItem[] {
    const results: CrawlResultItem[] = []
    
    // 스마트스토어 리뷰 셀렉터 (실제 셀렉터는 사이트 구조에 따라 조정 필요)
    const reviewSelectors = [
      '.review_list_item',
      '.reviewItems',
      '[data-testid="review-item"]',
      '.review-item'
    ]

    let reviewElements: NodeListOf<Element> | null = null

    for (const selector of reviewSelectors) {
      reviewElements = document.querySelectorAll(selector)
      if (reviewElements.length > 0) break
    }

    if (!reviewElements || reviewElements.length === 0) {
      return results
    }

    reviewElements.forEach((element, index) => {
      try {
        const reviewItem = this.parseReviewElement(element, pageNumber, index + 1)
        if (reviewItem) {
          results.push(reviewItem)
        }
      } catch (error) {
        console.error('Error parsing review element:', error)
      }
    })

    return results
  }

  /**
   * 상품 페이지 파싱
   */
  private parseProductPage(document: Document, pageNumber: number): CrawlResultItem[] {
    const results: CrawlResultItem[] = []
    
    // 상품 목록 셀렉터
    const productSelectors = [
      '.product_list_item',
      '.productItems',
      '[data-testid="product-item"]',
      '.product-item'
    ]

    let productElements: NodeListOf<Element> | null = null

    for (const selector of productSelectors) {
      productElements = document.querySelectorAll(selector)
      if (productElements.length > 0) break
    }

    if (!productElements || productElements.length === 0) {
      return results
    }

    productElements.forEach((element, index) => {
      try {
        const productItem = this.parseProductElement(element, pageNumber, index + 1)
        if (productItem) {
          results.push(productItem)
        }
      } catch (error) {
        console.error('Error parsing product element:', error)
      }
    })

    return results
  }

  /**
   * 리뷰 요소 파싱
   */
  private parseReviewElement(element: Element, pageNumber: number, itemOrder: number): CrawlResultItem | null {
    try {
      // 리뷰 내용
      const contentElement = element.querySelector('.review_content, .review-text, .content')
      const content = contentElement?.textContent ? this.cleanText(contentElement.textContent) : undefined

      // 평점
      const ratingElement = element.querySelector('.rating, .star-rating, .review-rating')
      const ratingText = ratingElement?.textContent || ratingElement?.getAttribute('aria-label') || ''
      const rating = this.extractRatingFromText(ratingText)

      // 리뷰어 정보
      const reviewerElement = element.querySelector('.reviewer, .review-author, .user-name')
      const reviewerName = reviewerElement?.textContent ? this.cleanText(reviewerElement.textContent) : undefined

      // 리뷰 날짜
      const dateElement = element.querySelector('.review-date, .date, .created-at')
      const dateText = dateElement?.textContent || ''
      const reviewDate = this.parseDate(dateText)

      // 구매 확인 여부
      const verifiedElement = element.querySelector('.verified, .confirmed, .purchased')
      const isVerified = verifiedElement !== null

      // 이미지
      const imageElements = element.querySelectorAll('img')
      const imageUrls: string[] = []
      imageElements.forEach(img => {
        const src = img.getAttribute('src') || img.getAttribute('data-src')
        if (src && !src.includes('icon') && !src.includes('sprite')) {
          imageUrls.push(this.resolveUrl('https://smartstore.naver.com', src))
        }
      })

      // 리뷰 ID 추출
      const itemId = element.getAttribute('data-review-id') || 
                   element.getAttribute('id') || 
                   `review_${pageNumber}_${itemOrder}`

      const siteSpecificData: SmartStoreReviewItem = {
        reviewId: itemId,
        title: undefined, // 리뷰는 제목이 없는 경우가 많음
        content,
        rating,
        reviewDate: reviewDate?.toISOString(),
        reviewerName,
        isVerified,
        imageUrls
      }

      return {
        itemId,
        title: undefined,
        content,
        rating,
        reviewDate,
        reviewerName,
        isVerified,
        imageUrls,
        siteSpecificData: { smartstore: siteSpecificData },
        itemOrder,
        pageNumber
      }
    } catch (error) {
      console.error('Error parsing review element:', error)
      return null
    }
  }

  /**
   * 상품 요소 파싱
   */
  private parseProductElement(element: Element, pageNumber: number, itemOrder: number): CrawlResultItem | null {
    try {
      // 상품명
      const titleElement = element.querySelector('.product-title, .title, .name, h3, h4')
      const title = titleElement?.textContent ? this.cleanText(titleElement.textContent) : undefined

      // 가격
      const priceElement = element.querySelector('.price, .current-price, .sale-price')
      const priceText = priceElement?.textContent || ''
      const price = this.extractNumber(priceText)

      // 원가
      const originalPriceElement = element.querySelector('.original-price, .before-price, .regular-price')
      const originalPriceText = originalPriceElement?.textContent || ''
      const originalPrice = this.extractNumber(originalPriceText)

      // 할인율
      const discountElement = element.querySelector('.discount, .sale-rate')
      const discountText = discountElement?.textContent || ''
      const discount = this.extractNumber(discountText)

      // 평점
      const ratingElement = element.querySelector('.rating, .star-rating')
      const ratingText = ratingElement?.textContent || ''
      const rating = this.extractRatingFromText(ratingText)

      // 이미지
      const imageElement = element.querySelector('img')
      const imageSrc = imageElement?.getAttribute('src') || imageElement?.getAttribute('data-src')
      const imageUrls = imageSrc ? [this.resolveUrl('https://smartstore.naver.com', imageSrc)] : []

      // 상품 URL
      const linkElement = element.querySelector('a')
      const url = linkElement?.getAttribute('href') ? 
                 this.resolveUrl('https://smartstore.naver.com', linkElement.getAttribute('href')!) : 
                 undefined

      // 상품 ID
      const itemId = linkElement?.getAttribute('data-product-id') || 
                    element.getAttribute('data-id') || 
                    `product_${pageNumber}_${itemOrder}`

      return {
        itemId,
        title,
        url,
        price,
        originalPrice,
        discount,
        rating,
        imageUrls,
        siteSpecificData: { smartstore: { productId: itemId, title, price, originalPrice, discount, rating, imageUrls } },
        itemOrder,
        pageNumber
      }
    } catch (error) {
      console.error('Error parsing product element:', error)
      return null
    }
  }

  /**
   * 텍스트에서 평점 추출
   */
  private extractRatingFromText(text: string): number | undefined {
    // "4.5점", "별점 4점", "★★★★☆" 등의 형식에서 평점 추출
    const numberMatch = text.match(/(\d+(?:\.\d+)?)/)?.[1]
    if (numberMatch) {
      const rating = parseFloat(numberMatch)
      return rating <= 5 ? rating : rating / 2 // 10점 만점을 5점 만점으로 변환
    }

    // 별표 개수로 평점 계산
    const starCount = (text.match(/★/g) || []).length
    if (starCount > 0) {
      return starCount
    }

    return undefined
  }

  /**
   * 페이지 URL 생성
   */
  private buildPageUrl(baseUrl: string, pageNumber: number): string {
    const url = new URL(baseUrl)
    url.searchParams.set('page', pageNumber.toString())
    return url.toString()
  }

  /**
   * 필터 적용
   */
  private applyFilters(items: CrawlResultItem[], filters?: any): CrawlResultItem[] {
    if (!filters) return items

    return items.filter(item => {
      // 평점 필터
      if (filters.rating?.min && item.rating && item.rating < filters.rating.min) {
        return false
      }
      if (filters.rating?.max && item.rating && item.rating > filters.rating.max) {
        return false
      }

      // 가격 필터
      if (filters.price?.min && item.price && item.price < filters.price.min) {
        return false
      }
      if (filters.price?.max && item.price && item.price > filters.price.max) {
        return false
      }

      // 키워드 필터
      if (filters.keywords && filters.keywords.length > 0) {
        const text = `${item.title || ''} ${item.content || ''}`.toLowerCase()
        const hasKeyword = filters.keywords.some((keyword: string) => 
          text.includes(keyword.toLowerCase())
        )
        if (!hasKeyword) return false
      }

      // 제외 키워드 필터
      if (filters.excludeKeywords && filters.excludeKeywords.length > 0) {
        const text = `${item.title || ''} ${item.content || ''}`.toLowerCase()
        const hasExcludeKeyword = filters.excludeKeywords.some((keyword: string) => 
          text.includes(keyword.toLowerCase())
        )
        if (hasExcludeKeyword) return false
      }

      return true
    })
  }
}