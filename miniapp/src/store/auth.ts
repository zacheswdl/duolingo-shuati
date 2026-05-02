import { create } from 'zustand';

interface AuthState {
  isLoggedIn: boolean;
  userId: string | null;
  setLoggedIn: (userId: string) => void;
  setLoggedOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  userId: null,
  setLoggedIn: (userId) => set({ isLoggedIn: true, userId }),
  setLoggedOut: () => set({ isLoggedIn: false, userId: null }),
}));
