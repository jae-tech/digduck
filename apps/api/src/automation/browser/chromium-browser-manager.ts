import { chromium, Browser, BrowserContext } from "playwright";
import { 
  ChromiumLaunchOptions, 
  ViewportConfiguration, 
  BrowserSessionStatus 
} from "@/automation/types/browser-types";

export class ChromiumBrowserManager {
  private browserInstance: Browser | null = null;
  private browserContext: BrowserContext | null = null;
  private isTerminating: boolean = false;
  private activePagesCount: number = 0;
  private launchConfiguration: Required<ChromiumLaunchOptions>;
  private latestUserAgent: string = "";

  private readonly SUPPORTED_VIEWPORTS: ViewportConfiguration[] = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
  ];

  constructor(options: ChromiumLaunchOptions = {}) {
    this.launchConfiguration = {
      headless: process.env.NODE_ENV === "production",
      slowMotionDelay: Math.random() * 300 + 100,
      navigationTimeout: 60000,
      maxConcurrentPages: 3,
      ...options,
    };
  }

  private async generateLatestChromeUserAgent(): Promise<string> {
    return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
  }

  async initializeBrowser(): Promise<Browser> {
    if (!this.browserInstance || !this.browserInstance.isConnected()) {
      console.log("🚀 Initializing new Chromium browser instance...");

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
          `--user-agent=${this.latestUserAgent}`,
        ],
      });

      console.log("✅ Chromium browser initialized successfully");
    }

    this.isTerminating = false;
    return this.browserInstance;
  }

  async createBrowserContext(): Promise<BrowserContext> {
    const browser = await this.initializeBrowser();

    this.browserContext = await browser.newContext({
      viewport: this.selectRandomViewport(),
      userAgent: this.latestUserAgent,
      locale: "ko-KR",
    });

    console.log("🔧 Browser context created successfully");
    return this.browserContext;
  }

  private selectRandomViewport(): ViewportConfiguration {
    const selectedViewport = this.SUPPORTED_VIEWPORTS[Math.floor(Math.random() * this.SUPPORTED_VIEWPORTS.length)];
    console.log(`📱 Selected viewport: ${selectedViewport.width}x${selectedViewport.height}`);
    return selectedViewport;
  }

  trackPageCreated(): void {
    this.activePagesCount++;
    console.log(`📄 Page created. Active pages: ${this.activePagesCount}`);
  }

  trackPageClosed(): void {
    this.activePagesCount = Math.max(0, this.activePagesCount - 1);
    console.log(`📄 Page closed. Active pages: ${this.activePagesCount}`);
  }

  getBrowserSessionStatus(): BrowserSessionStatus {
    return {
      isActive: this.browserInstance?.isConnected() || false,
      activePagesCount: this.activePagesCount,
      isTerminating: this.isTerminating,
    };
  }

  async terminateBrowser(): Promise<void> {
    if (this.browserInstance && !this.isTerminating) {
      this.isTerminating = true;

      try {
        console.log("🔄 Terminating browser session...");

        if (this.browserContext) {
          await this.browserContext.close();
          this.browserContext = null;
        }

        await this.browserInstance.close();
        console.log("✅ Browser terminated successfully");
      } catch (error) {
        console.error("❌ Browser termination error:", error);
      } finally {
        this.browserInstance = null;
        this.isTerminating = false;
        this.activePagesCount = 0;
      }
    }
  }

  async cleanup(): Promise<void> {
    await this.terminateBrowser();
  }
}