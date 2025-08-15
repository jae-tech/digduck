import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { getApiUrl, isDevelopment, getCurrentConfig } from "@/config/env";

// API 에러 타입 정의
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

// API 응답 래퍼 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp?: string;
}

// 현재 환경 설정 가져오기
const currentConfig = getCurrentConfig();

// Vite 환경 정보 출력 (개발환경에서만)
if (isDevelopment()) {
  console.log("🔧 Vite 환경 감지:", {
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    apiUrl: import.meta.env.VITE_API_URL,
    appEnv: import.meta.env.VITE_APP_ENV,
  });
}

// Axios 인스턴스 생성
export const apiClient = axios.create({
  baseURL: getApiUrl(),
  timeout: currentConfig.TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    // Vite 앱 정보 헤더
    "X-App-Version": import.meta.env.VITE_APP_VERSION || "1.0.0",
    "X-Build-Mode": import.meta.env.MODE,
  },
  withCredentials: false,
});

// 로깅 여부 결정
const shouldLog = isDevelopment() || currentConfig.LOG_LEVEL === "debug";

// 요청 인터셉터
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (shouldLog) {
      console.log(`🚀 [${import.meta.env.MODE}] API 요청:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        data: config.data,
        params: config.params,
      });
    }

    // API 키 추가 (Vite 환경변수에서)
    const apiKey = import.meta.env.VITE_API_KEY;
    if (apiKey) {
      config.headers["X-API-Key"] = apiKey;
    }

    // 인증 토큰 추가
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 요청 시작 시간 기록
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    if (shouldLog) {
      console.error("❌ 요청 인터셉터 오류:", error);
    }
    return Promise.reject(error);
  }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (shouldLog) {
      const endTime = new Date();
      const startTime = response.config.metadata?.startTime;
      const duration = startTime ? endTime.getTime() - startTime.getTime() : 0;

      console.log(`✅ [${import.meta.env.MODE}] API 응답:`, {
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
        duration: `${duration}ms`,
        dataSize: `${(JSON.stringify(response.data).length / 1024).toFixed(2)}KB`,
      });
    }

    return response;
  },
  (error: AxiosError) => {
    if (shouldLog) {
      const endTime = new Date();
      const startTime = error.config?.metadata?.startTime;
      const duration = startTime ? endTime.getTime() - startTime.getTime() : 0;

      console.error(`❌ [${import.meta.env.MODE}] API 오류:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        duration: `${duration}ms`,
        message: error.message,
        data: error.response?.data,
      });
    }

    // 커스텀 에러 객체 생성
    const apiError: ApiError = {
      message: getErrorMessage(error),
      status: error.response?.status,
      code: error.response?.data?.code || error.code,
      details: error.response?.data,
    };

    // 환경별 에러 처리
    handleErrorByEnvironment(error);

    return Promise.reject(apiError);
  }
);

// 인증 토큰 가져오기
const getAuthToken = (): string | null => {
  const storageKey = isDevelopment() ? "dev_auth_token" : "auth_token";
  return localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);
};

// 환경별 에러 처리
const handleErrorByEnvironment = (error: AxiosError) => {
  const status = error.response?.status;

  if (status === 401) {
    handleUnauthorized();
  } else if (status === 403) {
    if (isDevelopment()) {
      console.warn(`⚠️ [${import.meta.env.MODE}] 접근 권한이 없습니다`);
    }
  } else if (status && status >= 500) {
    if (isDevelopment()) {
      console.error(`🔥 [${import.meta.env.MODE}] 서버 오류:`, {
        url: error.config?.url,
        status,
        data: error.response?.data,
      });
    } else {
      console.error("서버에 일시적인 문제가 발생했습니다");
    }
  }
};

