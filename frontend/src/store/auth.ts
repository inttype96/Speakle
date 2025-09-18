import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthTokens } from "@/types/auth";
import { refreshAPI } from "@/services/auth";

type AuthState = {
  tokens: AuthTokens | null;
  userId: number | null;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setUserId: (userId: number | null) => void;

  // (선택) refresh 시도
  tryRefreshToken: () => Promise<boolean>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tokens: null,
      userId: null,

      login: (tokens) => set({ tokens }),
      logout: () => set({ tokens: null, userId: null }),
      setTokens: (tokens) => set({ tokens }),
      setUserId: (userId) => set({ userId }),

      tryRefreshToken: async () => {
        const rt = get().tokens?.refreshToken;
        if (!rt) return false;
        try {
          const res = await refreshAPI(rt);
          const newTokens = res.data.data;
          set({ tokens: newTokens });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "auth-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tokens: state.tokens,
        userId: state.userId,
      }),
    }
  )
);

// 편의 함수들 - 컴포넌트에서 사용
export const isAuthenticated = () => {
  return !!useAuthStore.getState().tokens?.accessToken;
};

export const getAccessToken = () => {
  return useAuthStore.getState().tokens?.accessToken ?? null;
};

export const getRefreshToken = () => {
  return useAuthStore.getState().tokens?.refreshToken ?? null;
};

export const getUserId = () => {
  return useAuthStore.getState().userId ?? null;
};
