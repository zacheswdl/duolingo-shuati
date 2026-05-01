import { create } from "zustand";

const DAILY_QUESTION_TARGET = 5;

type CheckinState = {
  dailyAnswerCount: number;
  hasCheckedInToday: boolean;
  showCheckinModal: boolean;
  lastAnswerDate: string | null;
};

type CheckinActions = {
  incrementAnswerCount: () => void;
  setHasCheckedInToday: (checked: boolean) => void;
  setShowCheckinModal: (show: boolean) => void;
  resetDailyCount: () => void;
  hydrateFromStorage: () => void;
};

const getToday = () => new Date().toISOString().split("T")[0];

export const useCheckinStore = create<CheckinState & CheckinActions>((set, get) => ({
  dailyAnswerCount: 0,
  hasCheckedInToday: false,
  showCheckinModal: false,
  lastAnswerDate: null,

  incrementAnswerCount: () => {
    const today = getToday();
    const state = get();
    
    if (state.lastAnswerDate !== today) {
      set({ dailyAnswerCount: 1, lastAnswerDate: today, hasCheckedInToday: false });
      return;
    }
    
    const newCount = state.dailyAnswerCount + 1;
    set({ dailyAnswerCount: newCount });
    
    if (newCount >= DAILY_QUESTION_TARGET && !state.hasCheckedInToday) {
      set({ showCheckinModal: true });
    }
  },

  setHasCheckedInToday: (checked) => {
    set({ hasCheckedInToday: checked });
    if (checked) {
      localStorage.setItem("checkin_date", getToday());
      localStorage.setItem("checkin_done", "true");
    }
  },

  setShowCheckinModal: (show) => set({ showCheckinModal: show }),

  resetDailyCount: () => set({ dailyAnswerCount: 0, hasCheckedInToday: false }),

  hydrateFromStorage: () => {
    const today = getToday();
    const savedDate = localStorage.getItem("checkin_date");
    const savedDone = localStorage.getItem("checkin_done") === "true";
    const savedCount = parseInt(localStorage.getItem("daily_answer_count") || "0", 10);
    
    if (savedDate === today) {
      set({
        lastAnswerDate: today,
        hasCheckedInToday: savedDone,
        dailyAnswerCount: savedCount,
      });
    } else {
      set({
        lastAnswerDate: today,
        hasCheckedInToday: false,
        dailyAnswerCount: 0,
      });
      localStorage.setItem("checkin_date", today);
      localStorage.setItem("checkin_done", "false");
      localStorage.setItem("daily_answer_count", "0");
    }
  },
}));
