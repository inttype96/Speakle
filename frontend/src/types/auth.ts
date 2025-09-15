export type LoginReq = {
  email: string;
  password: string;
};

export type User = {
  userId: number;
  email: string;
  username: string;
  profileImageUrl: string;
};

export type Tokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string; // ISO UTC
};

export type LoginRes = {
  status: number;      // 200
  message: string;     // "로그인에 성공했습니다."
  data: {
    user: User;
    tokens: Tokens;
  };
};
