import axios, { AxiosError} from "axios";
import { useAuthStore, getAccessToken } from "@/store/auth";
import { showGlobalAlert } from "@/store/globalAlert";

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
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  // Authorization 헤더가 명시적으로 빈 문자열이면 토큰을 붙이지 않음
  const skipAuth = config.headers?.Authorization === '';

  if (token && !skipAuth) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  } else if (skipAuth) {
    // 빈 문자열로 설정된 경우 헤더 제거
    delete config.headers?.Authorization;
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

// 응답 인터셉터 관련 변수들
let isRefreshing = false;
let queue: Array<() => void> = [];
let isShowingAlert = false;

const handleAuthError = (errorType: 'token_missing' | 'token_expired' | 'server_error') => {
  if (isShowingAlert) return
  
  isShowingAlert = true
  const store = useAuthStore.getState()
  store.logout()

  const getRedirectUrl = () => {
    const currentPath = window.location.pathname + window.location.search
    return currentPath === '/login' ? '/login' : `/login?redirect=${encodeURIComponent(currentPath)}`
  }

  const handleConfirm = () => {
    window.location.href = getRedirectUrl()
  }

  switch (errorType) {
    case 'server_error':
      showGlobalAlert({
        title: "서버 오류 발생",
        message: "서버 오류로 인해 로그인이 해제되었습니다.\n다시 로그인해주세요.",
        confirmText: "로그인하러 가기",
        type: "error"
      }, handleConfirm)
      break

    case 'token_missing':
      showGlobalAlert({
        title: "로그인이 필요해요",
        message: "로그인이 필요한 서비스입니다.\n로그인 페이지로 이동하시겠어요?",
        confirmText: "로그인하러 가기",
        type: "music"
      }, handleConfirm)
      break

    case 'token_expired':
      showGlobalAlert({
        title: "세션 만료",
        message: "로그인이 만료되었습니다.\n다시 로그인해주세요.",
        confirmText: "로그인하러 가기",
        type: "warning"
      }, handleConfirm)
      break
  }
}

// 응답 인터셉터: 401/500 처리 (refresh API가 있을 때만 작동)
http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const { response, config } = error;
    if (!response || !config) return Promise.reject(error);

    // 500 에러 처리 - 로그인이 풀렸을 때
    if (response.status === 500) {
      handleAuthError('server_error')
      return Promise.reject(error);
    }
    // 401 에러 처리
    if (response.status === 401 && !config._retry) {
      const store = useAuthStore.getState();
      const rt = store.tokens?.refreshToken;

      // refresh 토큰이 없으면 바로 로그아웃
      if (!rt) {
        handleAuthError('token_missing')
        return Promise.reject(error);
      }

      // 이미 토큰 갱신 중이면 대기
      if (isRefreshing) {
        await new Promise<void>((resolve) => queue.push(resolve));
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${getAccessToken() ?? ""}`;
        config._retry = true;
        return http(config);
      }

      // 토큰 갱신 시도
      try {
        isRefreshing = true;
        const ok = await store.tryRefreshToken?.();
        queue.forEach((fn) => fn());
        queue = [];

        if (ok) {
          // 토큰 갱신 성공 - 원래 요청 재시도
          config.headers = config.headers ?? {};
          config.headers.Authorization = `Bearer ${getAccessToken() ?? ""}`;
          config._retry = true;
          return http(config);
        }

        // 토큰 갱신 실패
        handleAuthError('token_expired')
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
