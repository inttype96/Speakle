import { http } from "./http";
import type { LoginReq, LoginRes, SignupReq, SignupRes } from "@/types/auth";

export async function loginAPI(payload: LoginReq) {
  // POST /api/auth/login
  const res = await http.post<LoginRes>("/auth/login", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return res;
}

export async function signupAPI(payload: SignupReq) {
  // POST /api/user
  const res = await http.post<SignupRes>("/user", payload, {
    headers: { "Content-Type": "application/json" },
  });
  console.log(res)
  return res;
}

// (선택) 토큰 갱신 엔드포인트가 있다면 사용
export async function refreshAPI(refreshToken: string) {
  // 예시: POST /api/auth/refresh  { refreshToken }
  const res = await http.post<{
    status: number;
    message: string;
    data: {
      tokenType: string;
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
  }>("/auth/refresh", { refreshToken });
  return res;
}
