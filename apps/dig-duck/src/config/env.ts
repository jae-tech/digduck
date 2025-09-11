interface EnvConfig {
  API_URL: string;
  NODE_ENV: string;
  APP_ENV: "development" | "staging" | "production";
  LOG_LEVEL: "debug" | "info" | "warn" | "error";
  ENABLE_DEVTOOLS: boolean;
}

// Vite 환경변수 타입 정의
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_ENV: "development" | "staging" | "production";
  readonly VITE_LOG_LEVEL: "debug" | "info" | "warn" | "error";
  readonly VITE_ENABLE_DEVTOOLS: string;
  readonly MODE: string;
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly SSR: boolean;
}

// Vite 환경변수 가져오기 함수
const getViteEnv = (): EnvConfig => {
  const meta = import.meta.env;

  return {
    API_URL: meta.VITE_API_URL || "http://localhost:8080",
    NODE_ENV: meta.MODE || "development",
    APP_ENV: (meta.VITE_APP_ENV as EnvConfig["APP_ENV"]) || "development",
    LOG_LEVEL: (meta.VITE_LOG_LEVEL as EnvConfig["LOG_LEVEL"]) || "debug",
    ENABLE_DEVTOOLS: meta.VITE_ENABLE_DEVTOOLS === "true" || meta.DEV,
  };
};

// 환경설정 객체
export const env = getViteEnv();

// 환경변수 검증
const validateEnv = () => {
  const requiredVars = ["VITE_API_URL"];
  const missing = requiredVars.filter(
    (key) => !import.meta.env[key as keyof ImportMetaEnv],
  );

  if (missing.length > 0) {
    console.error("❌ 필수 환경변수가 설정되지 않았습니다:", missing);
    console.error("💡 .env 파일을 확인하거나 다음 변수들을 설정해주세요:");
    missing.forEach((key) => console.error(`   - ${key}`));
  }
};

// 개발 환경에서 검증 실행
if (env.NODE_ENV === "development") {
  validateEnv();
}

// 유틸리티 함수들
export const getApiUrl = (): string => {
  const url = env.API_URL;
  if (!url) {
    throw new Error(
      "VITE_API_URL이 설정되지 않았습니다. .env 파일을 확인해주세요.",
    );
  }
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

export const isDevelopment = (): boolean => {
  return import.meta.env.DEV || env.NODE_ENV === "development";
};

export const isProduction = (): boolean => {
  return import.meta.env.PROD || env.NODE_ENV === "production";
};

export const isStaging = (): boolean => {
  return env.APP_ENV === "staging";
};

export const shouldEnableDevtools = (): boolean => {
  return env.ENABLE_DEVTOOLS && (isDevelopment() || isStaging());
};

// 환경별 설정
export const envConfig = {
  development: {
    API_URL: "http://localhost:8000",
    LOG_LEVEL: "debug" as const,
    ENABLE_DEVTOOLS: true,
    TIMEOUT: 1000000,
    RETRY_COUNT: 3,
  },
  staging: {
    API_URL: "https://staging-api.your-domain.com",
    LOG_LEVEL: "info" as const,
    ENABLE_DEVTOOLS: true,
    TIMEOUT: 30000,
    RETRY_COUNT: 2,
  },
  production: {
    API_URL: "https://api.your-domain.com",
    LOG_LEVEL: "error" as const,
    ENABLE_DEVTOOLS: false,
    TIMEOUT: 30000,
    RETRY_COUNT: 1,
  },
};

export const getCurrentConfig = () => {
  return envConfig[env.APP_ENV] || envConfig.development;
};

// 개발 환경에서 환경 정보 출력
if (isDevelopment()) {
  console.log("🌍 Vite 환경 설정:", {
    MODE: import.meta.env.MODE,
    DEV: import.meta.env.DEV,
    PROD: import.meta.env.PROD,
    API_URL: env.API_URL,
    APP_ENV: env.APP_ENV,
    LOG_LEVEL: env.LOG_LEVEL,
    ENABLE_DEVTOOLS: env.ENABLE_DEVTOOLS,
  });

  console.log("📋 사용 가능한 환경변수:", Object.keys(import.meta.env));
}
