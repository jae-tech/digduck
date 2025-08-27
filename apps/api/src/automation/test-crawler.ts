import { ChromiumBrowserManager } from "./browser/chromium-browser-manager";
import { StealthPageFactory } from "./browser/stealth-page-factory";
import { NaverAuthenticationService } from "./services/naver-authentication-service";
import { ProductReview, ReviewSortOrder } from "./types/crawler-types";
import { Page } from "playwright";
import { env } from "@/config/env";

async function testCrawlingSetup() {
  console.log("🧪 Starting crawler test...");

  let browserManager: ChromiumBrowserManager | null = null;
  let stealthPageFactory: StealthPageFactory | null = null;

  try {
    // 1. Initialize browser manager
    console.log("\n🔧 Initializing browser manager...");
    browserManager = new ChromiumBrowserManager({
      headless: false, // Show browser for testing
      maxConcurrentPages: 1,
    });

    // 2. Initialize stealth page factory
    console.log("🔧 Initializing stealth page factory...");
    stealthPageFactory = new StealthPageFactory(browserManager);

    // 3. Create stealth page
    console.log("🔧 Creating stealth page...");
    const page = await stealthPageFactory.createStealthPage();

    // 4. Test Naver main page access
    console.log("\n🌐 Testing Naver main page access...");
    await stealthPageFactory.navigateWithStealth(page, "https://www.naver.com");

    console.log("✅ Successfully accessed Naver main page");

    // 5. Test authentication if credentials are available
    if (env.NAVER_LOGIN_ID && env.NAVER_LOGIN_PASSWORD) {
      console.log("\n🔐 Testing authentication...");
      const authService = new NaverAuthenticationService({
        username: env.NAVER_LOGIN_ID,
        password: env.NAVER_LOGIN_PASSWORD,
      });

      await authService.performAuthentication(page);
      console.log("✅ Authentication test completed");
    } else {
      console.log("⚠️ Skipping authentication test (no credentials provided)");
    }

    // 6. Test product page navigation (valid URL)
    console.log("\n🛒 Testing product page navigation...");
    const testProductUrl =
      "https://smartstore.naver.com/brickmansion/products/10149558614";

    await stealthPageFactory.navigateWithStealth(page, testProductUrl);
    console.log("✅ Successfully navigated to product page");

    // 7. Test review crawling
    console.log("\n📝 Testing review crawling...");
    const reviews = await crawlProductReviews(page, stealthPageFactory, "latest");
    console.log(`✅ Successfully crawled ${reviews.length} reviews`);

    if (reviews.length > 0) {
      console.log("📋 Sample reviews:");
      reviews.slice(0, 3).forEach((review, index) => {
        console.log(`${index + 1}. Rating: ${review.rating}/5`);
        console.log(`   Author: ${review.author}`);
        console.log(`   Content: ${review.content.substring(0, 100)}...`);
        console.log(`   Date: ${review.date}\n`);
      });
    }

    // 7. Check page status
    console.log("\n📊 Browser session status:");
    const status = browserManager.getBrowserSessionStatus();
    console.log(`- Active: ${status.isActive}`);
    console.log(`- Active pages: ${status.activePagesCount}`);
    console.log(`- Terminating: ${status.isTerminating}`);

    // 8. Keep page open for manual inspection
    console.log(
      "\n⏰ Keeping page open for 10 seconds for manual inspection..."
    );
    await new Promise((resolve) => setTimeout(resolve, 10000));

    console.log("\n✅ Crawler test completed successfully!");
  } catch (error) {
    console.error("\n❌ Crawler test failed:", error);

    // Take screenshot on error
    try {
      const page = await stealthPageFactory?.createStealthPage();
      if (page) {
        await page.screenshot({
          path: `test-error-${Date.now()}.png`,
          fullPage: true,
        });
        console.log("📸 Error screenshot saved");
      }
    } catch (screenshotError) {
      console.error("Failed to save screenshot:", screenshotError);
    }
  } finally {
    // Cleanup
    if (browserManager) {
      console.log("\n🧹 Cleaning up browser...");
      await browserManager.cleanup();
    }
  }
}

// Execute test if this file is run directly
if (require.main === module) {
  testCrawlingSetup()
    .then(() => {
      console.log("Test execution completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Test execution failed:", error);
      process.exit(1);
    });
}

