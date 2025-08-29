export interface ViewportConfiguration {
  width: number;
  height: number;
}

export interface ChromiumLaunchOptions {
  headless?: boolean;
  slowMotionDelay?: number;
  navigationTimeout?: number;
  maxConcurrentPages?: number;
}

export interface StealthPageSettings {
  viewport?: ViewportConfiguration;
  userAgent?: string;
  locale?: string;
  timezone?: string;
  extraHeaders?: Record<string, string>;
}

export interface AntiDetectionFeatures {
  spoofWebdriver: boolean;
  maskAutomationSignals: boolean;
  simulatePlugins: boolean;
  randomizeFingerprint: boolean;
}

export interface PageNavigationOptions {
  waitStrategy?: 'load' | 'domcontentloaded' | 'networkidle';
  timeout?: number;
  referer?: string;
  simulateHumanBehavior?: boolean;
}

export interface BrowserSessionStatus {
  isActive: boolean;
  activePagesCount: number;
  isTerminating: boolean;
}