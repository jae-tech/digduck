import { Page } from "playwright";
import { BrowserService } from "./browser";
import { env } from "@/config/env";

export interface Review {
  id: string;
  author: string;
  rating: number;
  content: string;
  date: string;
  images?: string[];
  verified: boolean;
}

export interface Product {
  id: string;
  name: string;
  url: string;
  reviews: Review[];
  totalReviews: number;
}

export class NaverCrawler {
  private browserService: BrowserService;

  constructor() {
    this.browserService = new BrowserService({
      headless: process.env.NODE_ENV === "production",
      timeout: 60000,
      maxPages: 2,
    });
  }

  async crawlReviews(
    productUrl: string,
    sort: "ranking" | "latest" | "row-rating" | "high-rating" = "ranking",
    maxPages: number = 999
  ): Promise<Product> {
    console.log(`🚀 크롤링 시작: ${productUrl}`);

    let page = await this.browserService.createStealthPage();
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        retryCount++;
        console.log(`📍 크롤링 시도 ${retryCount}/${maxRetries}`);

        // 1. 네이버 메인에서 자연스럽게 시작
        await this.naturalNaverAccess(page);

        // 2. 로그인 진행
        await this.performNaverLogin(page);

        // 3. 최종 상품 페이지로 이동
        await this.accessProductPage(page, productUrl);

        // 4. 봇 체크 처리
        await this.handleBotCheck(page);

        // 5. 리뷰 탭으로 이동
        await this.navigateToReviews(page);

        // 6. 리뷰 수집
        const reviews = await this.collectAllReviews(page, sort, maxPages);

        // 7. 상품 정보 추출
        const productInfo = await this.extractProductInfo(page);

        const result = {
          ...productInfo,
          reviews,
          totalReviews: reviews.length,
        };

        console.log("✅ 크롤링 성공!");
        return result;
      } catch (error) {
        console.error(
          `❌ 크롤링 실패 (시도 ${retryCount}/${maxRetries}):`,
          error.message
        );

        // 429 에러 특별 처리
        if (
          error.message.includes("429") ||
          error.message.includes("Too Many Requests")
        ) {
          console.log("🚫 429 에러 감지 - 특별 복구 프로세스 실행");

          if (retryCount < maxRetries) {
            await this.recover429Error(page, retryCount);

            // 새 브라우저 세션으로 재시작
            try {
              await page.close();
              await this.browserService.close();

              // 긴 대기
              const waitTime = Math.pow(2, retryCount) * 60000;
              console.log(`⏰ 새 세션 시작 전 대기: ${waitTime / 60000}분`);
              await new Promise((resolve) => setTimeout(resolve, waitTime));

              page = await this.browserService.createStealthPage();
              console.log("🔄 새 브라우저 세션으로 재시작");
              continue;
            } catch (restartError) {
              console.error("❌ 브라우저 재시작 실패:", restartError);
            }
          }
        }

        // 다른 에러의 경우 재시도 여부 결정
        if (retryCount < maxRetries && this.shouldRetry(error)) {
          console.log(`🔄 ${5 * retryCount}초 후 재시도...`);
          await this.browserService.randomWait(
            5000 * retryCount,
            10000 * retryCount
          );
          continue;
        }

        // 에러 시 스크린샷 저장
        try {
          await page.screenshot({
            path: `error-${Date.now()}.png`,
            fullPage: true,
          });
        } catch (screenshotError) {
          console.error("스크린샷 저장 실패:", screenshotError);
        }

        // 최종 실패
        if (retryCount === maxRetries) {
          throw new Error(
            `크롤링 최종 실패 (${maxRetries}회 시도): ${error.message}`
          );
        }
      } finally {
        await page.close();
      }
    }

    throw new Error("크롤링 실패 - 예상치 못한 종료");
  }

  /**
   * 1단계: 네이버 메인 접근 및 자연스러운 행동
   */
  private async naturalNaverAccess(page: Page): Promise<void> {
    console.log("🌐 네이버 메인 접근 중...");

    await this.browserService.safeNaverGoto(page, "https://www.naver.com", {
      simulateHuman: true,
    });

    await this.browserService.randomWait(3000, 6000);

    await this.browserService.simulateNaverHumanBehavior(page, {
      scroll: true,
      mouseMove: true,
      randomWait: true,
    });
  }

  /**
   * 2단계: 네이버 로그인 진행 (로그인 상태 확인 포함)
   */
  private async performNaverLogin(page: Page): Promise<void> {
    console.log("🔐 네이버 로그인 상태 확인 중...");

    try {
      // 먼저 로그인 상태 확인
      const isLoggedIn = await this.checkLoginStatus(page);

      if (isLoggedIn) {
        console.log("✅ 이미 로그인되어 있음 - 로그인 과정 생략");
        return;
      }

      console.log("🔐 로그인 필요 - 로그인 프로세스 시작...");

      // 로그인 버튼 찾기 및 클릭
      await this.findAndClickLoginButton(page);

      // 로그인 페이지로 이동 대기
      await page.waitForURL(/nid\.naver\.com/, { timeout: 15000 });
      console.log("✅ 로그인 페이지 도달");

      // 로그인 폼 처리
      await this.fillLoginForm(page);

      // 로그인 완료 대기
      await this.waitForLoginCompletion(page);
    } catch (error) {
      console.error("❌ 로그인 실패:", error);
      throw error;
    }
  }

  /**
   * 로그인 상태 확인
   */
  private async checkLoginStatus(page: Page): Promise<boolean> {
    try {
      console.log("🔍 로그인 상태 확인 중...");

      const loginIndicators = await page.evaluate(() => {
        // 로그인된 사용자만 보이는 요소들 확인
        const loggedInSelectors = [
          ".MyView-module__user_area___",
          ".gnb_login_wrap .user",
          '[class*="user_name"]',
          '[class*="my_info"]',
          'a[href*="logout"]',
          ".service_area .user",
        ];

        // 로그인하지 않은 사용자에게만 보이는 요소들
        const notLoggedInSelectors = [
          'a[class*="link_login"]',
          '.gnb_login_wrap a[href*="login"]',
          'a:has-text("로그인")',
        ];

        let loggedInCount = 0;
        let notLoggedInCount = 0;

        // 로그인된 상태 요소 확인
        for (const selector of loggedInSelectors) {
          try {
            const element = document.querySelector(selector);
            if (element && element.offsetParent !== null) {
              loggedInCount++;
              console.log(`로그인 상태 요소 발견: ${selector}`);
            }
          } catch (e) {
            // 선택자 오류 무시
          }
        }

        // 비로그인 상태 요소 확인
        for (const selector of notLoggedInSelectors) {
          try {
            const element = document.querySelector(selector);
            if (element && element.offsetParent !== null) {
              notLoggedInCount++;
              console.log(`비로그인 상태 요소 발견: ${selector}`);
            }
          } catch (e) {
            // 선택자 오류 무시
          }
        }

        return { loggedInCount, notLoggedInCount };
      });

      console.log(
        `로그인 상태 분석: 로그인됨(${loginIndicators.loggedInCount}) vs 안됨(${loginIndicators.notLoggedInCount})`
      );

      // 로그인 상태 판단
      if (
        loginIndicators.loggedInCount > 0 &&
        loginIndicators.notLoggedInCount === 0
      ) {
        console.log("✅ 로그인 상태 확인됨");
        return true;
      } else if (loginIndicators.notLoggedInCount > 0) {
        console.log("❌ 비로그인 상태 확인됨");
        return false;
      } else {
        // 확실하지 않은 경우 추가 확인
        console.log("🤔 로그인 상태 불분명 - 추가 확인 중...");
        return await this.deepCheckLoginStatus(page);
      }
    } catch (error) {
      console.error("⚠️ 로그인 상태 확인 실패:", error);
      return false;
    }
  }

  /**
   * 정밀한 로그인 상태 확인
   */
  private async deepCheckLoginStatus(page: Page): Promise<boolean> {
    try {
      console.log("🔬 정밀한 로그인 상태 확인...");

      // 쿠키 확인
      console.log("🍪 쿠키 기반 로그인 상태 확인...");
      const cookies = await page.context().cookies();
      const naverAuthCookies = cookies.filter(
        (cookie) =>
          (cookie.name.includes("NID_AUT") ||
            cookie.name.includes("NID_SES") ||
            cookie.name.includes("nid_inf")) &&
          cookie.domain.includes(".naver.com")
      );

      if (naverAuthCookies.length > 0) {
        console.log("✅ 인증 쿠키 발견 - 로그인 상태 추정");
        console.log(
          `발견된 쿠키: ${naverAuthCookies.map((c) => c.name).join(", ")}`
        );
        return true;
      }

      console.log("❌ 인증 쿠키 없음 - 비로그인 상태 추정");
      return false;
    } catch (error) {
      console.error("정밀한 로그인 상태 확인 실패:", error);
      return false;
    }
  }

  /**
   * 로그인 버튼 찾기 및 클릭
   */
  private async findAndClickLoginButton(page: Page): Promise<void> {
    const loginSelectors = [
      'a[class*="link_login"]',
      'a[href*="nidlogin"]',
      'a:has-text("로그인")',
      ".gnb_login_wrap a",
      "#gnb_login_button",
    ];

    let loginClicked = false;

    for (const selector of loginSelectors) {
      try {
        const element = page.locator(selector).first();
        const count = await element.count();

        console.log(`로그인 선택자 시도: ${selector} (개수: ${count})`);

        if (count > 0 && (await element.isVisible({ timeout: 3000 }))) {
          console.log(`✅ 로그인 버튼 발견: ${selector}`);

          await element.hover();
          await this.browserService.randomWait(500, 1000);
          await element.click();

          loginClicked = true;
          break;
        }
      } catch (error) {
        console.log(`${selector} 시도 실패:`, error.message);
        continue;
      }
    }

    if (!loginClicked) {
      await page.screenshot({ path: "login-button-not-found.png" });
      throw new Error("로그인 버튼을 찾을 수 없습니다");
    }
  }

  /**
   * 로그인 폼 작성
   */
  private async fillLoginForm(page: Page): Promise<void> {
    console.log("📝 로그인 폼 작성 중...");

    await page.waitForSelector('input[name="id"]', { timeout: 15000 });
    await this.browserService.randomWait(2000, 4000);

    console.log("📝 아이디 입력 중...");
    await this.humanTypeInField(page, 'input[name="id"]', env.NAVER_LOGIN_ID);

    await this.navigateToPasswordField(page);

    console.log("🔒 비밀번호 입력 중...");
    await this.humanTypePassword(page, env.NAVER_LOGIN_PASSWORD);

    await this.browserService.randomWait(1000, 2000);

    await this.submitLogin(page);
  }

  /**
   * 사람처럼 타이핑하기
   */
  private async humanTypeInField(
    page: Page,
    selector: string,
    text: string
  ): Promise<void> {
    const field = page.locator(selector);

    await field.click();
    await this.browserService.randomWait(300, 700);

    await field.clear();
    await this.browserService.randomWait(200, 400);

    for (let i = 0; i < text.length; i++) {
      const char = text[i];

      // 5% 확률로 오타 발생
      if (Math.random() < 0.05 && i > 0) {
        const wrongChar = String.fromCharCode(
          97 + Math.floor(Math.random() * 26)
        );
        await page.keyboard.type(wrongChar, {
          delay: 80 + Math.random() * 100,
        });

        await this.browserService.randomWait(300, 600);
        await page.keyboard.press("Backspace");
        await this.browserService.randomWait(100, 300);
      }

      await page.keyboard.type(char, {
        delay: 60 + Math.random() * 140,
      });

      if (Math.random() < 0.15) {
        await this.browserService.randomWait(200, 800);
      }
    }
  }

  /**
   * 비밀번호 필드로 탭 이동
   */
  private async navigateToPasswordField(page: Page): Promise<void> {
    console.log("⭐ 비밀번호 필드로 이동...");

    await page.keyboard.press("Tab");
    await this.browserService.randomWait(300, 600);

    await page.keyboard.press("Tab");
    await this.browserService.randomWait(400, 800);

    const focusedElement = await page.evaluate(() => {
      const element = document.activeElement;
      return {
        tagName: element?.tagName,
        type: (element as HTMLInputElement)?.type,
        name: element?.getAttribute("name"),
        id: element?.id,
      };
    });

    console.log("현재 포커스된 요소:", focusedElement);
  }

  /**
   * 비밀번호 입력
   */
  private async humanTypePassword(page: Page, password: string): Promise<void> {
    for (const char of password) {
      await page.keyboard.type(char, {
        delay: 80 + Math.random() * 160,
      });

      if (Math.random() < 0.1) {
        await this.browserService.randomWait(300, 700);
      }
    }
  }

  /**
   * 로그인 제출
   */
  private async submitLogin(page: Page): Promise<void> {
    console.log("🚀 로그인 제출...");

    if (Math.random() > 0.3) {
      await page.keyboard.press("Enter");
    } else {
      try {
        const submitButton = page
          .locator('button[type="submit"], input[type="submit"]')
          .first();
        await submitButton.hover();
        await this.browserService.randomWait(200, 500);
        await submitButton.click();
      } catch {
        await page.keyboard.press("Enter");
      }
    }
  }

  /**
   * 로그인 완료 대기
   */
  private async waitForLoginCompletion(page: Page): Promise<void> {
    console.log("⏰ 로그인 완료 대기 중...");

    try {
      await page.waitForLoadState("networkidle", { timeout: 20000 });
      await this.browserService.randomWait(3000, 6000);
      console.log("✅ 로그인 완료");
    } catch (error) {
      console.error("로그인 완료 대기 실패:", error);

      const currentUrl = page.url();
      console.log("현재 URL:", currentUrl);

      const needsVerification = await this.checkForAdditionalVerification(page);
      if (needsVerification) {
        throw new Error("추가 인증이 필요합니다");
      }
    }
  }

  /**
   * 추가 인증 확인
   */
  private async checkForAdditionalVerification(page: Page): Promise<boolean> {
    const verificationSelectors = [
      '[class*="captcha"]',
      '[class*="verification"]',
      'input[name="captcha"]',
      ".phone_verify",
      ".email_verify",
    ];

    for (const selector of verificationSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`추가 인증 감지: ${selector}`);
        return true;
      }
    }

    return false;
  }

  /**
   * 3단계: 네이버 메인으로 복귀
   */
  private async returnToNaverMain(page: Page): Promise<void> {
    console.log("🏠 네이버 메인으로 복귀...");

    await this.browserService.safeNaverGoto(page, "https://www.naver.com", {
      referer: page.url(),
      simulateHuman: true,
    });

    await this.browserService.randomWait(4000, 7000);
  }

  private normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);

      // 네이버 특화: 필수 파라미터만 유지
      const essentialParams = ["site_preference", "NaPm"];
      const newSearchParams = new URLSearchParams();

      essentialParams.forEach((param) => {
        if (urlObj.searchParams.has(param)) {
          newSearchParams.set(param, urlObj.searchParams.get(param)!);
        }
      });

      urlObj.search = newSearchParams.toString();
      urlObj.pathname = urlObj.pathname.replace(/\/$/, "");

      return urlObj.toString();
    } catch {
      return url.split("?")[0].replace(/\/$/, "");
    }
  }

  private extractProductId(url: string): string | null {
    const patterns = [
      /\/products\/(\d+)/,
      /\/product\/(\d+)/,
      /productId=(\d+)/,
      /item_id=(\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * 상품 페이지 비교
   * @param targetUrl
   * @param currentUrl
   * @returns
   */
  private isSameProductPage(targetUrl: string, currentUrl: string): boolean {
    console.log(`🔍 URL 비교 - Target: ${targetUrl.substring(0, 100)}...`);
    console.log(`🔍 URL 비교 - Current: ${currentUrl.substring(0, 100)}...`);

    // 1. 정규화된 URL 비교
    const normalizedTarget = this.normalizeUrl(targetUrl);
    const normalizedCurrent = this.normalizeUrl(currentUrl);

    if (normalizedTarget === normalizedCurrent) {
      console.log("✅ 정규화된 URL 완전 일치");
      return true;
    }

    // 2. 상품 ID 비교
    const targetProductId = this.extractProductId(targetUrl);
    const currentProductId = this.extractProductId(currentUrl);

    if (
      targetProductId &&
      currentProductId &&
      targetProductId === currentProductId
    ) {
      console.log(`✅ 상품 ID 일치: ${targetProductId}`);
      return true;
    }

    // 3. 도메인과 기본 경로 비교
    try {
      const targetObj = new URL(targetUrl);
      const currentObj = new URL(currentUrl);

      if (
        targetObj.hostname === currentObj.hostname &&
        targetObj.pathname === currentObj.pathname
      ) {
        console.log("✅ 도메인과 경로 일치");
        return true;
      }
    } catch (error) {
      console.log("⚠️ URL 파싱 실패:", error.message);
    }

    // 4. 기존 로직 (fallback)
    const targetPath = targetUrl.split("?")[0].split("/").pop();
    if (targetPath && currentUrl.includes(targetPath)) {
      console.log(`✅ 경로 마지막 부분 일치: ${targetPath}`);
      return true;
    }

    console.log("❌ URL 불일치");
    return false;
  }

  /**
   * 상품 페이지 내용 검증
   */
  private async validateProductPageContent(page: Page): Promise<void> {
    try {
      console.log("🔍 페이지 내용 검증 중...");

      // 상품 페이지 특유의 요소들 확인
      const productIndicators = [
        '[class*="product"]',
        '[class*="item"]',
        '[class*="goods"]',
        'button[class*="cart"]',
        'button[class*="buy"]',
        '[class*="price"]',
        '[class*="review"]',
      ];

      let foundIndicators = 0;
      for (const selector of productIndicators) {
        try {
          const element = await page.$(selector);
          if (element) {
            foundIndicators++;
            if (foundIndicators >= 2) break; // 2개 이상 찾으면 충분
          }
        } catch {
          // 개별 셀렉터 실패는 무시
        }
      }

      if (foundIndicators >= 2) {
        console.log(
          `✅ 상품 페이지 내용 검증 성공 (${foundIndicators}개 요소 확인)`
        );
      } else {
        console.log(
          `⚠️ 상품 페이지 내용 검증 실패 (${foundIndicators}개 요소만 확인)`
        );
      }
    } catch (error) {
      console.log("⚠️ 페이지 내용 검증 중 오류:", error.message);
    }
  }

  /**
   * 5단계: 상품 페이지 접근 (429 에러 대응)
   */
  private async accessProductPage(
    page: Page,
    productUrl: string
  ): Promise<void> {
    console.log("🎯 상품 페이지로 이동...");

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`시도 ${attempts}/${maxAttempts}`);

        if (attempts > 1) {
          const waitTime = Math.pow(2, attempts) * 10000;
          console.log(`⏰ ${waitTime / 1000}초 대기 (429 에러 대응)...`);
          await this.browserService.randomWait(waitTime, waitTime + 10000);
        }

        await this.browserService.safeNaverGoto(page, productUrl, {
          referer: page.url(),
          simulateHuman: true,
        });

        const currentUrl = page.url();
        console.log(`📍 Current URL: ${currentUrl}`);

        // 개선된 URL 비교 사용
        if (this.isSameProductPage(productUrl, currentUrl)) {
          console.log("✅ 상품 페이지 접근 성공");

          // 추가 안전 장치: 페이지 내용 검증
          await this.validateProductPageContent(page);
          break;
        }

        throw new Error(`페이지 접근 실패: ${currentUrl}`);
      } catch (error) {
        console.error(`❌ 시도 ${attempts} 실패:`, error.message);

        if (attempts === maxAttempts) {
          throw new Error(
            `상품 페이지 접근 실패 (${maxAttempts}회 시도 후): ${error.message}`
          );
        }

        if (
          error.message.includes("429") ||
          error.message.includes("Too Many Requests")
        ) {
          console.log("🚫 429 에러 감지 - 추가 대응 조치 실행");
          await this.handle429Error(page, attempts);
        }
      }
    }

    await this.browserService.randomWait(5000, 10000);
  }

  /**
   * 429 에러 전용 처리
   */
  private async handle429Error(page: Page, attempt: number): Promise<void> {
    console.log("🔧 429 에러 처리 시작...");

    try {
      const baseWait = 60000;
      const additionalWait = attempt * 30000;
      const totalWait = baseWait + additionalWait + Math.random() * 30000;

      console.log(
        `⏰ 429 에러 대응: ${Math.round(totalWait / 1000)}초 대기...`
      );
      await new Promise((resolve) => setTimeout(resolve, totalWait));

      if (attempt >= 2) {
        console.log("🔄 브라우저 재시작 (IP 변경 시뮬레이션)...");
        await this.restartBrowserSession(page);
      }

      console.log("🏠 네이버 메인으로 복귀하여 자연스러운 활동...");
      await this.browserService.safeNaverGoto(page, "https://www.naver.com");

      await this.simulateNaturalUserActivity(page);

      console.log("✅ 429 에러 처리 완료");
    } catch (error) {
      console.error("❌ 429 에러 처리 실패:", error);
    }
  }

  /**
   * 브라우저 세션 재시작
   */
  private async restartBrowserSession(page: Page): Promise<void> {
    try {
      console.log("🔄 브라우저 세션 재시작 중...");

      await page.close();
      await this.browserService.close();
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const newPage = await this.browserService.createStealthPage();
      await this.naturalNaverAccess(newPage);

      console.log("✅ 브라우저 세션 재시작 완료");
    } catch (error) {
      console.error("❌ 브라우저 세션 재시작 실패:", error);
    }
  }

  /**
   * 자연스러운 사용자 활동 시뮬레이션
   */
  private async simulateNaturalUserActivity(page: Page): Promise<void> {
    console.log("👤 자연스러운 사용자 활동 시뮬레이션...");

    try {
      const newsTab = page.locator('a[href*="news"]').first();
      if (await newsTab.isVisible({ timeout: 3000 })) {
        await newsTab.hover();
        await this.browserService.randomWait(1000, 2000);
        await newsTab.click();
        await page.waitForLoadState("networkidle");
        await this.browserService.randomWait(3000, 6000);

        await page.evaluate(() => window.scrollBy(0, 300));
        await this.browserService.randomWait(2000, 4000);
      }

      await page.goBack();
      await page.waitForLoadState("networkidle");
      await this.browserService.randomWait(2000, 4000);

      const searchBox = page
        .locator('input[name="query"], .search_input')
        .first();
      if (await searchBox.isVisible({ timeout: 3000 })) {
        await searchBox.click();
        await this.browserService.randomWait(500, 1000);

        const randomKeywords = ["날씨", "뉴스", "쇼핑", "영화", "음식"];
        const keyword =
          randomKeywords[Math.floor(Math.random() * randomKeywords.length)];

        await searchBox.type(keyword, { delay: 100 + Math.random() * 200 });
        await this.browserService.randomWait(1000, 2000);

        await searchBox.clear();
        await this.browserService.randomWait(500, 1000);
      }

      await this.browserService.simulateNaverHumanBehavior(page, {
        scroll: true,
        mouseMove: true,
        randomWait: true,
      });

      console.log("✅ 자연스러운 활동 시뮬레이션 완료");
    } catch (error) {
      console.error("⚠️ 자연스러운 활동 시뮬레이션 부분 실패:", error);
    }
  }

  private async waitUntilBotCheckResolved(
    page: Page,
    selector: string
  ): Promise<void> {
    const maxWaitTime = 10 * 60 * 1000; // 10분 최대 대기
    const checkInterval = 5000; // 5초마다 체크
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible({ timeout: 1000 });

        if (!isVisible) {
          console.log("✅ 봇 체크가 해결된 것 같습니다.");
          return;
        }

        console.log(
          `⏳ 봇 체크 해결 대기 중... (${Math.floor((Date.now() - startTime) / 1000)}초 경과)`
        );
        await this.browserService.randomWait(
          checkInterval - 1000,
          checkInterval + 1000
        );
      } catch (error) {
        // 요소가 없어지면 해결된 것으로 간주
        console.log("✅ 봇 체크 요소가 사라졌습니다.");
        return;
      }
    }

    throw new Error("봇 체크 해결 대기 시간이 초과되었습니다.");
  }

  /**
   * 봇 체크 처리
   */
  private async handleBotCheck(page: Page): Promise<void> {
    console.log("🤖 봇 체크 확인 중...");

    try {
      const botCheckSelectors = [
        ".captcha_img",
        ".verify_img",
        '[alt*="보안문자"]',
        ".bot_check",
        ".human_verify",
        '[class*="captcha"]',
      ];

      for (const selector of botCheckSelectors) {
        const element = page.locator(selector).first();
        const count = await element.count();

        if (count > 0 && (await element.isVisible({ timeout: 2000 }))) {
          console.log(`🚫 봇 체크 감지됨: ${selector}`);

          await page.screenshot({
            path: `bot-check-${Date.now()}.png`,
            fullPage: true,
          });

          console.log("⏸️  봇 체크가 감지되었습니다. 수동으로 처리해주세요.");

          // 봇 체크가 해결될 때까지 대기
          await this.waitUntilBotCheckResolved(page, selector);

          console.log("▶️  봇 체크 해결됨. 크롤링을 재개합니다.");

          break;
        }
      }

      console.log("✅ 봇 체크 통과");
    } catch (error) {
      console.log("⚠️ 봇 체크 처리 중 오류:", error.message);
    }
  }

  /**
   * 리뷰 탭으로 이동
   */
  private async navigateToReviews(page: Page): Promise<void> {
    console.log("📝 리뷰 탭으로 이동...");

    try {
      const reviewSelectors = ['[data-name="REVIEW"]'];
      let reviewClicked = false;

      for (const selector of reviewSelectors) {
        try {
          const element = page.locator(selector).first();
          const count = await element.count();

          if (count > 0 && (await element.isVisible({ timeout: 5000 }))) {
            console.log(`리뷰 탭 발견: ${selector}`);

            await element.scrollIntoViewIfNeeded();
            await this.browserService.randomWait(500, 1000);

            await element.hover();
            await this.browserService.randomWait(300, 600);
            await element.click();

            reviewClicked = true;
            break;
          }
        } catch (error) {
          console.log(`${selector} 시도 실패:`, error.message);
          continue;
        }
      }

      if (reviewClicked) {
        await page.waitForLoadState("networkidle");
        await this.browserService.randomWait(2000, 4000);
        console.log("✅ 리뷰 탭 이동 성공");
      } else {
        console.log(
          "⚠️ 리뷰 탭을 찾을 수 없음 - 현재 페이지에서 리뷰 수집 시도"
        );
      }
    } catch (error) {
      console.log("⚠️ 리뷰 탭 이동 실패:", error.message);
    }
  }

  /**
   * 중복 리뷰 제거
   */
  private deduplicateReviews(reviews: Review[]): Review[] {
    const seen = new Set<string>();
    const uniqueReviews: Review[] = [];

    for (const review of reviews) {
      // 리뷰 ID나 내용으로 중복 체크
      const identifier =
        review.id || `${review.author}_${review.content}_${review.date}`;

      if (!seen.has(identifier)) {
        seen.add(identifier);
        uniqueReviews.push(review);
      }
    }

    if (reviews.length !== uniqueReviews.length) {
      console.log(
        `🔄 중복 제거: ${reviews.length}개 → ${uniqueReviews.length}개`
      );
    }

    return uniqueReviews;
  }

  /**
   * 개선된 리뷰 수집 - 마지막 페이지까지 자동 크롤링
   */
  private async collectAllReviews(
    page: Page,
    sort: "ranking" | "latest" | "row-rating" | "high-rating",
    maxPages: number
  ): Promise<Review[]> {
    console.log(`📚 전체 리뷰 수집 시작 (최대 ${maxPages}페이지)...`);

    // 1. 총 리뷰 수와 예상 페이지 수 확인
    const totalInfo = await this.getTotalReviewInfo(page);
    const actualMaxPages = Math.min(maxPages, totalInfo.estimatedPages);

    console.log(`📊 총 리뷰 수: ${totalInfo.totalReviews}개`);
    console.log(`📄 예상 페이지 수: ${totalInfo.estimatedPages}페이지`);
    console.log(`🎯 크롤링 대상: ${actualMaxPages}페이지`);

    const reviews: Review[] = [];
    let currentPage = 1;
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 3;
    let lastReviewCount = 0;

    // 2. 정렬 설정
    if (sort !== "ranking") {
      await this.setSortOrder(page, sort);
    }

    // 3. 페이지별 리뷰 수집
    while (currentPage <= actualMaxPages) {
      console.log(`\n📄 ${currentPage}/${actualMaxPages} 페이지 수집 중...`);

      try {
        // 페이지 로딩 대기
        await page.waitForLoadState("networkidle", { timeout: 15000 });
        await this.browserService.randomWait(2000, 4000);

        // 봇 체크 확인
        await this.handleBotCheck(page);

        // 리뷰 요소가 로딩될 때까지 대기
        await this.waitForReviewsToLoad(page);

        // 현재 페이지에서 리뷰 추출
        const pageReviews = await this.extractReviewsFromPage(page);

        if (pageReviews.length === 0) {
          consecutiveFailures++;
          console.log(
            `❌ ${currentPage}페이지에서 리뷰를 찾을 수 없음 (연속 실패: ${consecutiveFailures})`
          );

          // 연속으로 실패하면 마지막 페이지 도달로 판단
          if (consecutiveFailures >= maxConsecutiveFailures) {
            console.log(
              `📄 연속 ${maxConsecutiveFailures}번 실패 - 마지막 페이지 도달로 판단`
            );
            break;
          }
        } else {
          consecutiveFailures = 0; // 성공 시 실패 카운터 리셋

          // 중복 제거하여 추가
          const newReviews = this.filterNewReviews(pageReviews, reviews);
          reviews.push(...newReviews);

          console.log(
            `📝 ${currentPage}페이지: ${pageReviews.length}개 수집, ${newReviews.length}개 신규 (총 ${reviews.length}개)`
          );

          // 진행률 표시
          const progress = (reviews.length / totalInfo.totalReviews) * 100;
          console.log(`📊 진행률: ${Math.min(progress, 100).toFixed(1)}%`);

          // 같은 리뷰 수가 연속으로 나오면 마지막 페이지 가능성
          if (reviews.length === lastReviewCount) {
            console.log("⚠️ 리뷰 수가 증가하지 않음 - 마지막 페이지 가능성");
          }
          lastReviewCount = reviews.length;
        }

        // 다음 페이지 이동 시도
        if (currentPage < actualMaxPages) {
          const hasNextPage = await this.goToNextPageImproved(
            page,
            currentPage
          );

          if (!hasNextPage) {
            console.log("📄 마지막 페이지 도달 - 수집 완료");
            break;
          }

          currentPage++;

          // 페이지 이동 후 안정화 대기
          await this.browserService.randomWait(3000, 6000);

          // 실제 페이지 번호 검증
          const actualPageNumber = await this.getCurrentPageNumber(page);
          if (actualPageNumber !== currentPage && actualPageNumber > 0) {
            console.log(
              `🔄 페이지 번호 조정: ${currentPage} → ${actualPageNumber}`
            );
            currentPage = actualPageNumber;
          }
        } else {
          console.log("📄 설정된 최대 페이지에 도달");
          break;
        }
      } catch (error) {
        consecutiveFailures++;
        console.error(
          `❌ ${currentPage}페이지 수집 실패 (연속 실패: ${consecutiveFailures}):`,
          error.message
        );

        if (consecutiveFailures >= maxConsecutiveFailures) {
          console.log(`❌ 연속 ${maxConsecutiveFailures}번 실패로 수집 종료`);
          break;
        }

        // 에러 복구 시도
        await this.recoverFromPageError(page, currentPage);
      }
    }

    console.log(
      `\n✅ 총 ${reviews.length}개 리뷰 수집 완료 (${currentPage - 1}페이지 처리)`
    );
    return this.deduplicateReviews(reviews);
  }

  /**
   * 총 리뷰 수와 예상 페이지 수 확인
   */
  private async getTotalReviewInfo(
    page: Page
  ): Promise<{ totalReviews: number; estimatedPages: number }> {
    try {
      const info = await page.evaluate(() => {
        // 총 리뷰 수 찾기
        const reviewCountSelectors = [
          '[data-shp-area="sub.reviewmore"] strong',
        ];

        let totalReviews = 0;

        for (const selector of reviewCountSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            const text = element.textContent.replaceAll(",", "") || "";
            const match = text.match(/(\d+)/);
            if (match) {
              totalReviews = parseInt(match[1]);
              console.log(
                `총 리뷰 수 발견: ${totalReviews} (선택자: ${selector})`
              );
              break;
            }
          }
        }

        // 리뷰 수 기반 예상 페이지 계산 (페이지당 보통 20개)
        const estimatedPages = Math.ceil(totalReviews / 20);

        return { totalReviews, estimatedPages };
      });

      return info;
    } catch (error) {
      console.log("총 리뷰 정보 확인 실패:", error.message);
      return { totalReviews: 0, estimatedPages: 999 }; // 기본값
    }
  }

  /**
   * 정렬 순서 설정
   */
  private async setSortOrder(
    page: Page,
    sort: "latest" | "row-rating" | "high-rating"
  ): Promise<void> {
    try {
      console.log(`🔄 정렬 변경: ${sort}`);

      const sortMap = {
        latest: "최신순",
        "row-rating": "평점 낮은순",
        "high-rating": "평점 높은순",
      };

      const sortButton = page.locator(
        `[data-shp-area="revlist.sort"][data-shp-contents-id="${sortMap[sort]}"]`
      );

      if (await sortButton.isVisible({ timeout: 5000 })) {
        await sortButton.click();
        await page.waitForLoadState("networkidle", { timeout: 10000 });
        await this.browserService.randomWait(2000, 4000);
        console.log(`✅ 정렬 변경 완료: ${sortMap[sort]}`);
      } else {
        console.log("⚠️ 정렬 버튼을 찾을 수 없음");
      }
    } catch (error) {
      console.log("정렬 설정 실패:", error.message);
    }
  }

  /**
   * 신규 리뷰만 필터링 (중복 제거)
   */
  private filterNewReviews(
    pageReviews: Review[],
    existingReviews: Review[]
  ): Review[] {
    if (existingReviews.length === 0) return pageReviews;

    const existingIds = new Set(existingReviews.map((r) => r.id));
    const existingSignatures = new Set(
      existingReviews.map(
        (r) => `${r.author}_${r.content.substring(0, 50)}_${r.date}`
      )
    );

    return pageReviews.filter((review) => {
      const signature = `${review.author}_${review.content.substring(0, 50)}_${review.date}`;
      return !existingIds.has(review.id) && !existingSignatures.has(signature);
    });
  }

  /**
   * 개선된 다음 페이지 이동
   */
  private async goToNextPageImproved(
    page: Page,
    currentPage: number
  ): Promise<boolean> {
    try {
      console.log("📄 다음 페이지 이동 시도...");

      const nextPageNumber = currentPage + 1;

      // 1. 직접 페이지 번호 클릭 시도
      const pageNumberButton = page.locator(
        `a[data-shp-area='revlist.pgn'][data-shp-contents-id='${nextPageNumber}'])`
      );

      if (await pageNumberButton.isVisible({ timeout: 3000 })) {
        const isDisabled = await this.isButtonDisabled(pageNumberButton);
        if (!isDisabled) {
          console.log(`🔢 ${nextPageNumber}페이지 버튼 클릭`);
          await this.clickElementSafely(page, pageNumberButton);
          return await this.verifyPageChange(page, currentPage);
        }
      }

      // 2. "다음" 버튼 시도
      const nextButton = page.locator(
        'a[data-shp-area="revlist.pgn"]:has-text("다음")'
      );
      if (await nextButton.isVisible({ timeout: 3000 })) {
        const isDisabled = await this.isButtonDisabled(nextButton);
        if (!isDisabled) {
          console.log("▶️ 다음 버튼 클릭");
          await this.clickElementSafely(page, nextButton);
          return await this.verifyPageChange(page, currentPage);
        } else {
          console.log("📄 다음 버튼이 비활성화됨 - 마지막 페이지");
          return false;
        }
      }

      // 3. 페이지네이션에서 현재보다 큰 번호 찾기
      const allPageButtons = page.locator(
        'a[data-shp-area="revlist.pgn"][data-shp-contents-id]'
      );
      const count = await allPageButtons.count();

      for (let i = 0; i < count; i++) {
        const button = allPageButtons.nth(i);
        const text = await button.textContent();

        if (text && /^\d+$/.test(text.trim())) {
          const pageNum = parseInt(text.trim());

          if (pageNum === nextPageNumber) {
            const isDisabled = await this.isButtonDisabled(button);
            if (!isDisabled) {
              console.log(`🎯 페이지 ${pageNum} 버튼 발견 및 클릭`);
              await this.clickElementSafely(page, button);
              return await this.verifyPageChange(page, currentPage);
            }
          }
        }
      }

      console.log("📄 다음 페이지 버튼을 찾을 수 없음 - 마지막 페이지 가능성");
      return false;
    } catch (error) {
      console.error("다음 페이지 이동 실패:", error.message);
      return false;
    }
  }

  /**
   * 안전한 요소 클릭
   */
  private async clickElementSafely(page: Page, element: any): Promise<void> {
    try {
      await element.scrollIntoViewIfNeeded();
      await this.browserService.randomWait(500, 1000);

      await element.hover();
      await this.browserService.randomWait(300, 600);

      await element.click();
      await page.waitForLoadState("networkidle", { timeout: 15000 });
    } catch (error) {
      console.log("요소 클릭 실패:", error.message);
      throw error;
    }
  }

  /**
   * 페이지 변경 검증
   */
  private async verifyPageChange(
    page: Page,
    previousPage: number
  ): Promise<boolean> {
    try {
      // 페이지 로딩 대기
      await this.browserService.randomWait(2000, 4000);

      // 새로운 페이지 번호 확인
      const newPageNumber = await this.getCurrentPageNumber(page);

      if (newPageNumber > previousPage) {
        console.log(`✅ 페이지 이동 성공: ${previousPage} → ${newPageNumber}`);
        return true;
      } else {
        console.log(
          `❌ 페이지 번호 변경 없음: ${previousPage} → ${newPageNumber}`
        );
        return false;
      }
    } catch (error) {
      console.log("페이지 변경 검증 실패:", error.message);
      return false;
    }
  }

  /**
   * 페이지 에러 복구
   */
  private async recoverFromPageError(
    page: Page,
    currentPage: number
  ): Promise<void> {
    try {
      console.log(`🔧 ${currentPage}페이지 에러 복구 시도...`);

      // 페이지 새로고침
      await page.reload({ waitUntil: "networkidle", timeout: 15000 });
      await this.browserService.randomWait(3000, 5000);

      // 리뷰 탭으로 다시 이동
      await this.navigateToReviews(page);

      // 해당 페이지로 직접 이동 시도
      if (currentPage > 1) {
        await this.goToSpecificPage(page, currentPage);
      }

      console.log("✅ 페이지 에러 복구 완료");
    } catch (error) {
      console.error("페이지 에러 복구 실패:", error.message);
    }
  }

  // 리뷰 요소 로딩 대기
  private async waitForReviewsToLoad(page: Page): Promise<void> {
    try {
      // 리뷰 목록이 나타날 때까지 대기
      await page.waitForSelector(
        '.PxsZltB5tV, .review-item, [data-shp-contents-type="review"]',
        {
          timeout: 10000,
        }
      );

      // 추가로 리뷰 내용이 완전히 로딩될 때까지 짧게 대기
      await this.browserService.randomWait(1000, 2000);
    } catch (error) {
      console.log("⚠️ 리뷰 요소 대기 실패:", error.message);
      // 실패해도 계속 진행
    }
  }
  /**
   * 페이지에서 리뷰 추출
   */
  private async extractReviewsFromPage(page: Page): Promise<Review[]> {
    try {
      const reviews = await page.evaluate(() => {
        // 🎯 안정적인 선택자들 (클래스 의존성 최소화)
        const reviewSelectors = [
          // 1순위: data 속성 (가장 안정적)
          "li[data-shp-area='revlist.review']",
          "li[data-shp-contents-type='review']",
          "li[data-shp-area*='review']",

          // 2순위: 구조적 접근 (#REVIEW는 고정적)
          "#REVIEW ul li",
          "#REVIEW li",

          // 3순위: 백업
          "ul li[data-shp-contents-id]", // 리뷰에만 있는 속성
          "li[data-shp-page-key]", // 페이지 키 속성
        ];

        let reviewElements: Element[] = [];
        let usedSelector = "";

        for (const selector of reviewSelectors) {
          try {
            const elements = Array.from(document.querySelectorAll(selector));

            if (elements.length > 0) {
              console.log(
                `✅ 리뷰 후보 발견: ${selector} (${elements.length}개)`
              );

              // 🔍 실제 리뷰인지 구조적 검증 (클래스에 의존하지 않음)
              const validReviews = elements.filter((element) => {
                // 필수: 리뷰 ID 속성
                const hasReviewId = element.getAttribute(
                  "data-shp-contents-id"
                );

                // 필수: 기본적인 리뷰 구조 (strong, em, span 등)
                const hasAuthor = element.querySelector("strong");
                const hasRating = element.querySelector("em");
                const hasContent = element.querySelector("span");

                // 텍스트 길이 체크 (너무 짧으면 리뷰가 아닐 가능성)
                const textLength = (element.textContent || "").trim().length;

                return (
                  hasReviewId &&
                  (hasAuthor || hasRating) &&
                  hasContent &&
                  textLength > 20
                );
              });

              if (validReviews.length > 0) {
                reviewElements = validReviews;
                usedSelector = selector;
                console.log(`🎯 검증된 리뷰: ${validReviews.length}개`);
                break;
              }
            }
          } catch (error) {
            console.log(`⚠️ 선택자 "${selector}" 실행 실패`);
            continue;
          }
        }

        if (reviewElements.length === 0) {
          console.log("❌ 리뷰 요소를 찾을 수 없음");
          return [];
        }

        console.log(`🎉 사용 선택자: "${usedSelector}"`);

        // 🔧 리뷰 데이터 추출 (클래스에 의존하지 않는 방식)
        return reviewElements
          .map((element, index) => {
            try {
              // 📌 1. 리뷰 ID (data 속성은 안정적)
              const reviewId =
                element.getAttribute("data-shp-contents-id") ||
                `review_${Date.now()}_${index}`;

              // 📌 2. 작성자명 추출 (구조적 접근)
              let author = "";

              // 방법 1: strong 태그에서 찾기 (가장 일반적)
              const strongEls = element.querySelectorAll("strong");
              for (const strongEl of strongEls) {
                const text = strongEl.textContent?.trim() || "";
                // 작성자명 패턴: 보통 *로 마스킹됨
                if (
                  text.length > 0 &&
                  (text.includes("*") || text.length < 20)
                ) {
                  author = text;
                  break;
                }
              }

              // 방법 2: 작성자명이 없으면 첫 번째 strong 사용
              if (!author && strongEls.length > 0) {
                author = strongEls[0].textContent?.trim() || "";
              }

              // 📌 3. 평점 추출 (em 태그에서)
              let rating = 0;
              const emEls = element.querySelectorAll("em");
              for (const emEl of emEls) {
                const text = emEl.textContent?.trim() || "";
                const ratingMatch = text.match(/^(\d+(?:\.\d+)?)$/); // 순수 숫자만
                if (ratingMatch) {
                  rating = parseFloat(ratingMatch[1]);
                  if (rating >= 1 && rating <= 5) {
                    // 유효한 평점 범위
                    break;
                  }
                }
              }

              // 📌 4. 리뷰 내용 추출 (가장 긴 텍스트를 리뷰로 판단)
              let content = "";
              const allSpans = element.querySelectorAll("span");
              let longestText = "";

              for (const span of allSpans) {
                const text = span.textContent?.trim() || "";

                // 필터링: 날짜, 버튼 텍스트 등 제외
                const isDatePattern = /^\d{2}\.\d{2}\.\d{2}\.?$/.test(text);
                const isButtonText = [
                  "신고",
                  "도움이 되었나요",
                  "평점",
                  "리뷰",
                ].some((keyword) => text.includes(keyword));
                const isTooShort = text.length < 10;

                if (
                  !isDatePattern &&
                  !isButtonText &&
                  !isTooShort &&
                  text.length > longestText.length
                ) {
                  longestText = text;
                }
              }

              content = longestText;

              // 📌 5. 작성일 추출 (날짜 패턴으로)
              let date = "";
              const allTexts = element.querySelectorAll("*");
              for (const el of allTexts) {
                const text = el.textContent?.trim() || "";
                const dateMatch = text.match(/(\d{2}\.\d{2}\.\d{2}\.?)/);
                if (dateMatch) {
                  date = dateMatch[1];
                  break;
                }
              }

              // 📌 6. 이미지 추출 (img 태그에서)
              const images: string[] = [];
              const imgEls = element.querySelectorAll("img");

              for (const img of imgEls) {
                const src =
                  (img as HTMLImageElement).src ||
                  (img as HTMLImageElement).getAttribute("data-src");

                if (
                  src &&
                  src.includes("http") &&
                  !src.includes("default.png") &&
                  !src.includes("profile-phinf") && // 프로필 이미지 제외
                  (src.includes("checkout.phinf") ||
                    src.includes("review") ||
                    (img as HTMLImageElement).alt?.includes("review"))
                ) {
                  images.push(src);
                }
              }

              // 📌 7. 추가 정보 추출
              let productInfo = "";
              // dl/dt/dd 구조에서 상품명 찾기
              const dlEl = element.querySelector("dl");
              if (dlEl) {
                const parentText = dlEl.parentElement?.textContent || "";
                const lines = parentText
                  .split("\n")
                  .map((line) => line.trim())
                  .filter((line) => line.length > 0);
                if (
                  lines.length > 0 &&
                  !lines[0].includes("유통기한") &&
                  !lines[0].includes("포장")
                ) {
                  productInfo = lines[0];
                }
              }

              // 📌 8. 도움 카운트 (숫자가 포함된 버튼에서)
              let helpfulCount = 0;
              const buttons = element.querySelectorAll("button");
              for (const button of buttons) {
                const countEl = button.querySelector(
                  '.count, [class*="count"]'
                );
                if (countEl) {
                  const count = parseInt(countEl.textContent || "0");
                  if (!isNaN(count)) {
                    helpfulCount = count;
                    break;
                  }
                }
              }

              const review = {
                id: reviewId,
                author: author || `익명_${index + 1}`,
                rating,
                content,
                date,
                verified: true, // 네이버는 구매 확인된 리뷰만
                images: images.length > 0 ? images : undefined,
                productInfo: productInfo || undefined,
                helpfulCount: helpfulCount || undefined,
              };

              // 📊 추출 결과 로깅
              console.log(`✅ 리뷰 ${index + 1}:`, {
                id: reviewId,
                author: author.substring(0, 8) + "...",
                rating,
                contentLength: content.length,
                date,
                imageCount: images.length,
                hasProductInfo: !!productInfo,
              });

              return review;
            } catch (error) {
              console.error(`❌ 리뷰 ${index + 1} 파싱 오류:`, error);
              return null;
            }
          })
          .filter((review) => {
            if (!review) return false;

            // 최종 검증
            const hasValidContent = review.content.length > 5;
            const hasValidAuthor = review.author.length > 0;
            const hasValidRating = review.rating >= 0 && review.rating <= 5;

            if (!hasValidContent)
              console.log(
                `❌ 리뷰 제외: 내용 부족 (${review.content.length}자)`
              );
            if (!hasValidAuthor) console.log(`❌ 리뷰 제외: 작성자 정보 없음`);

            return hasValidContent && hasValidAuthor && hasValidRating;
          });
      });

      console.log(`🎉 최종 추출: ${reviews.length}개 리뷰`);
      return reviews;
    } catch (error) {
      console.error("💥 리뷰 추출 실패:", error);
      return [];
    }
  }

  /**
   * 현재 페이지 번호 추출
   * @param page
   * @returns
   */
  private async getCurrentPageNumber(page: Page): Promise<number> {
    try {
      // aria-current="true"인 요소 우선 확인
      const currentPageElement = page.locator(
        "a[data-shp-area='revlist.pgn'][aria-current='true']"
      );

      if ((await currentPageElement.count()) > 0) {
        const pageText = await currentPageElement.textContent();
        const pageNumber = parseInt(pageText?.trim() || "1");

        if (!isNaN(pageNumber) && pageNumber > 0) {
          console.log(`현재 페이지: ${pageNumber}`);
          return pageNumber;
        }
      }

      // 현재 페이지가 명확하지 않으면 모든 페이지 요소 확인
      const allPageElements = page.locator(
        "a[data-shp-area='revlist.pgn'][data-shp-contents-id]"
      );
      const count = await allPageElements.count();

      for (let i = 0; i < count; i++) {
        const element = allPageElements.nth(i);
        const ariaCurrent = await element.getAttribute("aria-current");

        if (ariaCurrent === "true") {
          const pageText = await element.textContent();
          const pageNumber = parseInt(pageText?.trim() || "1");

          if (!isNaN(pageNumber) && pageNumber > 0) {
            console.log(`현재 페이지 발견: ${pageNumber}`);
            return pageNumber;
          }
        }
      }

      console.log("현재 페이지를 찾을 수 없어 기본값 1 반환");
      return 1;
    } catch (error) {
      console.log("현재 페이지 번호 확인 실패:", error.message);
      return 1;
    }
  }

  // 버튼 비활성화 여부 체크
  private async isButtonDisabled(button: Locator): Promise<boolean> {
    try {
      // disabled 속성 체크
      const isDisabled = await button.isDisabled();
      if (isDisabled) return true;

      // 비활성화 클래스 체크
      const className = await button.getAttribute("class");
      const disabledClasses = ["disabled", "inactive", "off", "jKodyicQKc"];

      if (className) {
        return disabledClasses.some((cls) => className.includes(cls));
      }

      // aria-disabled 체크
      const ariaDisabled = await button.getAttribute("aria-disabled");
      if (ariaDisabled === "true") return true;

      return false;
    } catch (error) {
      return false;
    }
  }
  /**
   * 특정 페이지로 직접 이동
   */
  private async goToSpecificPage(
    page: Page,
    targetPage: number
  ): Promise<boolean> {
    try {
      console.log(`🎯 ${targetPage}페이지로 직접 이동...`);

      const pageButton = page.locator(
        `a[data-shp-area='revlist.pgn'][data-shp-contents-id]:has-text('${targetPage}')`
      );

      if (await pageButton.isVisible({ timeout: 5000 })) {
        await this.clickElementSafely(page, pageButton);

        const actualPage = await this.getCurrentPageNumber(page);
        if (actualPage === targetPage) {
          console.log(`✅ ${targetPage}페이지 이동 성공`);
          return true;
        }
      }

      console.log(`❌ ${targetPage}페이지로 이동 실패`);
      return false;
    } catch (error) {
      console.error(`특정 페이지(${targetPage}) 이동 실패:`, error.message);
      return false;
    }
  }

  /**
   * 상품 정보 추출
   */
  private async extractProductInfo(page: Page): Promise<Partial<Product>> {
    console.log("🔍 상품 정보 추출 중...");

    try {
      const productInfo = await page.evaluate(() => {
        // 상품명 추출을 위한 셀렉터
        const nameElement = document
          .querySelector("#_productFloatingTab img[alt='대표이미지']")
          ?.parentElement?.nextElementSibling?.parentElement?.querySelector(
            "strong"
          );

        const name = nameElement?.textContent?.trim() || "";

        return { name };
      });

      const url = page.url();
      const id =
        url.match(/\/(\d+)/)?.[1] ||
        url.match(/products\/(\d+)/)?.[1] ||
        "unknown";

      const result = {
        id,
        url,
        ...productInfo,
      };

      console.log("✅ 상품 정보 추출 완료:", result);
      return result;
    } catch (error) {
      console.error("상품 정보 추출 실패:", error);

      const url = page.url();
      const id = url.match(/\/(\d+)/)?.[1] || "unknown";

      return {
        id,
        url,
        name: "상품명 추출 실패",
      };
    }
  }

  /**
   * 429 에러 복구 프로세스
   */
  private async recover429Error(page: Page, attempt: number): Promise<void> {
    console.log("🔧 429 에러 복구 프로세스 시작...");

    try {
      const isPageActive = !page.isClosed();
      console.log(`페이지 상태: ${isPageActive ? "활성" : "비활성"}`);

      if (isPageActive) {
        try {
          await this.browserService.safeNaverGoto(
            page,
            "https://www.naver.com",
            {
              retryOn429: false,
            }
          );

          await this.simulateExtendedUserActivity(page, attempt);
        } catch (navError) {
          console.log("네이버 메인 접근 실패 - 브라우저 재시작 필요");
        }
      }

      console.log("✅ 429 에러 복구 프로세스 완료");
    } catch (error) {
      console.error("❌ 429 에러 복구 실패:", error);
    }
  }

  /**
   * 확장된 사용자 활동 시뮬레이션
   */
  private async simulateExtendedUserActivity(
    page: Page,
    attempt: number
  ): Promise<void> {
    console.log("👤 확장된 사용자 활동 시뮬레이션 시작...");

    const activities = [
      () => this.browseNews(page),
      () => this.browseShopping(page),
      () => this.simulateSearch(page),
      () => this.browseWeather(page),
    ];

    const numActivities = Math.min(2 + attempt, activities.length);

    for (let i = 0; i < numActivities; i++) {
      try {
        console.log(`활동 ${i + 1}/${numActivities} 실행 중...`);
        const activity = activities[i % activities.length];
        await activity();

        await this.browserService.randomWait(5000, 15000);
      } catch (activityError) {
        console.log(`활동 ${i + 1} 실패:`, activityError.message);
      }
    }

    console.log("✅ 확장된 사용자 활동 시뮬레이션 완료");
  }

  /**
   * 뉴스 브라우징 시뮬레이션
   */
  private async browseNews(page: Page): Promise<void> {
    console.log("📰 뉴스 브라우징...");

    const newsTab = page.locator('a[href*="news"]').first();
    if (await newsTab.isVisible({ timeout: 3000 })) {
      await newsTab.click();
      await page.waitForLoadState("networkidle");
      await this.browserService.randomWait(3000, 8000);

      await page.evaluate(() => {
        window.scrollBy(0, 200 + Math.random() * 300);
      });
      await this.browserService.randomWait(2000, 5000);

      await page.goBack();
      await page.waitForLoadState("networkidle");
    }
  }

  /**
   * 쇼핑 브라우징 시뮬레이션
   */
  private async browseShopping(page: Page): Promise<void> {
    console.log("🛒 쇼핑 브라우징...");

    const shoppingTab = page.locator('a[href*="shopping"]').first();
    if (await shoppingTab.isVisible({ timeout: 3000 })) {
      await shoppingTab.click();
      await page.waitForLoadState("networkidle");
      await this.browserService.randomWait(3000, 8000);

      await page.evaluate(() => {
        window.scrollBy(0, 150 + Math.random() * 200);
      });
      await this.browserService.randomWait(2000, 5000);

      await page.goBack();
      await page.waitForLoadState("networkidle");
    }
  }

  /**
   * 검색 시뮬레이션
   */
  private async simulateSearch(page: Page): Promise<void> {
    console.log("🔍 검색 시뮬레이션...");

    const searchBox = page
      .locator('input[name="query"], .search_input')
      .first();
    if (await searchBox.isVisible({ timeout: 3000 })) {
      await searchBox.click();
      await this.browserService.randomWait(500, 1000);

      const keywords = [
        "오늘 날씨",
        "맛집 추천",
        "영화 순위",
        "뉴스",
        "건강 정보",
      ];
      const keyword = keywords[Math.floor(Math.random() * keywords.length)];

      for (const char of keyword) {
        await searchBox.type(char, { delay: 100 + Math.random() * 200 });
      }

      await this.browserService.randomWait(1000, 3000);

      await searchBox.clear();
      await this.browserService.randomWait(500, 1000);
    }
  }

  /**
   * 날씨 확인 시뮬레이션
   */
  private async browseWeather(page: Page): Promise<void> {
    console.log("🌤️ 날씨 확인...");

    const weatherElement = page
      .locator('[class*="weather"], a[href*="weather"]')
      .first();
    if (await weatherElement.isVisible({ timeout: 3000 })) {
      await weatherElement.hover();
      await this.browserService.randomWait(1000, 3000);
    }
  }

  /**
   * 재시도 여부 결정
   */
  private shouldRetry(error: Error): boolean {
    const retryableErrors = [
      "timeout",
      "net::ERR_",
      "Navigation timeout",
      "Target closed",
      "429",
      "Too Many Requests",
      "403",
      "Forbidden",
    ];

    return retryableErrors.some((pattern) =>
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * 리소스 정리
   */
  async close(): Promise<void> {
    try {
      console.log("🔄 크롤러 종료 중...");
      await this.browserService.close();
      console.log("✅ 크롤러 정상 종료됨");
    } catch (error) {
      console.error("❌ 크롤러 종료 중 오류:", error);
    }
  }

  /**
   * 헬스 체크
   */
  async healthCheck(): Promise<boolean> {
    try {
      const status = this.browserService.getStatus();
      console.log("🏥 크롤러 상태:", status);
      return status.isActive && !status.isClosing;
    } catch (error) {
      console.error("헬스 체크 실패:", error);
      return false;
    }
  }
}
