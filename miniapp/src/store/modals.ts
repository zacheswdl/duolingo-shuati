import { create } from 'zustand';

interface ModalState {
  showHeartsModal: boolean;
  showPracticeModal: boolean;
  showExitModal: boolean;
  showAchievementModal: boolean;
  showCheckinModal: boolean;
  showDailyTaskModal: boolean;
  achievementData: { key: string; name: string; description: string } | null;
  dailyTaskData: { taskName: string; xpReward: number } | null;
  setOpen: (modal: string, open: boolean) => void;
  setAchievementData: (data: { key: string; name: string; description: string } | null) => void;
  setDailyTaskData: (data: { taskName: string; xpReward: number } | null) => void;
}

export const useModalStore = create<ModalState>((set) => ({
  showHeartsModal: false,
  showPracticeModal: false,
  showExitModal: false,
  showAchievementModal: false,
  showCheckinModal: false,
  showDailyTaskModal: false,
  achievementData: null,
  dailyTaskData: null,
  setOpen: (modal, open) => set({ [`show${modal.charAt(0).toUpperCase() + modal.slice(1)}Modal`]: open } as any),
  setAchievementData: (data) => set({ achievementData: data }),
  setDailyTaskData: (data) => set({ dailyTaskData: data }),
}));
