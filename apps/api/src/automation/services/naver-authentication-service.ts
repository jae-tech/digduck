import { Page } from "playwright";
import { AuthenticationCredentials } from "@/automation/types/crawler-types";

export class NaverAuthenticationService {
  constructor(private credentials: AuthenticationCredentials) {}

  async performAuthentication(page: Page): Promise<void> {
    try {
      console.log("🔐 Starting Naver authentication process...");
      
      const isAlreadyAuthenticated = await this.checkAuthenticationStatus(page);
      if (isAlreadyAuthenticated) {
        console.log("✅ Already authenticated with Naver");
        return;
      }

      console.log("📝 Not authenticated, proceeding with login...");
      await this.navigateToLoginPage(page);
      await this.fillLoginCredentials(page);
      await this.submitLoginForm(page);
      await this.waitForAuthenticationCompletion(page);
      console.log("✅ Naver authentication completed successfully");
    } catch (error) {
      console.error("❌ Authentication failed:", error);
      throw error;
    }
  }

  private async checkAuthenticationStatus(page: Page): Promise<boolean> {
    try {
      const cookies = await page.context().cookies();
      const hasAuthCookie = cookies.some(
        (cookie) =>
          (cookie.name.includes("NID_AUT") ||
            cookie.name.includes("NID_SES")) &&
          cookie.domain.includes(".naver.com")
      );
      return hasAuthCookie;
    } catch {
      return false;
    }
  }

  private async navigateToLoginPage(page: Page): Promise<void> {
    console.log("🔄 Navigating to login page...");
    const loginButton = page.locator('a[class*="link_login"]').first();
    await loginButton.click();
    await page.waitForURL(/nid\.naver\.com/, { timeout: 15000 });
    console.log("📄 Login page loaded");
  }

  private async fillLoginCredentials(page: Page): Promise<void> {
    // 아이디 입력
    await page.waitForSelector('input[name="id"]', { timeout: 15000 });
    await this.humanTypeText(page, 'input[name="id"]', this.credentials.username);
    
    // 필드 간 딜레이
    await this.randomDelay(500, 1200);

    // 비밀번호 필드 선택자들 시도
    const passwordSelectors = [
      'input[name="password"]',
      'input[name="pw"]',
      'input[type="password"]',
      "#password",
      "#pw",
    ];

    let passwordFilled = false;
    for (const selector of passwordSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        await this.humanTypeText(page, selector, this.credentials.password);
        passwordFilled = true;
        break;
      } catch {
        continue;
      }
    }

    if (!passwordFilled) {
      throw new Error("Password field not found");
    }
  }

  private async submitLoginForm(page: Page): Promise<void> {
    // 로그인 버튼 클릭 전 딜레이
    await this.randomDelay(800, 1500);
    await page.keyboard.press("Enter");
  }

  private async waitForAuthenticationCompletion(page: Page): Promise<void> {
    await page.waitForLoadState("networkidle", { timeout: 20000 });
  }

  private async humanTypeText(page: Page, selector: string, text: string): Promise<void> {
    await page.click(selector);
    await this.randomDelay(100, 300);
    
    for (const char of text) {
      await page.keyboard.type(char);
      await this.randomDelay(80, 200);
    }
  }

  private async randomDelay(minMs: number, maxMs: number): Promise<void> {
    const delayTime = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    await new Promise((resolve) => setTimeout(resolve, delayTime));
  }
}
