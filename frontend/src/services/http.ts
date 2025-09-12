// src/services/http.ts
import axios from "axios";

/**
 * .env 파일에 VITE_API_URL을 넣어주세요.
 * 예) VITE_API_URL=http://localhost:8080
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  withCredentials: true,
});

// 필요 시 인터셉터(토큰/에러 로깅 등) 추가
// http.interceptors.request.use(cfg => cfg);
// http.interceptors.response.use(res => res, err => Promise.reject(err));
