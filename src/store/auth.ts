import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { apiLogin } from '../api';

interface AuthState {
  user?: User;
  token?: string;
  loggingIn: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: undefined,
      token: undefined,
      loggingIn: false,
      async login(username: string, password: string) {
        set({ loggingIn: true });
        const res = await apiLogin(username, password);
        set({ loggingIn: false });
        if (res) {
          set({ user: res.user, token: res.token });
          return true;
        }
        return false;
      },
      logout() {
        set({ user: undefined, token: undefined });
      },
    }),
    { name: 'auth-store' }
  )
);




