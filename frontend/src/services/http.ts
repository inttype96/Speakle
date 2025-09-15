import axios from "axios";

// Vite 프록시 기준: 프론트에서는 항상 "/api"로 시작
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
  withCredentials: true,
});


// 필요 시 인터셉터(토큰/에러 로깅 등) 추가
// http.interceptors.request.use(cfg => cfg);
// http.interceptors.response.use(res => res, err => Promise.reject(err));

// 응답 인터셉터(선택): 401일 때 refresh 시도 (백엔드에 /auth/refresh 가 있을 때만 유지)
let isRefreshing = false;
let queue: Array<() => void> = [];

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error;
    if (response?.status === 401 && !config._retry) {
      // refresh 로직이 있으면 활성화, 없으면 주석 처리해도 됨
      const { refreshToken, tryRefreshToken, logout } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        await new Promise<void>((resolve) => queue.push(resolve));
        config.headers.Authorization = `Bearer ${useAuthStore.getState().tokens?.accessToken}`;
        config._retry = true;
        return http(config);
      }

      try {
        isRefreshing = true;
        const ok = await tryRefreshToken(); // 아래 store에 구현
        queue.forEach((fn) => fn());
        queue = [];
        if (ok) {
          config.headers.Authorization = `Bearer ${useAuthStore.getState().tokens?.accessToken}`;
          config._retry = true;
          return http(config);
        }
        // refresh 실패
        useAuthStore.getState().logout();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);