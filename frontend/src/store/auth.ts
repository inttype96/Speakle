import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AuthTokens } from "@/types/auth";
import { refreshAPI } from "@/services/auth";

type AuthState = {
  tokens: AuthTokens | null;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  setTokens: (tokens: AuthTokens | null) => void;

  // 편의 getter - 상태에 반응하도록 computed property로 변경
  isAuthed: boolean;
  accessToken: string | null;
  refreshToken: string | null;

  // hydration 상태 확인
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;

  // (선택) refresh 시도
  tryRefreshToken: () => Promise<boolean>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tokens: null,
      _hasHydrated: false,

      login: (tokens) => set({ tokens }),
      logout: () => set({ tokens: null }),
      setTokens: (tokens) => set({ tokens }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),

      get isAuthed() {
        const state = get();
        return !!state.tokens?.accessToken;
      },
      get accessToken() {
        const state = get();
        return state.tokens?.accessToken ?? null;
      },
      get refreshToken() {
        const state = get();
        return state.tokens?.refreshToken ?? null;
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        tokens: state.tokens,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
