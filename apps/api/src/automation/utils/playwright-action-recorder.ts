import { Page, Browser, BrowserContext } from "playwright";
import * as fs from "fs";
import * as path from "path";

interface DetailedAction {
  id: string;
  type:
    | "navigate"
    | "click"
    | "type"
    | "hover"
    | "scroll"
    | "keypress"
    | "wait"
    | "focus"
    | "blur";
  startTime: number;
  endTime: number;
  duration: number;
  selector?: string;
  text?: string;
  url?: string;
  coordinates?: { x: number; y: number };
  keyCode?: string;
  scrollDelta?: { deltaX: number; deltaY: number };
  elementInfo?: {
    tagName: string;
    textContent?: string;
    attributes: Record<string, string>;
  };
  pageInfo: {
    url: string;
    title: string;
    viewport: { width: number; height: number };
  };
  performanceMetrics?: {
    loadTime?: number;
    domContentLoaded?: number;
    networkRequests?: number;
  };
}

interface RecordingSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalDuration?: number;
  actions: DetailedAction[];
  statistics: {
    totalActions: number;
    clickCount: number;
    typeCount: number;
    navigationCount: number;
    averageActionDuration: number;
    totalIdleTime: number;
  };
  browserInfo: {
    userAgent: string;
    platform: string;
    viewport: { width: number; height: number };
  };
}

export class PlaywrightActionRecorder {
  private page: Page | null = null;
  private context: BrowserContext | null = null;
  private browser: Browser | null = null;
  private currentSession: RecordingSession | null = null;
  private isRecording: boolean = false;
  private actionIdCounter: number = 0;
  private lastActionTime: number = 0;
  private recordingsDir: string;

  constructor(recordingsDir: string = "./detailed-recordings") {
    this.recordingsDir = recordingsDir;
    this.ensureRecordingsDirectory();
  }

  private ensureRecordingsDirectory(): void {
    if (!fs.existsSync(this.recordingsDir)) {
      fs.mkdirSync(this.recordingsDir, { recursive: true });
    }
  }

  private generateActionId(): string {
    return `action_${++this.actionIdCounter}_${Date.now()}`;
  }

  async startDetailedRecording(initialUrl?: string): Promise<Page> {
    console.log("상세 네비게이터 기록 시작...");

    const { chromium } = require("playwright");

    this.browser = await chromium.launch({
      headless: false,
      slowMo: 0, // 실제 속도로 기록
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-first-run",
        "--enable-automation",
      ],
    });

    this.context =
      (await this.browser?.newContext({
        recordVideo: {
          dir: path.join(this.recordingsDir, "videos"),
          size: { width: 1920, height: 1080 },
        },
      })) || null;

    this.page = (await this.context?.newPage()) || null;

    // 기록 세션 초기화
    const startTime = Date.now();
    this.currentSession = {
      sessionId: `session_${startTime}`,
      startTime: startTime,
      actions: [],
      statistics: {
        totalActions: 0,
        clickCount: 0,
        typeCount: 0,
        navigationCount: 0,
        averageActionDuration: 0,
        totalIdleTime: 0,
      },
      browserInfo: {
        userAgent: (await this.page?.evaluate(() => navigator.userAgent)) || "",
        platform: (await this.page?.evaluate(() => navigator.platform)) || "",
        viewport: this.page?.viewportSize() || { width: 1920, height: 1080 },
      },
    };

    this.lastActionTime = startTime;
    this.isRecording = true;

    // 상세 이벤트 리스너 설정
    await this.setupDetailedEventListeners();

    if (initialUrl) {
      await this.recordNavigation(initialUrl, async () => {
        await this.page!.goto(initialUrl, { waitUntil: "networkidle" });
      });
    }

