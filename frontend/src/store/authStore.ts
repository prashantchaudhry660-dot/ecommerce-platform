import { create } from 'zustand';
import { User, AuthResponse } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (authData: AuthResponse) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem('passu_user') || localStorage.getItem('cartly_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getStoredToken = () => localStorage.getItem('passu_access_token') || localStorage.getItem('cartly_access_token');
const getStoredRefreshToken = () => localStorage.getItem('passu_refresh_token') || localStorage.getItem('cartly_refresh_token');

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  accessToken: getStoredToken(),
  refreshToken: getStoredRefreshToken(),
  isAuthenticated: !!getStoredToken(),

  setAuth: (authData) => {
    localStorage.setItem('passu_access_token', authData.accessToken);
    localStorage.setItem('passu_refresh_token', authData.refreshToken);
    localStorage.setItem('passu_user', JSON.stringify(authData.user));
    // Clear legacy
    localStorage.removeItem('cartly_access_token');
    localStorage.removeItem('cartly_refresh_token');
    localStorage.removeItem('cartly_user');
    set({
      user: authData.user,
      accessToken: authData.accessToken,
      refreshToken: authData.refreshToken,
      isAuthenticated: true,
    });
  },

  setUser: (user) => {
    localStorage.setItem('passu_user', JSON.stringify(user));
    set({ user });
  },

  logout: () => {
    localStorage.removeItem('passu_access_token');
    localStorage.removeItem('passu_refresh_token');
    localStorage.removeItem('passu_user');
    localStorage.removeItem('cartly_access_token');
    localStorage.removeItem('cartly_refresh_token');
    localStorage.removeItem('cartly_user');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));
