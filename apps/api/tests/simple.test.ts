import { describe, it, expect } from 'vitest'
import { SmartStoreCrawler } from '../src/services/crawlers/smartstore-crawler'

describe('간단한 테스트', () => {
  it('SmartStoreCrawler가 인스턴스화되어야 함', () => {
    const crawler = new SmartStoreCrawler()
    expect(crawler).toBeDefined()
  })

  it('URL 파싱 테스트', () => {
    const crawler = new SmartStoreCrawler()
    const url = 'https://smartstore.naver.com/search?q=테스트'
    const result = (crawler as any).parseUrl(url)

    expect(result.isValid).toBe(true)
    expect(result.searchKeywords).toBe('테스트')
  })

  it('텍스트 정리 테스트', () => {
    const crawler = new SmartStoreCrawler()
    const dirtyText = '  많은   공백\n\n과\n\n줄바꿈  '
    const cleanText = (crawler as any).cleanText(dirtyText)

    expect(cleanText).toBe('많은 공백 과 줄바꿈')
  })

  it('평점 추출 테스트', () => {
    const crawler = new SmartStoreCrawler()
    
    expect((crawler as any).extractRatingFromText('4.5점')).toBe(4.5)
    expect((crawler as any).extractRatingFromText('별점 3점')).toBe(3)
    expect((crawler as any).extractRatingFromText('★★★★☆')).toBe(4)
    expect((crawler as any).extractRatingFromText('평점 없음')).toBeUndefined()
  })
})