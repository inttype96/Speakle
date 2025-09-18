import axios, { AxiosError} from "axios";
import { useAuthStore, getAccessToken } from "@/store/auth";

// AxiosRequestConfig에 커스텀 플래그(_retry) 사용하려면 타입 보강
declare module "axios" {
  export interface AxiosRequestConfig {
    _retry?: boolean;
  }
}

export const http = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

// 요청 인터셉터: accessToken 자동 부착
http.interceptors.request.use((config) => {
  const token = getAccessToken();
  const authState = useAuthStore.getState();
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`);
  console.log('[HTTP] Auth state tokens:', authState.tokens ? 'present' : 'null');
  console.log('[HTTP] localStorage auth-storage:', localStorage.getItem('auth-storage') ? 'present' : 'null');

  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`[HTTP] 토큰 부착됨:`, token.substring(0, 20) + '...');
  } else {
    console.log(`[HTTP] 토큰 없음 - token:`, token);
    console.log(`[HTTP] Auth state:`, authState);
  }
  
  if (isFormData) {
      // FormData면 Content-Type 제거 (브라우저가 boundary 포함 자동 설정)
      if (config.headers) delete (config.headers as any)["Content-Type"];
    } else {
      // JSON이면 Content-Type을 application/json으로
      if (config.headers && !config.headers["Content-Type"]) {
        (config.headers as any)["Content-Type"] = "application/json";
      }
    }
    return config;
});

// 응답 인터셉터: 401 처리 (refresh API가 있을 때만 작동)
let isRefreshing = false;
let queue: Array<() => void> = [];

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const { response, config } = error;
    if (!response || !config) return Promise.reject(error);

    console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url} - 응답 상태:`, response.status);

    // 토큰 만료
    if (response.status === 401 && !config._retry) {
      console.log('[HTTP] 401 인증 실패 감지');
      const store = useAuthStore.getState();
      const rt = store.tokens?.refreshToken;

      // refresh 엔드포인트 없으면 아래 블록을 주석 처리하거나 logout만 수행하세요.
      if (!rt) {
        store.logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        await new Promise<void>((resolve) => queue.push(resolve));
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${getAccessToken() ?? ""}`;
        config._retry = true;
        return http(config);
      }

      try {
        isRefreshing = true;
        const ok = await store.tryRefreshToken?.(); // 스토어에 구현되어 있어야 함(선택)
        queue.forEach((fn) => fn());
        queue = [];

        if (ok) {
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${getAccessToken() ?? ""}`;
          config._retry = true;
          return http(config);
        }

        store.logout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
