import { http } from "./http";
import type { LoginReq, LoginRes } from "@/types/auth";

export async function loginAPI(payload: LoginReq) {
  // POST /api/auth/login
  const res = await http.post<LoginRes>("/api/auth/login", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res;
}

// (선택) 토큰 갱신 엔드포인트가 있다면 사용
export async function refreshAPI(refreshToken: string) {
  // 예시: POST /api/auth/refresh  { refreshToken }
  const res = await http.post<{
    status: number;
    message: string;
    data: {
      tokens: {
        accessToken: string;
        refreshToken: string;
        expiresAt: string;
      };
    };
  }>("/auth/refresh", { refreshToken });
  return res;
}
