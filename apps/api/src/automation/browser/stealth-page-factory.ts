import { Page } from "playwright";
import { ChromiumBrowserManager } from "./chromium-browser-manager";
import { StealthPageSettings, PageNavigationOptions } from "@/automation/types/browser-types";

export class StealthPageFactory {
  constructor(private browserManager: ChromiumBrowserManager) {}

  async createStealthPage(settings: StealthPageSettings = {}): Promise<Page> {
    const context = await this.browserManager.createBrowserContext();
    
    if (this.browserManager.getBrowserSessionStatus().activePagesCount >= 3) {
      throw new Error("Maximum concurrent pages limit reached: 3");
    }

    const page = await context.newPage();
    this.browserManager.trackPageCreated();

    await this.applyAntiDetectionFeatures(page);

    page.on("close", () => {
      this.browserManager.trackPageClosed();
      console.log(`📄 Page closed. Active pages: ${this.browserManager.getBrowserSessionStatus().activePagesCount}`);
    });

    console.log(`📄 Stealth page created. Active pages: ${this.browserManager.getBrowserSessionStatus().activePagesCount}`);
    return page;
  }

  private async applyAntiDetectionFeatures(page: Page): Promise<void> {
    page.setDefaultTimeout(60000);
    page.setDefaultNavigationTimeout(60000);

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      delete (window as any).webdriver;
    });
  }

  async navigateWithStealth(
    page: Page,
    url: string,
    options: PageNavigationOptions = {}
  ): Promise<void> {
    const { waitStrategy = "domcontentloaded", timeout = 60000 } = options;
    
    // 인간적인 딜레이 추가
    await this.randomDelay(800, 2000);
    
    await page.goto(url, {
      waitUntil: waitStrategy,
      timeout,
    });
    
    // 페이지 로드 후 추가 딜레이
    await this.randomDelay(1000, 2500);
  }

  async randomDelay(minMs: number = 1000, maxMs: number = 3000): Promise<void> {
    const delayTime = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    await new Promise((resolve) => setTimeout(resolve, delayTime));
  }
}