import { create } from 'zustand';

interface User {
  userId: number;
  email: string;
  username: string;
  profileImageUrl: string;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

interface AuthState {
  user: User | null;
  tokens: Tokens | null;
  isLoggedIn: boolean;
  login: (user: User, tokens: Tokens) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tokens: null,
  isLoggedIn: false,
  login: (user, tokens) => {
    set({ user, tokens, isLoggedIn: true });
    // You might want to persist the tokens to localStorage here
    localStorage.setItem('tokens', JSON.stringify(tokens));
    localStorage.setItem('user', JSON.stringify(user));
  },
  logout: () => {
    set({ user: null, tokens: null, isLoggedIn: false });
    localStorage.removeItem('tokens');
    localStorage.removeItem('user');
  },
}));

// Check for persisted auth state on initialization
const initialTokens = localStorage.getItem('tokens');
const initialUser = localStorage.getItem('user');
if (initialTokens && initialUser) {
  useAuthStore.getState().login(JSON.parse(initialUser), JSON.parse(initialTokens));
}
