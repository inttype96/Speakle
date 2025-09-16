import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthTokens } from "@/types/auth";
import { refreshAPI } from "@/services/auth";

type AuthState = {
  tokens: AuthTokens | null;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  setTokens: (tokens: AuthTokens | null) => void;

  // 편의 getter
  isAuthed: () => boolean;
  accessToken: string | null;
  refreshToken: string | null;

  // (선택) refresh 시도
  tryRefreshToken: () => Promise<boolean>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tokens: null,

      login: (tokens) => set({ tokens }),
      logout: () => set({ tokens: null }),
      setTokens: (tokens) => set({ tokens }),

      isAuthed: () => !!get().tokens?.accessToken,
      get accessToken() {
        return get().tokens?.accessToken ?? null;
      },
      get refreshToken() {
        return get().tokens?.refreshToken ?? null;
      },

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
      partialize: (state) => ({
        tokens: state.tokens,
      }),
    }
  )
);
