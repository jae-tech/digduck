import { Page } from "playwright";
import { ChromiumBrowserManager } from "./chromium-browser-manager";
import {
  StealthPageSettings,
  PageNavigationOptions,
} from "@/automation/types/browser-types";

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
      console.log(
        `📄 Page closed. Active pages: ${this.browserManager.getBrowserSessionStatus().activePagesCount}`
      );
    });

    console.log(
      `📄 Stealth page created. Active pages: ${this.browserManager.getBrowserSessionStatus().activePagesCount}`
    );
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

    // 실제 데이터: 네비게이션 전 자연스러운 대기 (505-1373ms)
    await this.randomDelay(500, 1400);

    await page.goto(url, {
      waitUntil: waitStrategy,
      timeout,
    });

    // 실제 데이터: 페이지 로드 후 관찰된 대기시간 (732-1175ms)
    await this.randomDelay(700, 1200);

    const notFound = await page
      .locator("text=상품이 존재하지 않습니다")
      .isVisible();

    if (notFound) {
      await page.goto(url, {
        waitUntil: waitStrategy,
        timeout,
      });
    }

    // 실제 사용자 행동: 로드 후 자연스러운 마우스 움직임 시뮬레이션
    await this.simulatePostLoadBehavior(page);
  }

  // 실제 데이터 기반 페이지 로드 후 자연스러운 행동
  private async simulatePostLoadBehavior(page: Page): Promise<void> {
    const viewport = page.viewportSize();
    if (!viewport) return;

    // 실제 관찰된 호버 패턴 재현
    const postLoadHovers = [
      { x: viewport.width * 0.6, y: viewport.height * 0.3, duration: [16, 50] },
      { x: viewport.width * 0.4, y: viewport.height * 0.4, duration: [33, 83] },
      {
        x: viewport.width * 0.5,
        y: viewport.height * 0.2,
        duration: [48, 142],
      },
    ];

    for (const hover of postLoadHovers) {
      await page.mouse.move(hover.x, hover.y);
      await this.randomDelay(hover.duration[0], hover.duration[1]);
    }
  }

  async randomDelay(minMs: number = 1000, maxMs: number = 3000): Promise<void> {
    const delayTime = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
    await new Promise((resolve) => setTimeout(resolve, delayTime));
  }

  // 실제 데이터 기반 스크롤 행동 시뮬레이션
  async simulateNaturalScrolling(page: Page): Promise<void> {
    // 실제 관찰된 스크롤 패턴: 여러 단계의 작은 스크롤
    const scrollActions = [
      { deltaY: 95, duration: 60 }, // 실제 데이터에서 관찰된 값
      { deltaY: 84, duration: 45 },
      { deltaY: 66, duration: 33 },
      { deltaY: 98, duration: 82 },
      { deltaY: 83, duration: 39 },
      { deltaY: 86, duration: 66 },
      { deltaY: 99, duration: 78 },
    ];

    for (const scroll of scrollActions) {
      await page.mouse.wheel(0, scroll.deltaY);
      await this.randomDelay(scroll.duration * 0.5, scroll.duration * 2);

      // 실제 데이터: 스크롤 간 대기시간 (708-1373ms)
      if (Math.random() < 0.3) {
        await this.randomDelay(700, 1400);
      }
    }
  }

  // 실제 데이터 기반 클릭 시뮬레이션
  async simulateNaturalClick(page: Page, selector: string): Promise<void> {
    const element = page.locator(selector);

    // 실제 데이터: 클릭 전 호버 시간 (142-737ms)
    await element.hover();
    await this.randomDelay(140, 750);

    // 실제 데이터: 클릭 지속시간 (59-90ms)
    await element.click({ delay: this.getRandomDelay(59, 90) });

    // 실제 데이터: 클릭 후 대기시간 (551-1204ms)
    await this.randomDelay(550, 1200);
  }

  private getRandomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min) + min);
  }
}
