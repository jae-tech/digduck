export interface NaverShoppingItem {
  title: string;
  link: string;
  image: string;
  lprice: number; // 최저가
  hprice: number; // 최고가
  mallName: string; // 쇼핑몰 이름
  productId: string; // 상품 ID
  productType: number; // 상품 타입 -- 1: 일반상품, 2: 일반 비매칭상품, 3: 일반 매칭상품, 4: 중고상품, 5: 중고 비매칭상품, 6: 중고 매칭상품, 7: 단종상품, 8: 단종 비매칭상품, 9: 단종 매칭상품, 10: 판매예정상품, 11: 판매예정 비매칭상품, 12: 판매예정 매칭상품
  maker: string; // 제조사
  brand: string; // 브랜드
  category1: string; // 대분류
  category2: string; // 중분류
  category3: string; // 소분류
  category4: string; // 세분류
}

export interface NaverShoppingResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: NaverShoppingItem[];
}

export interface NaverShoppingError {
  errorMessage: string;
  errorCode: string;
}

export interface NaverShoppingSearchParams {
  query: string;
  display?: number; // 기본값: 10 -- ~100
  start?: number; // 기본값: 1 -- ~100
  sort?: "sim" | "date" | "asc" | "desc"; // 기본값: "sim"
  filter?: string; // 필터링 조건
  exclude?: string; // 제외할 조건
}
