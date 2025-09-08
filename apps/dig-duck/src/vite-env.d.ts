/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_ENV: "development" | "staging" | "production";
  readonly VITE_LOG_LEVEL: "debug" | "info" | "warn" | "error";
  readonly VITE_ENABLE_DEVTOOLS: string;
  readonly VITE_API_KEY?: string;
  readonly VITE_APP_VERSION?: string;
  readonly VITE_BUILD_TIME?: string;
  // 필요한 다른 환경변수들 추가
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// 추가 글로벌 타입 정의
declare global {
  interface Window {
    __APP_ENV__: ImportMetaEnv;
    __DEV__: boolean;
    __TAURI__: any;
  }
}

export {};
