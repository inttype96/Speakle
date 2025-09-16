export type LoginReq = {
  email: string;
  password: string;
};

export type SignupReq = {
  email: string;
  password: string;
  username: string;
  gender?: string;
  birth?: string;
  profileImageUrl?: string;
};

export type User = {
  userId: number;
  email: string;
  username: string;
  gender?: string;
  birth?: string;
  profileImageUrl?: string;
};

export type AuthTokens = {
  tokenType: string;   // "Bearer"
  accessToken: string;
  refreshToken: string;
  expiresIn: number;   // 3600 (seconds)
};

export type LoginRes = {
  status: number;      // 200
  message: string;     // "로그인에 성공했습니다."
  data: AuthTokens;
};

export type SignupRes = {
  status: number;      // 200
  message: string;     // "회원가입이 완료되었습니다."
  data: User;
};

export type ApiError = {
  status: number;
  message: string;
};
