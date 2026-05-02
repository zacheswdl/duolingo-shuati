import { create } from 'zustand';
import type { UserProgress } from '../lib/types';

interface UserProgressState {
  progress: UserProgress | null;
  setProgress: (progress: UserProgress) => void;
  updateXp: (xp: number) => void;
  updateHearts: (hearts: number) => void;
  updateStreak: (streak: number) => void;
  reset: () => void;
}

export const useUserProgressStore = create<UserProgressState>((set) => ({
  progress: null,
  setProgress: (progress) => set({ progress }),
  updateXp: (xp) =>
    set((state) => ({
      progress: state.progress ? { ...state.progress, xp } : null,
    })),
  updateHearts: (hearts) =>
    set((state) => ({
      progress: state.progress ? { ...state.progress, hearts } : null,
    })),
  updateStreak: (streak) =>
    set((state) => ({
      progress: state.progress ? { ...state.progress, streak } : null,
    })),
  reset: () => set({ progress: null }),
}));
