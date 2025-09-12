/**
 * Axios 공용 인스턴스
 * - baseURL, 공통 헤더, 인터셉터(토큰/에러로깅) 등을 한 곳에서 관리
 * - 다른 서비스 모듈이 http 인스턴스를 import해 사용
 */
import axios from "axios";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // .env: VITE_API_URL=https://api.example.com
  withCredentials: true,                 // 쿠키/세션 필요 시
});

// 필요하면 여기서 요청/응답 인터셉터를 추가
// http.interceptors.request.use(cfg => { ...; return cfg; });
// http.interceptors.response.use(res => res, err => { ...; return Promise.reject(err); });
