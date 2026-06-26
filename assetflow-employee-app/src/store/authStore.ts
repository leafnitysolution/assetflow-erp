import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

export type UserRole = 'admin' | 'member' | 'technician';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  branch?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  checkSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: (user, token) => {
    SecureStore.setItemAsync('token', token);
    SecureStore.setItemAsync('user', JSON.stringify(user));
    set({ user, token });
  },

  logout: () => {
    SecureStore.deleteItemAsync('token');
    SecureStore.deleteItemAsync('user');
    set({ user: null, token: null });
  },

  checkSession: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const userRaw = await SecureStore.getItemAsync('user');
      if (token && userRaw) {
        set({ user: JSON.parse(userRaw), token });
      }
    } catch (_) {
      // ignore
    } finally {
      set({ isLoading: false });
    }
  },
}));
