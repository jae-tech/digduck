import { chromium, Browser, Page, BrowserContext } from "playwright";

interface ViewportConfig {
  width: number;
  height: number;
}

interface BrowserConfig {
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
  maxPages?: number;
}

export class BrowserService {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private isClosing: boolean = false;
  private activePagesCount: number = 0;
  private config: BrowserConfig;
  private selectedUserAgent: string; // 🔧 일관된 User-Agent 사용

  // 🔧 동적으로 최신 Chrome 버전 사용
  private async getLatestChromeUserAgent(): Promise<string> {
    try {
      // 현재 날짜 기준으로 Chrome 버전 추정
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      // Chrome 릴리즈 주기: 약 4주마다 마이너 업데이트
      // 2024년 1월부터 계산 (Chrome 120 기준)
      const baseVersion = 120;
      const monthsSince2024 = (year - 2024) * 12 + (month - 1);
      const estimatedVersion = baseVersion + Math.floor(monthsSince2024 / 1);

      // 최신 버전들 (수동 업데이트 필요시)
      const latestVersions = [131, 132, 133, 134]; // 주기적으로 업데이트
      const latestVersion = Math.max(estimatedVersion, ...latestVersions);

      const userAgents = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${latestVersion}.0.0.0 Safari/537.36`;

      console.log(
        `🔄 최신 Chrome 버전 사용: ${latestVersion}, UA: ${userAgents}`
      );

      return userAgents;
    } catch (error) {
      console.error("User-Agent 생성 오류:", error);
      // 기본값 반환
      return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36";
    }
  }

  private readonly VIEWPORTS: ViewportConfig[] = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
  ];

  constructor(config: BrowserConfig = {}) {
    this.config = {
      headless: process.env.NODE_ENV === "production",
      slowMo: Math.random() * 300 + 100, // 🔧 더 빠르게
      timeout: 60000,
      maxPages: 3,
      ...config,
    };

    this.selectedUserAgent = "";
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser || this.browser.isConnected() === false) {
      console.log("🚀 새 브라우저 인스턴스 생성 중...");

      // 🔧 최신 User-Agent 동적 생성
      if (!this.selectedUserAgent) {
        this.selectedUserAgent = await this.getLatestChromeUserAgent();
        console.log(`🎭 선택된 User-Agent: ${this.selectedUserAgent}`);
      }

      this.browser = await chromium.launch({
        headless: this.config.headless,
        slowMo: this.config.slowMo,
        args: [
          // 기본 보안 설정
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",

          // 🔧 봇 탐지 우회 (강화)
          "--disable-blink-features=AutomationControlled",
          "--exclude-switches=enable-automation,enable-logging",
          "--disable-features=VizDisplayCompositor",
          "--disable-component-extensions-with-background-pages",
          "--disable-default-apps",
          "--disable-extensions",

          // 🔧 추가 우회 설정
          "--no-service-autorun",
          "--password-store=basic",
          "--use-mock-keychain",
          "--disable-component-update",

          // 🔧 JavaScript 및 렌더링 보장
          "--enable-javascript",
          "--disable-web-security",
          "--disable-features=site-per-process",

          // 🔧 동적 User-Agent 적용
          `--user-agent=${this.selectedUserAgent}`,

          // 기본 설정
          "--no-first-run",
          "--no-default-browser-check",
          "--lang=ko-KR",
          "--window-size=1920,1080",

          // 성능 최적화
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-field-trial-config",
        ],
      });

      console.log("✅ 브라우저 인스턴스 생성 완료");
    }

    this.isClosing = false;
    return this.browser;
  }

  async createContext(): Promise<BrowserContext> {
    const browser = await this.getBrowser();

    this.context = await browser.newContext({
      viewport: this.getRandomViewport(),
      userAgent: this.selectedUserAgent, // 🔧 동일한 User-Agent 사용
      locale: "ko-KR",
      timezoneId: "Asia/Seoul",

      permissions: ["notifications"],
      javaScriptEnabled: true,
      ignoreHTTPSErrors: true,
      acceptDownloads: false,

      hasTouch: false,
      isMobile: false,
      colorScheme: "light",

      // 🔧 필수 헤더만 설정
      extraHTTPHeaders: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
      },
    });

    console.log("🔧 새 브라우저 컨텍스트 생성 완료");
    return this.context;
  }

  async createStealthPage(): Promise<Page> {
    if (!this.context) {
      await this.createContext();
    }

    if (this.activePagesCount >= this.config.maxPages!) {
      throw new Error(`최대 페이지 수 초과: ${this.config.maxPages}`);
    }

    const page = await this.context!.newPage();
    this.activePagesCount++;

    await this.setupNaverStealthPage(page);

    page.on("close", () => {
      this.activePagesCount = Math.max(0, this.activePagesCount - 1);
      console.log(`📄 페이지 종료. 활성 페이지 수: ${this.activePagesCount}`);
    });

    console.log(
      `📄 새 Stealth 페이지 생성. 활성 페이지 수: ${this.activePagesCount}`
    );
    return page;
  }

  private getRandomViewport(): ViewportConfig {
    // 🔧 안전한 기본값 설정
    const viewports = this.VIEWPORTS || [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1536, height: 864 },
    ];

    const viewport = viewports[Math.floor(Math.random() * viewports.length)];
    console.log(`📱 선택된 뷰포트: ${viewport.width}x${viewport.height}`);
    return viewport;
  }

  /**
   * 🔧 더 강력한 네이버 Stealth 설정
   */
  private async setupNaverStealthPage(page: Page): Promise<void> {
    page.setDefaultTimeout(this.config.timeout!);
    page.setDefaultNavigationTimeout(this.config.timeout!);

    // 🔧 더 강력한 봇 탐지 우회
    await page.addInitScript(() => {
      // 1. webdriver 관련 완전 제거
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      delete (window as any).webdriver;
      delete (navigator as any).webdriver;
      delete (window as any)._phantom;
      delete (window as any).phantom;
      delete (window as any).callPhantom;
      delete (window as any)._selenium;
      delete (window as any).selenium;

      // 2. 자동화 관련 속성 제거
      const originalDescriptor = Object.getOwnPropertyDescriptor(
        Navigator.prototype,
        "webdriver"
      );
      if (originalDescriptor) {
        delete Navigator.prototype.webdriver;
      }

      // 3. Chrome DevTools Protocol 숨기기
      if ((window as any).chrome) {
        delete (window as any).chrome.runtime;
      }

      // 4. 실제 브라우저처럼 보이게 하는 설정
      Object.defineProperty(navigator, "languages", {
        get: () => ["ko-KR", "ko", "en-US", "en"],
      });

      Object.defineProperty(navigator, "platform", {
        get: () => "Win32",
      });

      // 5. 플러그인 정보 (실제처럼)
      Object.defineProperty(navigator, "plugins", {
        get: () => [
          {
            0: {
              type: "application/x-google-chrome-pdf",
              suffixes: "pdf",
              description: "Portable Document Format",
              enabledPlugin: null,
            },
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin",
          },
        ],
      });

      // 6. 마우스/터치 이벤트 활성화
      Object.defineProperty(navigator, "maxTouchPoints", {
        get: () => 0,
      });

      // 7. 메모리 정보
      if ((window as any).performance && (window as any).performance.memory) {
        Object.defineProperty(
          (window as any).performance.memory,
          "jsHeapSizeLimit",
          {
            get: () => 2147483648,
          }
        );
      }

      // 8. 가짜 배터리 API
      if ("getBattery" in navigator) {
        (navigator as any).getBattery = () =>
          Promise.resolve({
            charging: true,
            chargingTime: 0,
            dischargingTime: Infinity,
            level: 1,
          });
      }

      // 9. 권한 API 조작
      if (navigator.permissions) {
        const originalQuery = navigator.permissions.query;
        navigator.permissions.query = (parameters) =>
          Promise.resolve({ state: "granted" } as PermissionStatus);
      }

      // 🔧 10. 네이버 특화: iframe 검사 우회
      const originalAppendChild = Element.prototype.appendChild;
      Element.prototype.appendChild = function (child) {
        if (
          child.tagName === "IFRAME" &&
          child.src &&
          child.src.includes("recaptcha")
        ) {
          // reCAPTCHA iframe 숨기기
          child.style.display = "none";
        }
        return originalAppendChild.call(this, child);
      };

      console.log("🛡️ 강화된 네이버 봇 탐지 우회 적용 완료");
    });

    console.log("🛡️ 강화된 Stealth 설정 적용 완료");
  }

  /**
   * 🔧 더 자연스러운 인간 행동 시뮬레이션
   */
  async simulateNaverHumanBehavior(
    page: Page,
    options: {
      scroll?: boolean;
      mouseMove?: boolean;
      randomWait?: boolean;
    } = {}
  ): Promise<void> {
    const { scroll = true, mouseMove = true, randomWait = true } = options;

    console.log("🤖 자연스러운 행동 시뮬레이션 시작...");

    try {
      // 1. 페이지 로드 대기 (자연스럽게)
      await this.randomWait(1000, 2000);

      // 2. 마우스 움직임 (간단하게)
      if (mouseMove) {
        await page.mouse.move(100, 100);
        await this.randomWait(300, 700);
        await page.mouse.move(300, 200);
        await this.randomWait(300, 700);
      }

      // 3. 스크롤 (한 번만)
      if (scroll) {
        await page.evaluate(() => window.scrollBy(0, 200));
        await this.randomWait(1000, 2000);
      }

      // 4. 최종 대기
      if (randomWait) {
        await this.randomWait(1000, 3000);
      }

      console.log("✅ 행동 시뮬레이션 완료");
    } catch (error) {
      console.error("❌ 행동 시뮬레이션 오류:", error);
    }
  }

  async randomWait(min: number = 1000, max: number = 3000): Promise<void> {
    const waitTime = Math.floor(Math.random() * (max - min)) + min;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  /**
   * 네이버 접근에 최적화된 안전한 페이지 이동
   */
  async safeNaverGoto(
    page: Page,
    url: string,
    options: {
      waitUntil?: "load" | "domcontentloaded" | "networkidle";
      timeout?: number;
      referer?: string;
      simulateHuman?: boolean;
    } = {}
  ): Promise<void> {
    const {
      waitUntil = "domcontentloaded", // 🔧 networkidle에서 변경
      timeout = this.config.timeout,
      referer = "https://www.naver.com",
      simulateHuman = true,
    } = options;

    try {
      console.log(`🌐 네이버 페이지 이동: ${url}`);

      // Referer 설정 (네이버에서 중요)
      await page.setExtraHTTPHeaders({
        Referer: referer,
      });

      // 사전 대기
      await this.randomWait(1000, 3000);

      const response = await page.goto(url, {
        waitUntil,
        timeout,
        referer,
      });

      if (!response?.ok() && response?.status() !== 200) {
        console.warn(`⚠️ HTTP 응답 오류: ${response?.status()}`);

        // 403이나 429 에러 시 더 긴 대기
        if (response?.status() === 403 || response?.status() === 429) {
          console.log("🚫 봇 탐지 가능성 - 긴 대기 시작...");
          await this.randomWait(10000, 20000);
        }
      }

      // 페이지 로드 후 추가 대기
      await this.randomWait(2000, 4000);

      // 인간 행동 시뮬레이션
      if (simulateHuman) {
        await this.simulateNaverHumanBehavior(page, {
          scroll: Math.random() > 0.3,
          mouseMove: Math.random() > 0.2,
          randomWait: true,
        });
      }
    } catch (error) {
      console.error(`❌ 네이버 페이지 이동 실패: ${url}`, error);

      // 에러 발생시 봇 탐지 가능성이 높으므로 긴 대기
      console.log("⏰ 에러 발생 - 봇 탐지 우회를 위한 대기...");
      await this.randomWait(15000, 30000);

      throw error;
    }
  }

  getStatus(): {
    isActive: boolean;
    activePagesCount: number;
    isClosing: boolean;
  } {
    return {
      isActive: this.browser?.isConnected() || false,
      activePagesCount: this.activePagesCount,
      isClosing: this.isClosing,
    };
  }

  async close(): Promise<void> {
    if (this.browser && !this.isClosing) {
      this.isClosing = true;

      try {
        console.log("🔄 브라우저 종료 중...");

        if (this.context) {
          await this.context.close();
          this.context = null;
        }

        await this.browser.close();
        console.log("✅ 브라우저 정상 종료됨");
      } catch (error) {
        console.error("❌ 브라우저 종료 중 오류:", error);
      } finally {
        this.browser = null;
        this.isClosing = false;
        this.activePagesCount = 0;
      }
    }
  }

  async cleanup(): Promise<void> {
    await this.close();
  }

  async [Symbol.asyncDispose](): Promise<void> {
    await this.cleanup();
  }
}
