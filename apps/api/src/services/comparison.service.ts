import { NaverShoppingAPI } from "@/external/apis/naver-shopping-api";
import { NaverShoppingItem } from "@/types/api/naver-shopping.types";

export class ComparisonService {
  constructor(private naverShoppingAPI: NaverShoppingAPI) {}

  async findOptimalPrice(productKeyword: string) {
    // 1. 네이버 쇼핑에서 동일/유사 상품 검색
    const searchResults =
      await this.naverShoppingAPI.searchProducts(productKeyword);
    // 2. 최저가 찾기
    const lowestPrice = Math.min(
      ...searchResults.map((item: NaverShoppingItem) => item.lprice),
    );
    // 3. 최저가 - 10원으로 새 가격 계산
    const _newPrice = lowestPrice - 10;
    // 4. 수익성 검증
    // 5. 최적 가격 반환
  }

  async updateCompetitivePrice(_productId: string) {
    // 자동으로 경쟁력 있는 가격으로 업데이트
  }
}
