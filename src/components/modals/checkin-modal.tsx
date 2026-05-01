"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Flame, X } from "lucide-react";
import { useState } from "react";
import { updateStreakFromClient } from "@/lib/supabase/actions";
import { useUserProgress } from "@/store/use-user-progress";
import { useCheckinStore } from "@/store/use-checkin";

type Props = {
  open: boolean;
  onClose: () => void;
  currentStreak: number;
};

export function CheckinModal({ open, onClose, currentStreak }: Props) {
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [newStreakValue, setNewStreakValue] = useState(0);
  const { setStreak } = useUserProgress();
  const { setHasCheckedInToday } = useCheckinStore();

  const handleCheckin = async () => {
    if (loading || checkedIn) return;
    setLoading(true);
    try {
      const result = await updateStreakFromClient();
      if (result.success) {
        setStreak(result.newStreak);
        setNewStreakValue(result.newStreak);
        setHasCheckedInToday(true);
        setCheckedIn(true);
      }
    } catch (e) {
      console.error("Checkin failed:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full mx-4 text-center relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            {!checkedIn ? (
              <>
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                  <Flame className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">
                  今日打卡
                </h2>
                <p className="text-slate-500 mb-2">
                  已连续打卡 <span className="font-bold text-orange-500">{currentStreak}</span> 天
                </p>
                <p className="text-slate-400 text-sm mb-6">
                  完成今日答题任务，点击打卡继续连胜！
                </p>
                <button
                  onClick={handleCheckin}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg rounded-2xl hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50"
                >
                  {loading ? "打卡中..." : "立即打卡"}
                </button>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10, stiffness: 200 }}
                  className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center"
                >
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className="text-4xl"
                  >
                    ✓
                  </motion.span>
                </motion.div>
                <h2 className="text-2xl font-bold text-green-600 mb-2">
                  打卡成功！
                </h2>
                <p className="text-slate-600 mb-2">
                  已连续打卡 <span className="font-bold text-orange-500">{newStreakValue || currentStreak + 1}</span> 天
                </p>
                <p className="text-slate-400 text-sm mb-6">
                  明天继续加油，保持连胜！
                </p>
                <button
                  onClick={onClose}
                  className="w-full py-4 bg-slate-100 text-slate-700 font-bold text-lg rounded-2xl hover:bg-slate-200 transition-all"
                >
                  继续答题
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
