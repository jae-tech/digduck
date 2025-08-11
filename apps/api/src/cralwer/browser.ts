import { chromium, Browser, Page } from "playwright";

let browserInstance: Browser | null = null;
let isClosing: boolean = false;

const USER_AGENTS = [
  // Windows Chrome
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",

  // Mac Chrome
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",

  // Firefox
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/119.0",

  // Edge
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",

  // Safari
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15",
];

// User-Agent 랜덤 선택
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export async function getBrowser(): Promise<Browser> {
  if (!browserInstance) {
    browserInstance = await chromium.launch({
      headless: process.env.NODE_ENV === "production",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=VizDisplayCompositor",
        "--disable-web-security",
        "--disable-features=site-per-process",
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ],
      // 느린 동작으로 사람처럼 보이기
      slowMo: Math.random() * 1000 + 500, // 500-1500ms 랜덤 지연
    });
  }
  isClosing = false;

  return browserInstance;
}

export async function closeBrowser() {
  if (browserInstance && !isClosing) {
    isClosing = true;
    try {
      await browserInstance.close();
      console.log("브라우저 정상 종료됨");
    } catch (error) {
      console.error("브라우저 종료 중 오류:", error);
    } finally {
      browserInstance = null;
      isClosing = false;
    }
  }
}

export async function setupPageStealth(page: Page): Promise<void> {
  const userAgent = getRandomUserAgent();
  console.log("사용할 User-Agent:", userAgent);

  // 1. User-Agent 및 기본 헤더 설정
  await page.setExtraHTTPHeaders({
    "User-Agent": userAgent,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "max-age=0",
    "sec-ch-ua":
      '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
    Connection: "keep-alive",
    DNT: "1",
  });

  // 2. 뷰포트 설정 (일반적인 해상도들)
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 1536, height: 864 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
  ];
  const randomViewport =
    viewports[Math.floor(Math.random() * viewports.length)];
  await page.setViewportSize(randomViewport);

  // 3. 자동화 탐지 스크립트 제거 및 속성 조작
  await page.addInitScript(() => {
    // webdriver 속성 완전 제거
    Object.defineProperty(navigator, "webdriver", {
      get: () => undefined,
    });

    // languages 설정
    Object.defineProperty(navigator, "languages", {
      get: () => ["ko-KR", "ko", "en-US", "en"],
    });

    // plugins 배열 설정 (빈 배열이면 의심받음)
    Object.defineProperty(navigator, "plugins", {
      get: () => [
        {
          0: {
            type: "application/x-google-chrome-pdf",
            suffixes: "pdf",
            description: "Portable Document Format",
            enabledPlugin: Plugin,
          },
          description: "Portable Document Format",
          filename: "internal-pdf-viewer",
          length: 1,
          name: "Chrome PDF Plugin",
        },
        {
          0: {
            type: "application/pdf",
            suffixes: "pdf",
            description: "",
            enabledPlugin: Plugin,
          },
          description: "",
          filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
          length: 1,
          name: "Chrome PDF Viewer",
        },
      ],
    });

    // permissions 쿼리 조작
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) =>
      parameters.name === "notifications"
        ? Promise.resolve({
            state: Notification.permission,
            onchange: null,
            addEventListener: () => {},
            removeEventListener: () => {},
            dispatchEvent: () => false,
            name: "notifications",
          } as PermissionStatus)
        : originalQuery(parameters);

    // Chrome 객체 설정
    window.chrome = {
      runtime: {},
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
    };

    // iframe 검사 방지
    Object.defineProperty(HTMLIFrameElement.prototype, "contentWindow", {
      get: function () {
        return window;
      },
    });

    // toString 함수 조작
    window.navigator.toString = function () {
      return "[object Navigator]";
    };
  });

  // 4. 쿠키 및 로컬 스토리지 설정 (선택사항)
  await page.addInitScript(() => {
    // 일반적인 쿠키 설정 시뮬레이션
    localStorage.setItem("language", "ko-KR");
    localStorage.setItem("timezone", "Asia/Seoul");
  });
}

// 사람처럼 행동하는 함수들
export async function humanLikeBehavior(page: Page): Promise<void> {
  // 1. 랜덤한 마우스 움직임
  const randomX = Math.floor(Math.random() * 800) + 100;
  const randomY = Math.floor(Math.random() * 600) + 100;
  await page.mouse.move(randomX, randomY, { steps: 10 });

  // 2. 랜덤 스크롤
  const scrollDistance = Math.floor(Math.random() * 300) + 100;
  await page.evaluate((distance) => {
    window.scrollBy(0, distance);
  }, scrollDistance);

  // 3. 랜덤 대기
  const waitTime = Math.floor(Math.random() * 2000) + 1000; // 1-3초
  await page.waitForTimeout(waitTime);

  // 4. 가끔 뒤로가기/앞으로가기 시뮬레이션 (10% 확률)
  if (Math.random() < 0.1) {
    await page.keyboard.press("F5"); // 새로고침
    await page.waitForTimeout(2000);
  }
}
