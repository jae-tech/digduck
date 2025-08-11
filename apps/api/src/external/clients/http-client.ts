import axios from "axios";

export const httpClient = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터 - 인증 토큰 자동 추가
httpClient.interceptors.request.use((config) => {
  const token = process.env.API_TOKEN;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
