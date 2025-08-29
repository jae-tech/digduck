import { describe, it, expect, beforeEach } from 'vitest'
import { SmartStoreCrawler } from '../../../src/services/crawlers/smartstore-crawler'

describe('SmartStoreCrawler', () => {
  let crawler: SmartStoreCrawler

  beforeEach(() => {
    crawler = new SmartStoreCrawler({
      maxPages: 2,
      maxItems: 10,
      requestDelay: 100
    })
  })

  describe('URL 파싱', () => {
    it('유효한 스마트스토어 URL을 파싱해야 함', () => {
      const url = 'https://smartstore.naver.com/search?q=테스트'
      const result = (crawler as any).parseUrl(url)

      expect(result.isValid).toBe(true)
      expect(result.searchKeywords).toBe('테스트')
    })

    it('검색 파라미터가 있는 URL을 파싱해야 함', () => {
      const url = 'https://smartstore.naver.com/search?query=상품&minPrice=1000&maxPrice=5000'
      const result = (crawler as any).parseUrl(url)

      expect(result.isValid).toBe(true)
      expect(result.searchKeywords).toBe('상품')
      expect(result.filters.minPrice).toBe('1000')
      expect(result.filters.maxPrice).toBe('5000')
    })

    it('유효하지 않은 URL은 파싱 실패해야 함', () => {
      const url = 'https://coupang.com/search?q=테스트'
      const result = (crawler as any).parseUrl(url)

      expect(result.isValid).toBe(false)
    })
  })

  describe('텍스트 정리', () => {
    it('HTML 텍스트를 정리해야 함', () => {
      const dirtyText = '  많은   공백\n\n과\n\n줄바꿈  '
      const cleanText = (crawler as any).cleanText(dirtyText)

      expect(cleanText).toBe('많은 공백 과 줄바꿈')
    })
  })

  describe('평점 추출', () => {
    it('텍스트에서 평점을 추출해야 함', () => {
      expect((crawler as any).extractRatingFromText('4.5점')).toBe(4.5)
      expect((crawler as any).extractRatingFromText('별점 3점')).toBe(3)
      expect((crawler as any).extractRatingFromText('★★★★☆')).toBe(4)
    })

    it('10점 만점을 5점 만점으로 변환해야 함', () => {
      expect((crawler as any).extractRatingFromText('8점')).toBe(4)
      expect((crawler as any).extractRatingFromText('10점')).toBe(5)
    })

    it('평점이 없으면 undefined 반환해야 함', () => {
      expect((crawler as any).extractRatingFromText('평점 없음')).toBeUndefined()
    })
  })

  describe('숫자 추출', () => {
    it('텍스트에서 숫자를 추출해야 함', () => {
      expect((crawler as any).extractNumber('1,000원')).toBe(1000)
      expect((crawler as any).extractNumber('가격: 25,500원')).toBe(25500)
      expect((crawler as any).extractNumber('₩123.45')).toBe(123.45)
    })

    it('숫자가 없으면 undefined 반환해야 함', () => {
      expect((crawler as any).extractNumber('가격 미정')).toBeUndefined()
    })
  })

  describe('날짜 파싱', () => {
    it('한국어 날짜 형식을 파싱해야 함', () => {
      const date1 = (crawler as any).parseDate('2024년 3월 15일')
      expect(date1?.getFullYear()).toBe(2024)
      expect(date1?.getMonth()).toBe(2) // 0-based
      expect(date1?.getDate()).toBe(15)

      const date2 = (crawler as any).parseDate('2024.03.15')
      expect(date2?.getFullYear()).toBe(2024)
      expect(date2?.getMonth()).toBe(2)
      expect(date2?.getDate()).toBe(15)
    })

    it('유효하지 않은 날짜는 undefined 반환해야 함', () => {
      expect((crawler as any).parseDate('잘못된 날짜')).toBeUndefined()
    })
  })

  describe('필터 적용', () => {
    const mockItems = [
      {
        itemId: '1',
        title: '테스트 상품 1',
        content: '좋은 상품입니다',
        price: 1000,
        rating: 4.5
      },
      {
        itemId: '2', 
        title: '테스트 상품 2',
        content: '나쁜 상품입니다',
        price: 2000,
        rating: 2.0
      },
      {
        itemId: '3',
        title: '특가 상품',
        content: '할인 중입니다',
        price: 1500,
        rating: 4.0
      }
    ]

    it('평점 필터를 적용해야 함', () => {
      const filters = { rating: { min: 4.0 } }
      const result = (crawler as any).applyFilters(mockItems, filters)

      expect(result).toHaveLength(2)
      expect(result.every((item: any) => item.rating >= 4.0)).toBe(true)
    })

    it('가격 필터를 적용해야 함', () => {
      const filters = { price: { min: 1200, max: 1800 } }
      const result = (crawler as any).applyFilters(mockItems, filters)

      expect(result).toHaveLength(1)
      expect(result[0].itemId).toBe('3')
    })

    it('키워드 필터를 적용해야 함', () => {
      const filters = { keywords: ['특가'] }
      const result = (crawler as any).applyFilters(mockItems, filters)

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('특가 상품')
    })

    it('제외 키워드 필터를 적용해야 함', () => {
      const filters = { excludeKeywords: ['나쁜'] }
      const result = (crawler as any).applyFilters(mockItems, filters)

      expect(result).toHaveLength(2)
      expect(result.every((item: any) => !item.content.includes('나쁜'))).toBe(true)
    })
  })
})