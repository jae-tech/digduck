import { Page } from "playwright";
import { AuthenticationCredentials } from "@/automation/types/crawler-types";

export class NaverAuthenticationService {
  private loginAttempts: number = 0;
  private maxLoginAttempts: number = 3;

  constructor(private credentials: AuthenticationCredentials) {}

  async performAuthentication(page: Page): Promise<void> {
    try {
      console.log("🔐 네이버 인증 프로세스 시작...");

      await page.waitForLoadState("networkidle", { timeout: 15000 });
      await this.delay(2000, 4000);

      const isLoggedIn = await this.checkLoginStatus(page);
      if (isLoggedIn) {
        console.log("✅ 이미 로그인되어 있습니다");
        return;
      }

      console.log("📝 로그인 진행...");
      await this.navigateToLogin(page);
      await this.performLogin(page);

      console.log("✅ 네이버 인증 완료");
    } catch (error) {
      console.error("❌ 인증 실패:", error);
      throw error;
    }
  }

  private async checkLoginStatus(page: Page): Promise<boolean> {
    try {
      const currentUrl = page.url();

      if (currentUrl.includes("nid.naver.com")) {
        return false;
      }

      if (!currentUrl.includes("naver.com")) {
        await page.goto("https://www.naver.com", {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
        await this.delay(2000, 4000);
      }

      // 로그인 상태 확인
      const loginChecks = [
        () =>
          page.locator('a:has-text("로그아웃")').isVisible({ timeout: 2000 }),
        () => page.locator(".gnb_logout").isVisible({ timeout: 2000 }),
        () => page.locator(".gnb_usr").isVisible({ timeout: 2000 }),
      ];

      for (const check of loginChecks) {
        try {
          if (await check()) {
            return true;
          }
        } catch {
          continue;
        }
      }

      return false;
    } catch (error) {
      console.error("로그인 상태 확인 오류:", error);
      return false;
    }
  }

  private async navigateToLogin(page: Page): Promise<void> {
    try {
      if (!page.url().includes("naver.com")) {
        await page.goto("https://www.naver.com", {
          waitUntil: "domcontentloaded",
          timeout: 15000,
        });
      }

      const loginSelectors = [
        'a[class*="link_login"]',
        ".link_login",
        'a:has-text("로그인")',
        ".gnb_login",
        '[data-clk="log.login"]',
      ];

      let loginClicked = false;
      for (const selector of loginSelectors) {
        try {
          const loginButton = page.locator(selector).first();
          if (await loginButton.isVisible({ timeout: 3000 })) {
            await loginButton.hover();
            await this.delay(500, 1000);
            await loginButton.click();
            loginClicked = true;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!loginClicked) {
        await page.goto("https://nid.naver.com/nidlogin.login", {
          waitUntil: "domcontentloaded",
        });
      }

      await page.waitForURL(/nid\.naver\.com/, { timeout: 15000 });
      await page.waitForLoadState("networkidle", { timeout: 10000 });
      await this.delay(2000, 4000);

      console.log("로그인 페이지 도착");
    } catch (error) {
      console.error("로그인 페이지 이동 실패:", error);
      throw error;
    }
  }

  private async performLogin(page: Page): Promise<void> {
    this.loginAttempts++;

    if (this.loginAttempts > this.maxLoginAttempts) {
      throw new Error("최대 로그인 시도 횟수 초과");
    }

    // 캡차 확인
    await this.checkCaptcha(page);

    // 로그인 폼 입력
    await this.fillLoginForm(page);

    // 로그인 실행
    await this.submitLogin(page);

    // 결과 확인
    await this.verifyLogin(page);
  }

  private async checkCaptcha(page: Page): Promise<void> {
    const captchaSelectors = [
      "#captcha",
      ".captcha_box",
      'img[alt*="captcha"]',
      '[class*="captcha"]',
      ".captcha_img",
      "#captchaV2",
    ];

    for (const selector of captchaSelectors) {
      if (
        await page
          .locator(selector)
          .isVisible()
          .catch(() => false)
      ) {
        throw new Error("CAPTCHA_DETECTED: 캡차 감지");
      }
    }
  }

  private async fillLoginForm(page: Page): Promise<void> {
    // 아이디 입력
    const idSelectors = [
      'input[name="id"]',
      "#id",
      'input[placeholder*="아이디"]',
    ];

    const idField = await this.findField(page, idSelectors);
    if (!idField) throw new Error("아이디 입력란을 찾을 수 없습니다");

    await this.typeText(page, idField, this.credentials.id);

    // 비밀번호 입력
    const pwSelectors = [
      'input[name="pw"]',
      'input[name="password"]',
      "#pw",
      "#password",
      'input[type="password"]',
      'input[placeholder*="비밀번호"]',
    ];

    const pwField = await this.findField(page, pwSelectors);
    if (!pwField) throw new Error("비밀번호 입력란을 찾을 수 없습니다");

    await this.typeText(page, pwField, this.credentials.password);
  }

  private async findField(
    page: Page,
    selectors: string[],
  ): Promise<string | null> {
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        if (
          (await page.isVisible(selector)) &&
          (await page.isEnabled(selector))
        ) {
          const element = page.locator(selector);
          await element.hover();
          await this.delay(300, 800);
          await element.click();
          await this.delay(200, 600);
          return selector;
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  private async typeText(
    page: Page,
    selector: string,
    text: string,
  ): Promise<void> {
    await page.locator(selector).click();
    await this.delay(600, 1100);

    await page.fill(selector, "");
    await this.delay(50, 150);

    // 실제 데이터 기반 타이핑
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      await page.keyboard.type(char, { delay: 50 });

      // 타이핑 속도 변화 (실제 데이터: 84-369ms)
      let delay;
      if (i < text.length / 3) {
        delay = this.randomBetween(150, 369); // 초반: 천천히
      } else if (i < (text.length * 2) / 3) {
        delay = this.randomBetween(84, 200); // 중반: 빠르게
      } else {
        delay = this.randomBetween(120, 250); // 후반: 다시 느려짐
      }

      // 4% 확률로 오타 시뮬레이션
      if (Math.random() < 0.04 && i > 2) {
        await this.delay(delay * 2, delay * 3);
        await page.keyboard.press("Backspace", { delay: 50 });
        await this.delay(98, 215);
        await page.keyboard.type(char, { delay: 50 });
      }

      await this.delay(delay * 0.8, delay * 1.2);
    }

    // 타이핑 완료 후 대기 (실제 데이터: 317-800ms)
    await this.delay(317, 800);

    // 입력 값 검증
    const inputValue = await page.inputValue(selector);
    if (inputValue !== text) {
      await page.fill(selector, text);
      await this.delay(300, 700);
    }
  }

  private async submitLogin(page: Page): Promise<void> {
    await this.delay(1500, 3500); // 입력 재확인 시간

    const submitSelectors = [
      'input[type="submit"]',
      'button[type="submit"]',
      ".btn_login",
      "#log\\.login",
      'button:has-text("로그인")',
      ".login_btn",
      ".btn_global",
    ];

    let loginExecuted = false;
    for (const selector of submitSelectors) {
      try {
        const submitBtn = page.locator(selector);
        if (
          (await submitBtn.isVisible({ timeout: 2000 })) &&
          (await submitBtn.isEnabled())
        ) {
          await submitBtn.hover();
          await this.delay(800, 1800);

          // 정확한 클릭 위치 계산
          try {
            const box = await submitBtn.boundingBox();
            if (box) {
              await page.mouse.click(
                box.x + box.width / 2,
                box.y + box.height / 2,
              );
            } else {
              await submitBtn.click();
            }
          } catch {
            await submitBtn.click();
          }

          loginExecuted = true;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!loginExecuted) {
      await page.keyboard.press("Enter");
    }
  }

  private async verifyLogin(page: Page): Promise<void> {
    try {
      await page.waitForLoadState("networkidle", { timeout: 25000 });
      await this.delay(2000, 4000);

      // 로그인 성공 확인
      const successChecks = [
        () =>
          page.url().includes("naver.com") &&
          !page.url().includes("nid.naver.com"),
        () =>
          page.locator('a:has-text("로그아웃")').isVisible({ timeout: 5000 }),
        () => page.locator(".gnb_logout").isVisible({ timeout: 5000 }),
        () => page.locator(".gnb_usr").isVisible({ timeout: 5000 }),
      ];

      let loginSuccessful = false;
      for (const check of successChecks) {
        try {
          if (await check()) {
            loginSuccessful = true;
            break;
          }
        } catch {
          continue;
        }
      }

      if (!loginSuccessful) {
        await this.checkLoginError(page);
        throw new Error("로그인 실패");
      }

      console.log("로그인 성공!");
    } catch (error) {
      if (this.loginAttempts < this.maxLoginAttempts) {
        console.log(
          `로그인 재시도 (${this.loginAttempts}/${this.maxLoginAttempts})`,
        );
        await this.delay(5000, 8000);
        return this.performLogin(page);
      }
      throw error;
    }
  }

  private async checkLoginError(page: Page): Promise<void> {
    const errorSelectors = [
      ".error_msg",
      ".err_msg",
      '[class*="error"]',
      ".login_err",
    ];

    for (const selector of errorSelectors) {
      try {
        const errorMsg = page.locator(selector);
        if (await errorMsg.isVisible({ timeout: 2000 })) {
          const errorText = await errorMsg.textContent();
          if (
            errorText?.includes("자동입력") ||
            errorText?.includes("보안") ||
            errorText?.includes("캡차")
          ) {
            throw new Error("SECURITY_BLOCK: 보안 시스템 차단");
          }
        }
      } catch {
        continue;
      }
    }
  }

  // 유틸리티 메서드
  private async delay(minMs: number, maxMs: number): Promise<void> {
    const delayTime = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    await new Promise((resolve) => setTimeout(resolve, delayTime));
  }

  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
  }

  // 공개 메서드
  async refreshAuthenticationStatus(page: Page): Promise<boolean> {
    return this.checkLoginStatus(page);
  }

  async performLogout(page: Page): Promise<void> {
    try {
      const logoutSelectors = [
        'a:has-text("로그아웃")',
        ".gnb_logout",
        '[data-clk="log.logout"]',
      ];

      for (const selector of logoutSelectors) {
        try {
          const logoutBtn = page.locator(selector);
          if (await logoutBtn.isVisible({ timeout: 3000 })) {
            await logoutBtn.hover();
            await this.delay(500, 1200);
            await logoutBtn.click();
            await page.waitForURL(/naver\.com/, { timeout: 15000 });
            console.log("✅ 로그아웃 완료");
            return;
          }
        } catch {
          continue;
        }
      }
    } catch (error) {
      console.error("❌ 로그아웃 실패:", error);
    }
  }
}
