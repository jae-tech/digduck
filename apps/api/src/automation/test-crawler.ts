import { env } from "@/config/env";
import { ChromiumBrowserManager } from "./browser/chromium-browser-manager";
import { StealthPageFactory } from "./browser/stealth-page-factory";
import { NaverAuthenticationService } from "./services/naver-authentication-service";
import { ProductReview, ReviewSortOrder } from "./types/crawler-types";
import { Page } from "playwright";

// 단계별 진행을 위한 사용자 입력 대기 함수
async function waitForUserInput(message: string): Promise<void> {
  console.log(`\n⏸️  ${message}`);
  console.log("📌 Press Enter to continue or Ctrl+C to exit...");

  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();

    const onData = (key: Buffer) => {
      if (key[0] === 0x0d || key[0] === 0x0a) {
        // Enter key
        cleanup();
        resolve();
      } else if (key[0] === 0x03) {
        // Ctrl+C
        console.log("\n\n⏹️  Test stopped by user");
        cleanup();
        process.exit(0);
      }
    };

    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener("data", onData);
    };

    process.stdin.on("data", onData);
  });
}

// 크롤러 테스트 함수
async function testCrawlingSetup() {
  console.log("🧪 Starting step-by-step crawler test...");
  console.log("📋 Test steps:");
  console.log("   1️⃣ Browser initialization");
  console.log("   2️⃣ Naver main page access");
  console.log("   3️⃣ Authentication (if credentials provided)");
  console.log("   4️⃣ Product page navigation");
  console.log("   5️⃣ Review crawling test");
  console.log("   6️⃣ Final cleanup");

  let browserManager: ChromiumBrowserManager | null = null;
  let stealthPageFactory: StealthPageFactory | null = null;
  let page: any = null;

  try {
    // 1단계: 브라우저 초기화
    await waitForUserInput("STEP 1: Ready to initialize browser?");

    console.log("\n🔧 Initializing browser manager...");
    browserManager = new ChromiumBrowserManager({
      headless: false, // 테스트용으로 브라우저 표시
      maxConcurrentPages: 1,
    });

    await browserManager.initializeBrowser();
    console.log("✅ Browser instance initialized");

    console.log("🔧 Initializing stealth page factory...");
    stealthPageFactory = new StealthPageFactory(browserManager);

    console.log("🔧 Creating stealth page...");
    page = await stealthPageFactory.createStealthPage();
    console.log("✅ Step 1 completed: Browser and page ready");

    // 2단계: 네이버 메인 페이지 접근
    await waitForUserInput("STEP 2: Ready to access Naver main page?");

    console.log("\n🌐 Accessing Naver main page...");
    await stealthPageFactory.navigateWithStealth(page, "https://www.naver.com");
    console.log("✅ Step 2 completed: Successfully accessed Naver main page");

    // 3단계: 인증 (자격증명 있을 경우)
    if (env.NAVER_LOGIN_ID && env.NAVER_LOGIN_PASSWORD) {
      await waitForUserInput("STEP 3: Ready to perform authentication?");

      console.log("\n🔐 Starting authentication...");
      const authService = new NaverAuthenticationService({
        id: env.NAVER_LOGIN_ID,
        password: env.NAVER_LOGIN_PASSWORD,
      });

      await authService.performAuthentication(page);
      console.log("✅ Step 3 completed: Authentication successful");
    } else {
      console.log("\n⚠️ Step 3 skipped: No credentials provided");
    }

    // 4단계: 상품 페이지 이동
    await waitForUserInput("STEP 4: Ready to navigate to product page?");

    console.log("\n🛒 Navigating to product page...");
    const testProductUrl =
      "https://brand.naver.com/bbsusan/products/7147880229";
    await stealthPageFactory.navigateWithStealth(page, testProductUrl);
    console.log("✅ Step 4 completed: Successfully navigated to product page");

    // 5단계: 리뷰 크롤링
    await waitForUserInput("STEP 5: Ready to start review crawling?");

    console.log("\n📝 Starting review crawling...");
    const allReviews: ProductReview[] = [];
    let currentPage = 1;
    const maxPages = 20; // 최대 20페이지까지 테스트

    while (currentPage <= maxPages) {
      console.log(`\n📄 크롤링 페이지 ${currentPage}/${maxPages}...`);

      const reviews = await crawlProductReviews(
        page,
        stealthPageFactory,
        "latest",
      );

      console.log(`✅ 페이지 ${currentPage}: ${reviews.length}개 리뷰 수집`);
      allReviews.push(...reviews);

      if (reviews.length > 0) {
        console.log("📋 이 페이지 샘플 리뷰:");
        reviews.slice(0, 2).forEach((review, index) => {
          console.log(`  ${index + 1}. Rating: ${review.rating}/5`);
          console.log(`     Author: ${review.author}`);
          console.log(`     Content: ${review.review.substring(0, 80)}...`);
          console.log(`     Date: ${review.date}\n`);
        });
      }

      // 다음 페이지 확인 및 이동
      const hasNextPage = await checkAndNavigateToNextPage(
        page,
        stealthPageFactory,
        currentPage,
      );
      if (!hasNextPage) {
        console.log("🔚 더 이상 페이지가 없습니다.");
        break;
      }

      // 다음 페이지 진행 여부 확인
      if (currentPage < maxPages) {
        await waitForUserInput(
          `다음 페이지 ${currentPage + 1}로 진행하시겠습니까?`,
        );
      }

      currentPage++;
    }

    console.log(
      `✅ Step 5 completed: 총 ${allReviews.length}개 리뷰 수집 (${currentPage - 1}페이지)`,
    );

    if (allReviews.length > 0) {
      console.log("\n📊 전체 수집 결과:");
      console.log(`   - 총 리뷰 수: ${allReviews.length}`);
      console.log(`   - 크롤링 페이지: ${currentPage - 1}`);
      console.log(
        `   - 평균 평점: ${(allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)}`,
      );
    }

    // 브라우저 상태 확인
    console.log("\n📊 Browser session status:");
    const status = browserManager.getBrowserSessionStatus();
    console.log(`- Active: ${status.isActive}`);
    console.log(`- Active pages: ${status.activePagesCount}`);
    console.log(`- Terminating: ${status.isTerminating}`);

    // 6단계: 최종 확인 및 정리
    await waitForUserInput("STEP 6: Ready to cleanup and finish?");

    console.log("\n✅ All steps completed successfully!");
    console.log("🎉 Crawler test finished!");
  } catch (error) {
    console.error("\n❌ Crawler test failed:", error);
    console.log("💡 You can inspect the current state before cleanup");
    await waitForUserInput("Press Enter to continue with cleanup...");
  } finally {
    // 정리 작업
    if (browserManager) {
      console.log("\n🧹 Cleaning up browser...");
      await browserManager.cleanup();
      console.log("✅ Cleanup completed");
    }
  }
}

