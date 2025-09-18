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
  id: number;
  email: string;
  username: string;
  gender?: string;
  birth?: string;
  profileImageUrl?: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserProfile = {
  id: number;  // 백엔드 응답에 맞춰 id로 변경
  email: string;
  username: string;
  gender?: string;
  birth?: string;
  profileImageUrl?: string;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type UserProfileRes = {
  status: number;
  message: string;
  data: UserProfile;
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
  status: number;      // 201
  message: string;     // "회원이 생성되었습니다."
  data: User;
};

export type ApiError = {
  status: number;
  message: string;
};
