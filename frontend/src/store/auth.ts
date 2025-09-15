import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User, Tokens } from "@/types/auth";
import { refreshAPI } from "@/services/auth";

type AuthState = {
  user: User | null;
  tokens: Tokens | null;
  login: (user: User, tokens: Tokens) => void;
  logout: () => void;
  setTokens: (tokens: Tokens | null) => void;

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
      user: null,
      tokens: null,

      login: (user, tokens) => set({ user, tokens }),
      logout: () => set({ user: null, tokens: null }),
      setTokens: (tokens) => set({ tokens }),

      isAuthed: () => !!get().tokens?.accessToken && !!get().user,
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
          const newTokens = res.data.data.tokens;
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
        user: state.user,
        tokens: state.tokens,
      }),
    }
  )
);
