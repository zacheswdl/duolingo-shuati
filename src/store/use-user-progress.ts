import { create } from "zustand";

type UserProgressState = {
  hearts: number;
  xp: number;
  streak: number;
  totalCorrect: number;
  chapterCorrect: Record<string, number>;
  isLoading: boolean;
  setHearts: (hearts: number) => void;
  setXp: (xp: number) => void;
  setStreak: (streak: number) => void;
  addXp: (amount: number) => void;
  removeHeart: () => void;
  addHeart: () => void;
  incrementCorrect: (chapter?: string) => void;
  setTotalCorrect: (total: number) => void;
  setChapterCorrect: (data: Record<string, number>) => void;
  setLoading: (loading: boolean) => void;
  hydrate: (data: { hearts: number; xp: number; streak: number; total_correct?: number; chapter_correct?: Record<string, number> }) => void;
};

export const useUserProgress = create<UserProgressState>((set) => ({
  hearts: 5,
  xp: 0,
  streak: 0,
  totalCorrect: 0,
  chapterCorrect: {},
  isLoading: true,
  setHearts: (hearts) => set({ hearts }),
  setXp: (xp) => set({ xp }),
  setStreak: (streak) => set({ streak }),
  addXp: (amount) => set((state) => ({ xp: state.xp + amount })),
  removeHeart: () => set((state) => ({ hearts: Math.max(state.hearts - 1, 0) })),
  addHeart: () => set((state) => ({ hearts: Math.min(state.hearts + 1, 5) })),
  incrementCorrect: (chapter) =>
    set((state) => {
      const newTotal = state.totalCorrect + 1;
      const newChapterCorrect = { ...state.chapterCorrect };
      if (chapter) {
        newChapterCorrect[chapter] = (newChapterCorrect[chapter] || 0) + 1;
      }
      return { totalCorrect: newTotal, chapterCorrect: newChapterCorrect };
    }),
  setTotalCorrect: (total) => set({ totalCorrect: total }),
  setChapterCorrect: (data) => set({ chapterCorrect: data }),
  setLoading: (isLoading) => set({ isLoading }),
  hydrate: (data) =>
    set({
      hearts: data.hearts,
      xp: data.xp,
      streak: data.streak,
      totalCorrect: data.total_correct ?? 0,
      chapterCorrect: data.chapter_correct ?? {},
      isLoading: false,
    }),
}));