    console.log(`기록 세션 시작됨: ${this.currentSession.sessionId}`);
    return this.page!;
  }

  private async setupDetailedEventListeners(): Promise<void> {
    if (!this.page) return;

    // 클릭 이벤트 상세 기록
    await this.page.addInitScript(() => {
      let clickStartTime: number;

      document.addEventListener("mousedown", (event) => {
        clickStartTime = Date.now();
      });

      document.addEventListener("click", (event) => {
        const endTime = Date.now();
        const target = event.target as Element;

        const elementInfo = {
          tagName: target.tagName,
          textContent: target.textContent?.trim().substring(0, 100),
          attributes: {},
        };

        // 속성 정보 수집
        for (let i = 0; i < target.attributes.length; i++) {
          const attr = target.attributes[i];
          (elementInfo.attributes as Record<string, string>)[attr.name] =
            attr.value;
        }

        (window as any).__detailedActions =
          (window as any).__detailedActions || [];
        (window as any).__detailedActions.push({
          type: "click",
          startTime: clickStartTime || endTime - 50,
          endTime: endTime,
          duration: endTime - (clickStartTime || endTime - 50),
          selector: generateSelector(target),
          coordinates: { x: event.clientX, y: event.clientY },
          elementInfo: elementInfo,
        });
      });

      // 타이핑 이벤트 상세 기록
      let typingStartTime: number;
      let currentInputTarget: Element | null = null;

      document.addEventListener("focusin", (event) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          typingStartTime = Date.now();
          currentInputTarget = event.target;
        }
      });

      document.addEventListener("input", (event) => {
        if (
          event.target instanceof HTMLInputElement ||
          event.target instanceof HTMLTextAreaElement
        ) {
          const endTime = Date.now();
          const target = event.target;

          (window as any).__detailedActions =
            (window as any).__detailedActions || [];
          (window as any).__detailedActions.push({
            type: "type",
            startTime: typingStartTime || endTime - 100,
            endTime: endTime,
            duration: endTime - (typingStartTime || endTime - 100),
            selector: generateSelector(target),
            text: target.value,
            elementInfo: {
              tagName: target.tagName,
              attributes: {
                type: target.type,
                name: target.name,
                placeholder: target.placeholder,
              },
            },
          });

          typingStartTime = endTime; // 다음 입력을 위해 시간 업데이트
        }
      });

      // 스크롤 이벤트 기록
      let scrollStartTime: number;
      document.addEventListener("wheel", (event) => {
        const currentTime = Date.now();
        if (!scrollStartTime || currentTime - scrollStartTime > 100) {
          scrollStartTime = currentTime;
        }

        (window as any).__detailedActions =
          (window as any).__detailedActions || [];
        (window as any).__detailedActions.push({
          type: "scroll",
          startTime: scrollStartTime,
          endTime: currentTime,
          duration: currentTime - scrollStartTime,
          scrollDelta: { deltaX: event.deltaX, deltaY: event.deltaY },
          coordinates: { x: event.clientX, y: event.clientY },
        });
      });

      // 키보드 이벤트 기록
      document.addEventListener("keydown", (event) => {
        const startTime = Date.now();

        (window as any).__detailedActions =
          (window as any).__detailedActions || [];
        (window as any).__detailedActions.push({
          type: "keypress",
          startTime: startTime,
          endTime: startTime + 50, // 키 누름은 보통 짧음
          duration: 50,
          keyCode: event.code,
          text: event.key,
        });
      });

      // 호버 이벤트 기록
      let hoverStartTime: number;
      let currentHoverTarget: Element | null = null;

      document.addEventListener(
        "mouseenter",
        (event) => {
          hoverStartTime = Date.now();
          currentHoverTarget = event.target as Element;
        },
        true,
      );

      document.addEventListener(
        "mouseleave",
        (event) => {
          if (currentHoverTarget === event.target) {
            const endTime = Date.now();

            (window as any).__detailedActions =
              (window as any).__detailedActions || [];
            (window as any).__detailedActions.push({
              type: "hover",
              startTime: hoverStartTime,
              endTime: endTime,
              duration: endTime - hoverStartTime,
              selector: generateSelector(event.target as Element),
              elementInfo: {
                tagName: (event.target as Element).tagName,
                textContent: (event.target as Element).textContent
                  ?.trim()
                  .substring(0, 50),
              },
            });
          }
        },
        true,
      );

      // 선택자 생성 함수
      function generateSelector(element: Element): string {
        if (element.id) return `#${element.id}`;

        if (element.getAttribute("data-testid")) {
          return `[data-testid="${element.getAttribute("data-testid")}"]`;
        }

        if (element.className && typeof element.className === "string") {
          const classes = element.className
            .split(" ")
            .filter((c) => c && !c.includes(" "));
          if (classes.length > 0) {
            return `.${classes.slice(0, 3).join(".")}`;
          }
        }

        const tagName = element.tagName.toLowerCase();
        const parent = element.parentElement;

        if (parent && parent !== document.body) {
          const siblings = Array.from(parent.children).filter(
            (child) => child.tagName === element.tagName,
          );
          if (siblings.length > 1) {
            const index = siblings.indexOf(element) + 1;
            return `${generateSelector(parent)} > ${tagName}:nth-of-type(${index})`;
          } else {
            return `${generateSelector(parent)} > ${tagName}`;
          }
        }

        return tagName;
      }
    });

    // 페이지 네비게이션 이벤트
    this.page.on("framenavigated", async (frame) => {
      if (frame === this.page!.mainFrame()) {
        await this.recordNavigation(frame.url(), () => Promise.resolve());
      }
    });

    // 정기적으로 브라우저 액션 수집
    setInterval(async () => {
      if (this.isRecording) {
        await this.collectAndRecordBrowserActions();
      }
    }, 1000); // 1초마다 수집
  }

  private async recordNavigation(
    url: string,
    navigationFunction: () => Promise<void>,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      await navigationFunction();

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 페이지 성능 메트릭 수집
      const performanceMetrics = await this.page!.evaluate(() => {
        const perfTiming = performance.timing;
        return {
          loadTime: perfTiming.loadEventEnd - perfTiming.navigationStart,
          domContentLoaded:
            perfTiming.domContentLoadedEventEnd - perfTiming.navigationStart,
          networkRequests: performance.getEntriesByType("navigation").length,
        };
      });

      const action: DetailedAction = {
        id: this.generateActionId(),
        type: "navigate",
        startTime,
        endTime,
        duration,
        url,
        pageInfo: {
          url: this.page!.url(),
          title: await this.page!.title(),
          viewport: this.page!.viewportSize() || { width: 1920, height: 1080 },
        },
        performanceMetrics,
      };

      this.recordAction(action);
    } catch (error) {
      console.error("네비게이션 기록 중 오류:", error);
    }
  }

  private async collectAndRecordBrowserActions(): Promise<void> {
    if (!this.page) return;

    try {
      const browserActions = await this.page.evaluate(() => {
        const actions = (window as any).__detailedActions || [];
        (window as any).__detailedActions = [];
        return actions;
      });

      for (const action of browserActions) {
        const detailedAction: DetailedAction = {
          id: this.generateActionId(),
          type: action.type,
          startTime: action.startTime,
          endTime: action.endTime,
          duration: action.duration,
          selector: action.selector,
          text: action.text,
          coordinates: action.coordinates,
          keyCode: action.keyCode,
          scrollDelta: action.scrollDelta,
          elementInfo: action.elementInfo,
          pageInfo: {
            url: this.page.url(),
            title: await this.page.title(),
            viewport: this.page.viewportSize() || { width: 1920, height: 1080 },
          },
        };

        this.recordAction(detailedAction);
      }
    } catch (error) {
      console.error("브라우저 액션 수집 중 오류:", error);
    }
  }

  private recordAction(action: DetailedAction): void {
    if (!this.isRecording || !this.currentSession) return;

    // 통계 업데이트
    this.currentSession.statistics.totalActions++;

    switch (action.type) {
      case "click":
        this.currentSession.statistics.clickCount++;
        break;
      case "type":
        this.currentSession.statistics.typeCount++;
        break;
      case "navigate":
        this.currentSession.statistics.navigationCount++;
        break;
    }

    // 대기 시간 계산 (이전 액션과의 간격)
    if (this.lastActionTime > 0) {
      const idleTime = action.startTime - this.lastActionTime;
      if (idleTime > 0) {
        this.currentSession.statistics.totalIdleTime += idleTime;

        // 대기 시간이 500ms 이상이면 wait 액션으로 기록
        if (idleTime >= 500) {
          const waitAction: DetailedAction = {
            id: this.generateActionId(),
            type: "wait",
            startTime: this.lastActionTime,
            endTime: action.startTime,
            duration: idleTime,
            pageInfo: action.pageInfo,
          };
          this.currentSession.actions.push(waitAction);
        }
      }
    }

    this.currentSession.actions.push(action);
    this.lastActionTime = action.endTime;

    console.log(
      `액션 기록: ${action.type} (${action.duration}ms) - ${action.selector || action.url || action.keyCode || "N/A"}`,
    );
  }

  async stopDetailedRecording(): Promise<string> {
    console.log("상세 기록 중지 및 저장 중...");

    if (!this.currentSession) {
      throw new Error("활성 기록 세션이 없습니다");
    }

    // 마지막 브라우저 액션 수집
    await this.collectAndRecordBrowserActions();

    const endTime = Date.now();
    this.currentSession.endTime = endTime;
    this.currentSession.totalDuration = endTime - this.currentSession.startTime;

    // 평균 액션 지속시간 계산
    const actionDurations = this.currentSession.actions
      .filter((action) => action.type !== "wait")
      .map((action) => action.duration);

    this.currentSession.statistics.averageActionDuration =
      actionDurations.length > 0
        ? actionDurations.reduce((sum, duration) => sum + duration, 0) /
          actionDurations.length
        : 0;

    this.isRecording = false;

    // 상세 분석 리포트 생성
    const analysisReport = this.generateAnalysisReport(this.currentSession);

    // 파일 저장
    const sessionFilename = `${this.currentSession.sessionId}_detailed.json`;
    const sessionFilepath = path.join(this.recordingsDir, sessionFilename);

    const reportFilename = `${this.currentSession.sessionId}_analysis.json`;
    const reportFilepath = path.join(this.recordingsDir, reportFilename);

    fs.writeFileSync(
      sessionFilepath,
      JSON.stringify(this.currentSession, null, 2),
    );
    fs.writeFileSync(reportFilepath, JSON.stringify(analysisReport, null, 2));

    // 타임라인 CSV 생성
    const timelineCsv = this.generateTimelineCSV(this.currentSession);
    const csvFilepath = path.join(
      this.recordingsDir,
      `${this.currentSession.sessionId}_timeline.csv`,
    );
    fs.writeFileSync(csvFilepath, timelineCsv);

    console.log(`상세 기록 저장 완료:`);
    console.log(`- 세션 데이터: ${sessionFilepath}`);
    console.log(`- 분석 리포트: ${reportFilepath}`);
    console.log(`- 타임라인 CSV: ${csvFilepath}`);

    if (this.browser) {
      await this.browser.close();
    }

    return sessionFilepath;
  }

  private generateAnalysisReport(session: RecordingSession) {
    const actions = session.actions.filter((action) => action.type !== "wait");
    const waitActions = session.actions.filter(
      (action) => action.type === "wait",
    );

    return {
      sessionSummary: {
        sessionId: session.sessionId,
        totalDuration: `${(session.totalDuration! / 1000).toFixed(2)}초`,
        totalActions: session.statistics.totalActions,
        activeTime: `${((session.totalDuration! - session.statistics.totalIdleTime) / 1000).toFixed(2)}초`,
        idleTime: `${(session.statistics.totalIdleTime / 1000).toFixed(2)}초`,
        activityRatio: `${(((session.totalDuration! - session.statistics.totalIdleTime) / session.totalDuration!) * 100).toFixed(1)}%`,
      },
      actionBreakdown: {
        clicks: session.statistics.clickCount,
        typing: session.statistics.typeCount,
        navigation: session.statistics.navigationCount,
        hovers: actions.filter((a) => a.type === "hover").length,
        scrolls: actions.filter((a) => a.type === "scroll").length,
        keypresses: actions.filter((a) => a.type === "keypress").length,
        waits: waitActions.length,
      },
      timingAnalysis: {
        averageActionDuration: `${session.statistics.averageActionDuration.toFixed(2)}ms`,
        longestAction: this.findLongestAction(actions),
        shortestAction: this.findShortestAction(actions),
        averageWaitTime:
          waitActions.length > 0
            ? `${(waitActions.reduce((sum, action) => sum + action.duration, 0) / waitActions.length).toFixed(2)}ms`
            : "0ms",
      },
      pageAnalysis: {
        uniquePages: [...new Set(actions.map((action) => action.pageInfo.url))],
        totalPageChanges: session.statistics.navigationCount,
      },
    };
  }

  private findLongestAction(actions: DetailedAction[]) {
    const longest = actions.reduce(
      (max, action) => (action.duration > max.duration ? action : max),
      actions[0],
    );
    return longest
      ? {
          type: longest.type,
          duration: `${longest.duration}ms`,
          selector: longest.selector || longest.url || longest.keyCode,
        }
      : null;
  }

  private findShortestAction(actions: DetailedAction[]) {
    const shortest = actions.reduce(
      (min, action) => (action.duration < min.duration ? action : min),
      actions[0],
    );
    return shortest
      ? {
          type: shortest.type,
          duration: `${shortest.duration}ms`,
          selector: shortest.selector || shortest.url || shortest.keyCode,
        }
      : null;
  }

  private generateTimelineCSV(session: RecordingSession): string {
    const headers = [
      "Action ID",
      "Type",
      "Start Time (ms)",
      "End Time (ms)",
      "Duration (ms)",
      "Relative Start (s)",
      "Selector",
      "Text/URL",
      "Page URL",
      "Coordinates",
    ];

    const rows = session.actions.map((action) => [
      action.id,
      action.type,
      action.startTime,
      action.endTime,
      action.duration,
      ((action.startTime - session.startTime) / 1000).toFixed(3),
      action.selector || "",
      action.text || action.url || action.keyCode || "",
      action.pageInfo.url,
      action.coordinates
        ? `${action.coordinates.x},${action.coordinates.y}`
        : "",
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }

  getSavedRecordings(): string[] {
    return fs
      .readdirSync(this.recordingsDir)
      .filter((file) => file.includes("_detailed.json"))
      .map((file) => path.join(this.recordingsDir, file));
  }
}
