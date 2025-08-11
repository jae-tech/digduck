import { getBrowser, humanLikeBehavior, setupPageStealth } from "./browser";

/**
 * 스마트스토어 가격비교 크롤러
 * @param keyword
 * @returns [{ title: string, price: string }]
 */
export async function crawlLowPrice(keyword: string) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    const url = `https://search.shopping.naver.com/search/all?adQuery=${keyword}&origQuery=${keyword}&pagingIndex=1&pagingSize=40&productSet=model&query=${keyword}&sort=rel&timestamp=&viewType=list`;

    await page.goto(url, {
      waitUntil: "networkidle", // domcontentloaded보다 안정적
      timeout: 30000,
    });

    // 더 정확한 선택자들
    const products = await page.$$eval(
      '.basicList_item__0T9JD, .product_item, [data-testid="basicList-item"]',
      (items) => {
        return Array.from(items)
          .slice(0, 10)
          .map((item) => {
            const titleEl = item.querySelector(
              '.basicList_title__3P9Q7, .product_title, a[data-testid="basicList-title"]'
            );
            const priceEl = item.querySelector(
              '.price_num__2WUXn, .price_area .sale, [data-testid="basicList-price"]'
            );

            return {
              title: titleEl?.textContent?.trim() || "제목 없음",
              price: priceEl?.textContent?.trim() || "가격 정보 없음",
            };
          });
      }
    );

    return products;
  } catch (error) {
    console.error("가격비교 크롤링 에러:", error);
    return [];
  } finally {
    await page.close();
  }
}

async function extractProductInfo(page: Page) {
  try {
    const title = await page
      .$eval(
        'h1, h2, h3, [class*="ProductTitle"], [class*="product"], [class*="title"]',
        (el) => el.textContent?.trim()
      )
      .catch(() => "상품명 없음");

    const price = await page
      .$eval('[class*="price"], .price, ._2L9k0', (el) =>
        el.textContent?.trim()
      )
      .catch(() => "가격 없음");

    return { title, price };
  } catch (error) {
    return { title: "추출 실패", price: "추출 실패" };
  }
}

// 리뷰 추출
async function extractReviews(page: Page) {
  try {
    // 리뷰 탭 클릭 시도
    const reviewTab = await page
      .$('[href*="review"], [role="tab"]:has-text("리뷰")')
      .catch(() => null);
    if (reviewTab) {
      await reviewTab.click();
      await page.waitForTimeout(2000);
      await humanLikeBehavior(page);
    }

    const reviews = await page.$$eval(
      '[class*="review"], .review_item, .ReviewItem',
      (elements) =>
        elements
          .slice(0, 5)
          .map((el) => {
            const content = el
              .querySelector('[class*="content"], .text')
              ?.textContent?.trim();
            return content ? { content } : null;
          })
          .filter(Boolean)
    );

    return reviews;
  } catch (error) {
    console.log("리뷰 추출 실패:", error.message);
    return [];
  }
}

// 리뷰 크롤링 함수 대폭 개선
export async function crawlReviews(url: string) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // 스텔스 설정 적용
    await setupPageStealth(page);

    console.log("🕵️ 스텔스 모드로 크롤링 시작...");

    // 1단계: 네이버 메인 페이지 방문 (Referer 설정)
    console.log("1단계: 네이버 메인 페이지 방문");
    await page.goto("https://www.naver.com", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await humanLikeBehavior(page);

    // 2단계: 검색 페이지 방문 (선택사항)
    console.log("2단계: 네이버 쇼핑 방문");
    await page.goto("https://shopping.naver.com", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await humanLikeBehavior(page);

    // 3단계: 실제 상품 페이지 방문
    console.log("3단계: 상품 페이지 방문");
    await page.goto(url, {
      waitUntil: "networkidle",
      timeout: 60000,
    });

    // 페이지 로딩 대기
    await page.waitForTimeout(3000);

    // 봇 탐지 메시지 확인
    const botDetected = await page
      .$("text=상품이 존재하지 않습니다")
      .catch(() => null);
    if (botDetected) {
      console.log("❌ 봇 탐지됨!");
      throw new Error("Bot detected");
    }

    console.log("✅ 페이지 접근 성공!");

    // 사람처럼 행동
    await humanLikeBehavior(page);

    // 상품 정보 추출
    const productInfo = await extractProductInfo(page);

    // 리뷰 추출 시도
    const reviews = await extractReviews(page);

    return {
      success: true,
      product: productInfo,
      reviews: reviews,
      userAgent: await page.evaluate(() => navigator.userAgent),
    };
  } catch (error) {
    console.error("❌ 스텔스 크롤링 실패:", error.message);

    // 디버깅을 위한 스크린샷
    try {
      await page.screenshot({
        path: `stealth-error-${Date.now()}.png`,
        fullPage: true,
      });
      console.log("📸 에러 스크린샷 저장됨");
    } catch (e) {
      console.log("스크린샷 저장 실패");
    }

    return {
      success: false,
      error: error.message,
      userAgent: await page
        .evaluate(() => navigator.userAgent)
        .catch(() => "unknown"),
    };
  } finally {
    await browser.close();
  }
}
