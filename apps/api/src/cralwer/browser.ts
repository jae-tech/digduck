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

  // 네이버 우회에 최적화된 User-Agent (최신 Chrome만 사용)
  private readonly USER_AGENTS = [
    // Chrome 131 (최신 stable) - Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",

    // Chrome 131 - macOS
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",

    // Chrome 130 (백업) - Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",

    // Chrome 130 - macOS
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",

    // Chrome 131 - Linux (추가)
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",

    // 다양한 OS 버전들
    "Mozilla/5.0 (Windows NT 11.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  ];

  // 일반적인 해상도만 사용 (너무 특이한 해상도는 의심받을 수 있음)
  private readonly VIEWPORTS: ViewportConfig[] = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
  ];

  constructor(config: BrowserConfig = {}) {
    this.config = {
      headless: process.env.NODE_ENV === "production",
      slowMo: Math.random() * 500 + 200, // 200-700ms로 줄임 (너무 느리면 의심)
      timeout: 60000, // 네이버는 로딩이 오래 걸릴 수 있음
      maxPages: 3, // 동시 페이지 수 제한
      ...config,
    };
  }

  async getBrowser(): Promise<Browser> {
    if (!this.browser || this.browser.isConnected() === false) {
      console.log("🚀 새 브라우저 인스턴스 생성 중...");

      this.browser = await chromium.launch({
        headless: this.config.headless,
        slowMo: this.config.slowMo,
        args: [
          // 기본 보안 우회
          "--no-sandbox",
          "--disable-setuid-sandbox",

          // 봇 탐지 우회 (가장 중요)
          "--disable-blink-features=AutomationControlled",
          "--disable-features=VizDisplayCompositor",
          "--exclude-switches=enable-automation",
          "--disable-extensions-file-access-check",
          "--disable-extensions-http-throttling",
          "--disable-extensions-except-plugin",
          "--disable-plugins-discovery",

          // 성능 및 안정성
          "--disable-web-security",
          "--disable-features=site-per-process",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-field-trial-config",
          "--disable-ipc-flooding-protection",

          // 첫 실행 관련
          "--no-first-run",
          "--no-default-browser-check",
          "--no-service-autorun",

          // 추가 우회 설정
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--disable-gpu",
          "--window-size=1920,1080",

          // 네이버 특화 설정
          "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "--lang=ko-KR",
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
      userAgent: this.getRandomUserAgent(),
      locale: "ko-KR",
      timezoneId: "Asia/Seoul",

      // 네이버 접근에 중요한 설정들
      permissions: ["notifications", "geolocation"],
      javaScriptEnabled: true,
      ignoreHTTPSErrors: true,
      acceptDownloads: false,

      // 실제 브라우저와 동일한 설정
      hasTouch: false,
      isMobile: false,
      colorScheme: "light",

      // HTTP 헤더 미리 설정
      extraHTTPHeaders: {
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Ch-Ua":
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"Windows"',
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        Connection: "keep-alive",
        DNT: "1",
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

    // 네이버 특화 Stealth 설정
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

  private getRandomUserAgent(): string {
    const userAgent =
      this.USER_AGENTS[Math.floor(Math.random() * this.USER_AGENTS.length)];
    console.log(`🎭 선택된 User-Agent: ${userAgent}`);

    return userAgent;
  }

  private getRandomViewport(): ViewportConfig {
    const viewport =
      this.VIEWPORTS[Math.floor(Math.random() * this.VIEWPORTS.length)];
    console.log(`📱 선택된 뷰포트: ${viewport.width}x${viewport.height}`);
    return viewport;
  }

  /**
   * 네이버 봇 탐지 우회에 특화된 Stealth 설정
   */
  private async setupNaverStealthPage(page: Page): Promise<void> {
    page.setDefaultTimeout(this.config.timeout!);
    page.setDefaultNavigationTimeout(this.config.timeout!);

    // 네이버 특화 자동화 탐지 방지 스크립트
    await page.addInitScript(() => {
      // 1. webdriver 속성 완전 제거
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });

      // 2. 자동화 관련 속성들 제거
      delete (window as any).webdriver;
      delete (navigator as any).webdriver;
      delete (window as any)._phantom;
      delete (window as any).phantom;
      delete (window as any).callPhantom;

      // 3. Chrome 객체 완전 구현 (네이버가 확인하는 중요한 부분)
      (window as any).chrome = {
        runtime: {
          onConnect: undefined,
          onMessage: undefined,
          connect: function () {
            return {};
          },
          sendMessage: function () {
            return {};
          },
        },
        loadTimes: function () {
          return {
            requestTime: Date.now() * 0.001,
            startLoadTime: Date.now() * 0.001,
            commitLoadTime: Date.now() * 0.001,
            finishDocumentLoadTime: Date.now() * 0.001,
            finishLoadTime: Date.now() * 0.001,
            firstPaintTime: Date.now() * 0.001,
            firstPaintAfterLoadTime: 0,
            navigationType: "Other",
          };
        },
        csi: function () {
          return {
            onloadT: Date.now(),
            startE: Date.now(),
            tran: 15,
          };
        },
        app: {
          isInstalled: false,
          InstallState: {
            DISABLED: "disabled",
            INSTALLED: "installed",
            NOT_INSTALLED: "not_installed",
          },
        },
      };

      // 4. Navigator 속성들 실제 브라우저와 동일하게 설정
      Object.defineProperty(navigator, "languages", {
        get: () => ["ko-KR", "ko", "en-US", "en"],
      });

      Object.defineProperty(navigator, "platform", {
        get: () => "Win32",
      });

      Object.defineProperty(navigator, "deviceMemory", {
        get: () => 8,
      });

      Object.defineProperty(navigator, "hardwareConcurrency", {
        get: () => 8,
      });

      Object.defineProperty(navigator, "maxTouchPoints", {
        get: () => 0,
      });

      // 5. 플러그인 정보 (네이버가 확인)
      Object.defineProperty(navigator, "plugins", {
        get: () =>
          Object.create(PluginArray.prototype, {
            length: {
              value: 3,
              writable: false,
              enumerable: false,
              configurable: true,
            },
            0: {
              value: Object.create(Plugin.prototype, {
                name: {
                  value: "Chrome PDF Plugin",
                  writable: false,
                  enumerable: true,
                  configurable: true,
                },
                filename: {
                  value: "internal-pdf-viewer",
                  writable: false,
                  enumerable: true,
                  configurable: true,
                },
                description: {
                  value: "Portable Document Format",
                  writable: false,
                  enumerable: true,
                  configurable: true,
                },
                length: {
                  value: 1,
                  writable: false,
                  enumerable: false,
                  configurable: true,
                },
              }),
              writable: false,
              enumerable: true,
              configurable: true,
            },
            1: {
              value: Object.create(Plugin.prototype, {
                name: {
                  value: "Chrome PDF Viewer",
                  writable: false,
                  enumerable: true,
                  configurable: true,
                },
                filename: {
                  value: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
                  writable: false,
                  enumerable: true,
                  configurable: true,
                },
                description: {
                  value: "",
                  writable: false,
                  enumerable: true,
                  configurable: true,
                },
                length: {
                  value: 1,
                  writable: false,
                  enumerable: false,
                  configurable: true,
                },
              }),
              writable: false,
              enumerable: true,
              configurable: true,
            },
            2: {
              value: Object.create(Plugin.prototype, {
                name: {
                  value: "Native Client",
                  writable: false,
                  enumerable: true,
                  configurable: true,
                },
                filename: {
                  value: "internal-nacl-plugin",
                  writable: false,
                  enumerable: true,
                  configurable: true,
                },
                description: {
                  value: "",
                  writable: false,
                  enumerable: true,
                  configurable: true,
                },
                length: {
                  value: 2,
                  writable: false,
                  enumerable: false,
                  configurable: true,
                },
              }),
              writable: false,
              enumerable: true,
              configurable: true,
            },
          }),
      });

      // 6. 권한 API 모킹 (네이버가 확인)
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => {
        if (parameters.name === "notifications") {
          return Promise.resolve({
            state: "granted",
            name: "notifications",
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
          } as PermissionStatus);
        }
        return originalQuery(parameters);
      };

      // 7. Connection 정보 (모바일/데스크톱 구분용)
      Object.defineProperty(navigator, "connection", {
        get: () => ({
          effectiveType: "4g",
          rtt: 50,
          downlink: 10,
          saveData: false,
        }),
      });

      // 8. Battery API (있는 경우에만)
      if ("getBattery" in navigator) {
        (navigator as any).getBattery = () =>
          Promise.resolve({
            charging: true,
            chargingTime: 0,
            dischargingTime: Infinity,
            level: 1,
          });
      }

      // 9. Media Devices (카메라/마이크 권한 관련)
      if (navigator.mediaDevices) {
        const originalEnumerateDevices =
          navigator.mediaDevices.enumerateDevices;
        navigator.mediaDevices.enumerateDevices = () =>
          Promise.resolve([
            { kind: "videoinput", deviceId: "default", label: "", groupId: "" },
            { kind: "audioinput", deviceId: "default", label: "", groupId: "" },
            {
              kind: "audiooutput",
              deviceId: "default",
              label: "",
              groupId: "",
            },
          ] as MediaDeviceInfo[]);
      }

      // 10. toString 메서드들 오버라이드
      window.navigator.toString = () => "[object Navigator]";
      window.toString = () => "[object Window]";

      // 11. 스크린 정보 일관성 유지
      const screenWidth = window.screen.width;
      const screenHeight = window.screen.height;

      Object.defineProperty(window.screen, "availWidth", {
        get: () => screenWidth,
      });

      Object.defineProperty(window.screen, "availHeight", {
        get: () => screenHeight - 40, // 태스크바 고려
      });

      // 12. Date 및 시간대 정보
      Object.defineProperty(Date.prototype, "getTimezoneOffset", {
        value: () => -540, // 한국 시간 (UTC+9)
      });

      // 13. 로컬 스토리지 설정 (사용자 기록 시뮬레이션)
      try {
        if (!localStorage.getItem("language")) {
          localStorage.setItem("language", "ko-KR");
          localStorage.setItem("timezone", "Asia/Seoul");
          localStorage.setItem("visited", Date.now().toString());
        }
      } catch (e) {
        // localStorage 사용 불가시 무시
      }

      // 14. 성능 API 조작
      if (window.performance && (window.performance as any).memory) {
        const memory = (window.performance as any).memory;
        Object.defineProperty(memory, "jsHeapSizeLimit", {
          get: () => 2147483648, // 2GB
        });
        Object.defineProperty(memory, "totalJSHeapSize", {
          get: () => Math.floor(Math.random() * 100000000) + 10000000,
        });
        Object.defineProperty(memory, "usedJSHeapSize", {
          get: () => Math.floor(Math.random() * 50000000) + 5000000,
        });
      }

      // 15. 추가 탐지 방지
      Object.defineProperty(document, "hidden", { get: () => false });
      Object.defineProperty(document, "visibilityState", {
        get: () => "visible",
      });

      console.log("🛡️ 네이버 전용 봇 탐지 우회 스크립트 적용 완료");
    });

    console.log("🛡️ 네이버 특화 Stealth 설정 적용 완료");
  }

  /**
   * 네이버 접근에 최적화된 인간 행동 시뮬레이션
   */
  async simulateNaverHumanBehavior(
    page: Page,
    options: {
      scroll?: boolean;
      mouseMove?: boolean;
      randomWait?: boolean;
      hover?: boolean;
    } = {}
  ): Promise<void> {
    const {
      scroll = true,
      mouseMove = true,
      randomWait = true,
      hover = true,
    } = options;

    console.log("🤖 네이버 특화 인간 행동 시뮬레이션 시작...");

    try {
      // 1. 자연스러운 마우스 움직임 (네이버 로고 영역 등을 지나감)
      if (mouseMove) {
        const movements = [
          { x: 200, y: 100 }, // 네이버 로고 근처
          { x: 400, y: 200 }, // 검색창 근처
          { x: 600, y: 150 }, // 상단 메뉴 근처
        ];

        for (const pos of movements) {
          await page.mouse.move(pos.x, pos.y, {
            steps: Math.random() * 10 + 5,
          });
          await this.randomWait(200, 800);
        }
      }

      // 2. 네이버 특화 스크롤 패턴
      if (scroll) {
        // 첫 번째 스크롤: 조금만 내려서 페이지 확인
        await page.evaluate(() => window.scrollBy(0, 150));
        await this.randomWait(1000, 2000);

        // 두 번째 스크롤: 다시 위로 (사람들이 자주 하는 행동)
        await page.evaluate(() => window.scrollBy(0, -50));
        await this.randomWait(500, 1000);

        // 세 번째 스크롤: 더 아래로
        const scrollDistance = Math.floor(Math.random() * 300) + 200;
        await page.evaluate((distance) => {
          window.scrollBy(0, distance);
        }, scrollDistance);
      }

      // 3. 요소에 호버 (네이버 메뉴들에 자연스럽게)
      if (hover) {
        try {
          const hoverSelectors = [
            'a[href*="mail"]', // 메일
            'a[href*="news"]', // 뉴스
            'a[href*="shopping"]', // 쇼핑
            'a[href*="blog"]', // 블로그
          ];

          const availableSelector =
            hoverSelectors[Math.floor(Math.random() * hoverSelectors.length)];
          const element = page.locator(availableSelector).first();

          if (await element.isVisible({ timeout: 2000 })) {
            await element.hover();
            await this.randomWait(500, 1500);
          }
        } catch (e) {
          // 호버 실패시 무시
        }
      }

      // 4. 랜덤 대기
      if (randomWait) {
        await this.randomWait(2000, 4000); // 네이버는 좀 더 긴 대기
      }

      console.log("✅ 네이버 특화 인간 행동 시뮬레이션 완료");
    } catch (error) {
      console.error("❌ 인간 행동 시뮬레이션 오류:", error);
    }
  }

  async randomWait(min: number = 1000, max: number = 3000): Promise<void> {
    const waitTime = Math.floor(Math.random() * (max - min)) + min;
    console.log(`⏰ ${waitTime}ms 대기 중...`);
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
      waitUntil = "networkidle",
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
          hover: Math.random() > 0.5,
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

  /**
   * 네이버 로그인에 최적화된 안전한 클릭
   */
  async safeNaverClick(
    page: Page,
    selector: string,
    options: {
      timeout?: number;
      waitAfter?: number;
    } = {}
  ): Promise<void> {
    const { timeout = 10000, waitAfter = 2000 } = options;

    try {
      console.log(`🖱️ 네이버 요소 클릭: ${selector}`);

      // 요소가 보일 때까지 대기
      await page.waitForSelector(selector, { timeout, state: "visible" });

      // 자연스러운 클릭 시뮬레이션
      const element = page.locator(selector).first();

      // 1. 요소로 마우스 이동
      await element.hover();
      await this.randomWait(300, 800);

      // 2. 클릭 전 마지막 확인
      await this.randomWait(200, 500);

      // 3. 클릭
      await element.click();

      // 4. 클릭 후 대기
      await this.randomWait(waitAfter, waitAfter + 1000);
    } catch (error) {
      console.error(`❌ 네이버 클릭 실패: ${selector}`, error);
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