// 이 파일이 직접 실행될 경우 테스트 실행
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

// 상품 리뷰 크롤링 함수
async function crawlProductReviews(
  page: Page,
  stealthPageFactory: StealthPageFactory,
  sortOrder: ReviewSortOrder = "latest",
): Promise<ProductReview[]> {
  const reviews: ProductReview[] = [];

  try {
    // 리뷰 탭으로 이동
    console.log("🔍 Looking for review section...");
    const reviewTabSelectors = [
      '#_productFloatingTab a[data-name="REVIEW"]',
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
        "⚠️ Review tab not found, looking for reviews on current page",
      );
    }

    // 리뷰 로드 대기
    await stealthPageFactory.randomDelay(2000, 4000);

    // 첫 번째 페이지에서만 정렬 설정 및 페이지네이션 정보 확인
    const isFirstPage =
      (await page
        .locator('div[role="menubar"][data-shp-area="revlist.pgn"]')
        .getAttribute("data-shp-contents-id")) === "1";

    if (isFirstPage) {
      // 페이지네이션 정보 확인
      await checkPaginationInfo(page);

      // 리뷰 정렬 옵션 설정
      await setReviewSortOrder(page, sortOrder, stealthPageFactory);
    }

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
    const reviewCount = await page
      .locator('#_productFloatingTab a[data-name="REVIEW"] span')
      .innerText();

    console.log(`총 ${reviewCount}개의 리뷰를 찾았습니다.`);

    // 페이지당 최대 20개 리뷰 (실제 네이버 스마트스토어 구조)
    const reviewItemsCount = await reviewItems.count();
    const maxReviews = Math.min(reviewItemsCount, 20);

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
            rating,
            author,
            review: content,
            date,
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

// 리뷰 정렬 옵션 설정 함수
async function setReviewSortOrder(
  page: Page,
  sortOrder: ReviewSortOrder,
  stealthPageFactory: StealthPageFactory,
): Promise<void> {
  try {
    console.log(`🔄 Setting review sort order to: ${sortOrder}`);

    // 네이버 스마트스토어 정렬 옵션 ul 찾기
    const sortUl = page.locator(
      'ul[data-shp-inventory="revlist"][data-shp-area="revlist.sort"]',
    );
    const sortUlCount = await sortUl.count();

    if (sortUlCount === 0) {
      console.log("⚠️ Sort options not found, using default sort");
      return;
    }

    // 정렬 옵션 텍스트 매핑
    const sortTextMap: Record<ReviewSortOrder, string> = {
      ranking: "랭킹순",
      latest: "최신순",
      "high-rating": "평점 높은순",
      "low-rating": "평점 낮은순",
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
      const isChecked = (await item.getAttribute("aria-checked")) === "true";

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

// 다음 페이지 확인 및 이동 함수
async function checkAndNavigateToNextPage(
  page: Page,
  stealthPageFactory: StealthPageFactory,
  currentPage: number,
): Promise<boolean> {
  try {
    console.log(`🔍 페이지 ${currentPage + 1} 존재 여부 확인 중...`);

    // 네이버 스마트스토어 페이지네이션 선택자들 (실제 구조 반영)
    const paginationSelectors = [
      `a[data-shp-area="revlist.pgn"][data-shp-contents-type="pgn"][data-shp-contents-id="${currentPage + 1}"]`, // 직접 페이지 번호 (실제 클래스)
      'a[data-shp-contents-type="pgn"]:has-text("다음")', // 페이지네이션 컨텐츠 타입
      'a[data-shp-area="revlist.pgn"]:has-text("다음")',
    ];

    let nextPageElement = null;

    // 다음 페이지 버튼/링크 찾기
    for (const selector of paginationSelectors) {
      try {
        const element = page.locator(selector);
        const isVisible = await element.isVisible({ timeout: 2000 });
        const isEnabled = await element.isEnabled().catch(() => true);

        if (isVisible && isEnabled) {
          // aria-hidden="false"인 다음 버튼만 선택 (활성화된 것)
          const ariaHidden = await element.getAttribute("aria-hidden");
          if (ariaHidden !== "true") {
            nextPageElement = element;
            console.log(`✅ 다음 페이지 요소 발견: ${selector}`);
            break;
          }
        }
      } catch {
        continue;
      }
    }

    if (!nextPageElement) {
      console.log("⚠️ 다음 페이지 요소를 찾을 수 없습니다.");
      return false;
    }

    // 다음 페이지로 이동
    console.log(`🔄 페이지 ${currentPage + 1}로 이동 중...`);
    await nextPageElement.hover();
    await stealthPageFactory.randomDelay(500, 1000);
    await nextPageElement.click();

    // 페이지 로딩 대기
    await stealthPageFactory.randomDelay(3000, 5000);
    await page.waitForLoadState("domcontentloaded", { timeout: 15000 });

    // 새 페이지의 리뷰가 로드될 때까지 대기
    try {
      await page.waitForSelector('li[data-shp-contents-type="review"]', {
        timeout: 10000,
      });
      console.log(`✅ 페이지 ${currentPage + 1} 로드 완료`);
      return true;
    } catch {
      console.log(`⚠️ 페이지 ${currentPage + 1} 리뷰 로드 실패`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 다음 페이지 이동 중 오류: ${error}`);
    return false;
  }
}

// 페이지네이션 정보 확인 함수
async function checkPaginationInfo(page: Page): Promise<void> {
  try {
    console.log("📊 페이지네이션 정보 확인 중...");

    // 현재 표시되는 페이지 번호들 확인 (실제 구조 반영)
    const visiblePageSelectors = [
      'a[data-shp-inventory="revlist"][data-shp-contents-type="pgn"]',
    ];

    const visiblePages: number[] = [];
    let hasNextButton = false;

    for (const selector of visiblePageSelectors) {
      try {
        const pageElements = page.locator(selector);
        const count = await pageElements.count();

        if (count > 0) {
          for (let i = 0; i < count; i++) {
            const element = pageElements.nth(i);
            const text = await element.innerText().catch(() => "");
            const pageNum = parseInt(text);
            if (!isNaN(pageNum) && !visiblePages.includes(pageNum)) {
              visiblePages.push(pageNum);
            }
          }
          break;
        }
      } catch {
        continue;
      }
    }

    // 다음 버튼 존재 확인
    try {
      const nextButton = page.locator('a:has-text("다음")');
      hasNextButton = await nextButton.isVisible({ timeout: 2000 });
    } catch {
      hasNextButton = false;
    }

    if (visiblePages.length > 0) {
      visiblePages.sort((a, b) => a - b);
      const maxVisible = Math.max(...visiblePages);
      if (hasNextButton) {
        console.log(
          `📄 현재 표시 페이지: 1-${maxVisible} (다음 페이지 있음, 총 페이지 수는 예상 불가)`,
        );
      } else {
        console.log(
          `📄 현재 표시 페이지: 1-${maxVisible} (마지막 페이지 그룹)`,
        );
      }
    } else {
      console.log("⚠️ 페이지네이션 정보를 찾을 수 없습니다.");
    }

    // 현재 페이지 확인 (실제 구조 반영)
    const currentPageSelectors = [
      'a[aria-current="true"]', // aria-current="true"인 요소
      'a.hyY6CXtbcn[aria-current="true"]', // 실제 현재 페이지 클래스
    ];

    for (const selector of currentPageSelectors) {
      try {
        const currentElement = page.locator(selector);
        if (await currentElement.isVisible({ timeout: 1000 })) {
          const currentPageText = await currentElement.innerText();
          console.log(`📍 현재 페이지: ${currentPageText}`);
          break;
        }
      } catch {
        continue;
      }
    }
  } catch (error) {
    console.log(`❌ 페이지네이션 정보 확인 중 오류: ${error}`);
  }
}

export { testCrawlingSetup, checkAndNavigateToNextPage, checkPaginationInfo };