async function crawlProductReviews(
  page: Page,
  stealthPageFactory: StealthPageFactory,
  sortOrder: ReviewSortOrder = "latest"
): Promise<ProductReview[]> {
  const reviews: ProductReview[] = [];

  try {
    // 리뷰 탭으로 이동
    console.log("🔍 Looking for review section...");
    const reviewTabSelectors = [
      'a[href*="review"]',
      'button:has-text("리뷰")',
      '[data-testid*="review"]',
      ".review-tab",
      'a:has-text("리뷰")',
    ];

    let reviewTabFound = false;
    for (const selector of reviewTabSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        await page.click(selector);
        reviewTabFound = true;
        console.log("✅ Found and clicked review tab");
        break;
      } catch {
        continue;
      }
    }

    if (!reviewTabFound) {
      console.log(
        "⚠️ Review tab not found, looking for reviews on current page"
      );
    }

    // 리뷰 로드 대기
    await stealthPageFactory.randomDelay(2000, 4000);

    // 리뷰 정렬 옵션 설정
    await setReviewSortOrder(page, sortOrder, stealthPageFactory);

    // 네이버 스마트스토어 리뷰 섹션 찾기
    try {
      await page.waitForSelector('li[data-shp-contents-type="review"]', {
        timeout: 10000,
      });
      console.log("✅ Found Naver Smart Store review section");
    } catch {
      console.log("⚠️ Naver Smart Store review elements not found");
      return reviews;
    }

    const reviewItems = page.locator('li[data-shp-contents-type="review"]');
    const reviewCount = await reviewItems.count();

    console.log(`총 ${reviewCount}개의 리뷰를 찾았습니다.`);

    // 최대 10개까지만 처리
    const maxReviews = Math.min(reviewCount, 10);

    for (let i = 0; i < maxReviews; i++) {
      try {
        const review = reviewItems.nth(i);

        // 1. 평점 추출
        let rating = 0;
        try {
          const ratingElements = review
            .locator("em")
            .filter({ hasText: /^[1-5]$/ });
          const ratingCount = await ratingElements.count();
          if (ratingCount > 0) {
            const ratingText = await ratingElements.first().innerText();
            rating = parseInt(ratingText) || 0;
          }
        } catch {}

        // 2. 작성자 추출
        let author = "익명";
        try {
          const authorElements = review.locator("strong").first();
          const authorCount = await authorElements.count();
          if (authorCount > 0) {
            author = await authorElements.innerText();
          }
        } catch {}

        // 3. 날짜 추출
        let date = new Date().toISOString().split("T")[0];
        try {
          const dateElements = review
            .locator("span")
            .filter({ hasText: /\d{2}\.\d{2}\.\d{2}\./ });
          const dateCount = await dateElements.count();
          if (dateCount > 0) {
            date = await dateElements.first().innerText();
          }
        } catch {}

        // 4. 리뷰 텍스트 추출
        let content = "";
        try {
          // 긴 텍스트를 포함한 span 요소들 찾기
          const textElements = review
            .locator("span")
            .filter({ hasText: /.{20,}/ });
          const textElementsCount = await textElements.count();

          for (let j = 0; j < textElementsCount; j++) {
            const text = await textElements.nth(j).innerText();
            const cleanText = text.trim();

            // 리뷰 본문으로 보이는 텍스트 판단
            const excludeWords = ["평점", "신고", "도움", "더보기"];
            const isReviewText =
              cleanText.length > 20 &&
              !excludeWords.some((word) => cleanText.includes(word)) &&
              !cleanText.match(/^\d{2}\.\d{2}\.\d{2}\.$/);

            if (isReviewText) {
              content = cleanText;
              break;
            }
          }
        } catch {}

        // 유효한 데이터가 있을 때만 저장
        if (rating || author !== "익명" || content) {
          reviews.push({
            id: `${Date.now()}-${i}`, // Generate a unique id for each review
            rating,
            author,
            content,
            date,
            helpfulCount: 0,
          });
          console.log(`리뷰 ${i + 1}: ${author} - ${rating}점`);
        }

        // 각 리뷰 처리 간 딜레이
        await stealthPageFactory.randomDelay(100, 300);
      } catch (error) {
        console.log(`⚠️ 리뷰 ${i + 1} 추출 중 오류:`, error);
        continue;
      }
    }
  } catch (error) {
    console.error("❌ Review crawling failed:", error);
  }

  return reviews;
}

async function setReviewSortOrder(
  page: Page,
  sortOrder: ReviewSortOrder,
  stealthPageFactory: StealthPageFactory
): Promise<void> {
  try {
    console.log(`🔄 Setting review sort order to: ${sortOrder}`);
    
    // 네이버 스마트스토어 정렬 옵션 ul 찾기
    const sortUl = page.locator('ul[data-shp-inventory="revlist"][data-shp-area="revlist.sort"]');
    const sortUlCount = await sortUl.count();
    
    if (sortUlCount === 0) {
      console.log("⚠️ Sort options not found, using default sort");
      return;
    }
    
    // 정렬 옵션 텍스트 매핑
    const sortTextMap: Record<ReviewSortOrder, string> = {
      "ranking": "랭킹순",
      "latest": "최신순", 
      "high-rating": "평점 높은순",
      "low-rating": "평점 낮은순"
    };
    
    const targetSortText = sortTextMap[sortOrder];
    if (!targetSortText) {
      console.log(`⚠️ Unknown sort order: ${sortOrder}`);
      return;
    }
    
    // 모든 정렬 옵션 확인
    const sortItems = sortUl.locator('li a[role="radio"]');
    const sortItemsCount = await sortItems.count();
    
    for (let i = 0; i < sortItemsCount; i++) {
      const item = sortItems.nth(i);
      const text = await item.innerText();
      const isChecked = await item.getAttribute('aria-checked') === 'true';
      
      console.log(`정렬 옵션: ${text.trim()} (현재: ${isChecked})`);
      
      // 원하는 정렬 옵션 클릭
      if (text.trim() === targetSortText && !isChecked) {
        await item.click();
        await stealthPageFactory.randomDelay(2000, 3000);
        console.log(`✅ Changed sort order to ${targetSortText}`);
        return;
      } else if (text.trim() === targetSortText && isChecked) {
        console.log(`✅ Already sorted by ${targetSortText}`);
        return;
      }
    }
    
    console.log(`⚠️ Sort option "${targetSortText}" not found`);
    
  } catch (error) {
    console.log("⚠️ Failed to set sort order:", error);
  }
}

export { testCrawlingSetup };
