import { chromium, Browser, BrowserContext } from "playwright";
import axios from "axios";
import {
  ChromiumLaunchOptions,
  ViewportConfiguration,
  BrowserSessionStatus,
} from "@/automation/types/browser-types";

interface ChromeVersionResponse {
  version: string;
  previous_version: string;
  platform: string;
  channel: string;
}

export class ChromiumBrowserManager {
  private browserInstance: Browser | null = null;
  private browserContext: BrowserContext | null = null;
  private isTerminating: boolean = false;
  private activePagesCount: number = 0;
  private launchConfiguration: Required<ChromiumLaunchOptions>;
  private latestUserAgent: string = "";

  private readonly SUPPORTED_VIEWPORTS: ViewportConfiguration[] = [
    { width: 1920, height: 1080 },
  ];

  // 기본 Chrome 버전
  private readonly DEFAULT_CHROME_VERSION = "139.0.0.0";

  constructor(options: ChromiumLaunchOptions = {}) {
    this.launchConfiguration = {
      //   headless: process.env.NODE_ENV === "production",
      headless: true,
      slowMotionDelay: Math.random() * 300 + 100,
      navigationTimeout: 60000,
      maxConcurrentPages: 3,
      ...options,
    };
  }

  private async fetchLatestChromeVersion(): Promise<string> {
    // 환경변수에서 버전 확인
    const envVersion = process.env.CHROME_VERSION;
    if (envVersion) {
      return envVersion;
    }

    // API 호출 시도
    try {
      const response = await axios.get<ChromeVersionResponse[]>(
        "https://chromiumdash.appspot.com/fetch_releases?channel=Stable&platform=Windows&num=1",
        { timeout: 5000 },
      );

      if (response.status === 200) {
        return (
          response.data[0]?.previous_version || this.DEFAULT_CHROME_VERSION
        );
      }
    } catch {
      // API 실패시 기본값 사용
    }

    return this.DEFAULT_CHROME_VERSION;
  }

  private async generateLatestChromeUserAgent(): Promise<string> {
    const chromeVersion = await this.fetchLatestChromeVersion();
    return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
  }

  async initializeBrowser(): Promise<Browser> {
    if (this.browserInstance?.isConnected()) {
      return this.browserInstance;
    }

    try {
      console.log("🚀 새로운 크롬 브라우저 인스턴스 초기화 중...");

      if (!this.latestUserAgent) {
        this.latestUserAgent = await this.generateLatestChromeUserAgent();
      }

      this.browserInstance = await chromium.launch({
        headless: this.launchConfiguration.headless,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-blink-features=AutomationControlled",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          `--user-agent=${this.latestUserAgent}`,
        ],
        timeout: 30000, // 30초 타임아웃
      });

      console.log("✅ 크롬 브라우저 초기화 성공");
      this.isTerminating = false;
      return this.browserInstance;
    } catch (error) {
      console.error("❌ 브라우저 초기화 실패:", error);
      this.browserInstance = null;
      throw error;
    }
  }

  async createBrowserContext(): Promise<BrowserContext> {
    // 기존 컨텍스트가 있고 유효하면 재사용
    if (this.browserContext && this.isContextValid()) {
      console.log("🔄 기존 브라우저 컨텍스트 재사용");
      return this.browserContext;
    }

    const browser = await this.initializeBrowser();

    try {
      this.browserContext = await browser.newContext({
        viewport: this.selectRandomViewport(),
        userAgent: this.latestUserAgent,
        locale: "ko-KR",
        timezoneId: "Asia/Seoul",
        extraHTTPHeaders: {
          "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
          "Accept-Encoding": "gzip, deflate, br",
          "Cache-Control": "max-age=0",
          "Sec-Ch-Ua":
            '"Google Chrome";v="140", "Chromium";v="140", "Not A(Brand";v="99"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
        },
        // JavaScript 활성화 및 이미지 로딩
        javaScriptEnabled: true,
        ignoreHTTPSErrors: true,
      });

      // 모든 페이지에 자동화 탐지 우회 스크립트 적용
      await this.browserContext.addInitScript(() => {
        // 기본 웹드라이버 속성 제거
        delete (window as any).webdriver;
        delete (navigator as any).webdriver;

        Object.defineProperty(navigator, "webdriver", {
          get: () => undefined,
        });
      });

      console.log("🔧 새로운 브라우저 컨텍스트 생성 및 봇 탐지 우회 완료");
      return this.browserContext;
    } catch (error) {
      console.error("❌ 브라우저 컨텍스트 생성 실패:", error);
      throw error;
    }
  }

  private selectRandomViewport(): ViewportConfiguration {
    const selectedViewport =
      this.SUPPORTED_VIEWPORTS[
        Math.floor(Math.random() * this.SUPPORTED_VIEWPORTS.length)
      ];
    console.log(
      `📱 선택된 뷰포트: ${selectedViewport.width}x${selectedViewport.height}`,
    );
    return selectedViewport;
  }

  private isContextValid(): boolean {
    return (
      this.browserContext !== null &&
      !this.browserContext.pages().every((page) => page.isClosed())
    );
  }

  trackPageCreated(): void {
    this.activePagesCount++;
    console.log(`📄 페이지 생성됨. 활성 페이지 수: ${this.activePagesCount}`);
  }

  trackPageClosed(): void {
    this.activePagesCount = Math.max(0, this.activePagesCount - 1);
    console.log(`📄 페이지 닫힘. 활성 페이지 수: ${this.activePagesCount}`);
  }

  getBrowserSessionStatus(): BrowserSessionStatus {
    return {
      isActive: this.browserInstance?.isConnected() || false,
      activePagesCount: this.activePagesCount,
      isTerminating: this.isTerminating,
    };
  }

  getCurrentUserAgent(): string {
    return this.latestUserAgent;
  }

  async refreshUserAgent(): Promise<void> {
    this.latestUserAgent = await this.generateLatestChromeUserAgent();
    console.log(`🔄 User Agent 갱신됨: ${this.latestUserAgent}`);
  }

  async terminateBrowser(): Promise<void> {
    if (!this.browserInstance || this.isTerminating) {
      return;
    }

    this.isTerminating = true;

    try {
      console.log("🔄 브라우저 세션 종료 중...");

      if (this.browserContext) {
        await this.browserContext.close();
        this.browserContext = null;
      }

      if (this.browserInstance.isConnected()) {
        await this.browserInstance.close();
      }

      console.log("✅ 브라우저 종료 성공");
    } catch (error) {
      console.error("❌ 브라우저 종료 오류:", error);
    } finally {
      this.browserInstance = null;
      this.isTerminating = false;
      this.activePagesCount = 0;
    }
  }

  async cleanup(): Promise<void> {
    await this.terminateBrowser();
  }
}