// 에러 메시지 추출
const getErrorMessage = (error: AxiosError): string => {
  if (error.response?.data) {
    const data = error.response.data as any;

    if (typeof data === "string") return data;
    if (data.message) return data.message;
    if (data.error) return data.error;
    if (data.detail) return data.detail;
  }

  const status = error.response?.status;
  const mode = import.meta.env.MODE;
  const isDevMode = isDevelopment();

  switch (status) {
    case 400:
      return isDevMode
        ? `[${mode}] 잘못된 요청: ${error.config?.url}`
        : "잘못된 요청입니다. 입력 정보를 확인해주세요.";
    case 401:
      return isDevMode
        ? `[${mode}] 인증 실패 - 토큰 확인 필요`
        : "인증이 필요합니다. 다시 로그인해주세요.";
    case 403:
      return isDevMode ? `[${mode}] 접근 권한 없음` : "접근 권한이 없습니다.";
    case 404:
      return isDevMode
        ? `[${mode}] API 엔드포인트 없음: ${error.config?.url}`
        : "요청한 리소스를 찾을 수 없습니다.";
    case 500:
      return isDevMode
        ? `[${mode}] 서버 내부 오류 - API 서버(${getApiUrl()}) 확인 필요`
        : "서버 내부 오류가 발생했습니다.";
    default:
      if (error.code === "ECONNABORTED") {
        return isDevMode
          ? `[${mode}] 타임아웃 - API 응답 시간 초과 (${currentConfig.TIMEOUT}ms)`
          : "요청 시간이 초과되었습니다.";
      }
      if (error.code === "ERR_NETWORK") {
        return isDevMode
          ? `[${mode}] 네트워크 오류 - ${getApiUrl()} 서버 연결 확인`
          : "네트워크 연결 오류가 발생했습니다.";
      }
      return isDevMode
        ? `[${mode}] ${error.message}`
        : "알 수 없는 오류가 발생했습니다.";
  }
};

// 인증 오류 처리
const handleUnauthorized = () => {
  const storageKey = isDevelopment() ? "dev_auth_token" : "auth_token";
  localStorage.removeItem(storageKey);
  sessionStorage.removeItem(storageKey);

  if (isDevelopment()) {
    console.warn(`⚠️ [${import.meta.env.MODE}] 인증 토큰이 제거되었습니다`);
  }
};

// 헬퍼 함수들
export const apiHelpers = {
  // GET 요청
  get: async <T = any>(url: string, params?: any): Promise<T> => {
    const response = await apiClient.get<T>(url, { params });
    return response.data;
  },

  // POST 요청
  post: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.post<T>(url, data);
    return response.data;
  },

  // PUT 요청
  put: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.put<T>(url, data);
    return response.data;
  },

  // PATCH 요청
  patch: async <T = any>(url: string, data?: any): Promise<T> => {
    const response = await apiClient.patch<T>(url, data);
    return response.data;
  },

  // DELETE 요청
  delete: async <T = any>(url: string): Promise<T> => {
    const response = await apiClient.delete<T>(url);
    return response.data;
  },

  // 파일 업로드
  upload: async <T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<T> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<T>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  // 파일 다운로드
  download: async (url: string, filename?: string): Promise<void> => {
    const response = await apiClient.get(url, {
      responseType: "blob",
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  // 환경 정보 가져오기
  getEnvInfo: () => ({
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    apiUrl: import.meta.env.VITE_API_URL,
    appEnv: import.meta.env.VITE_APP_ENV,
  }),
};

// 타입 확장
declare module "axios" {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: Date;
    };
  }
}

// 개발 환경에서 글로벌 디버깅 정보 제공
if (isDevelopment()) {
  window.__APP_ENV__ = import.meta.env;
  window.__DEV__ = true;

  console.log("🛠️ 개발 도구:", {
    env: "window.__APP_ENV__에서 환경변수 확인 가능",
    apiClient: "window.apiClient에서 API 클라이언트 접근 가능",
  });

  // 전역에서 접근 가능하도록 설정
  (window as any).apiClient = apiClient;
  (window as any).apiHelpers = apiHelpers;
}

export default apiClient;
