"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@/components/Icon";
import { ACHIEVEMENTS } from "@/lib/constants";

type Props = {
  open: boolean;
  achievementKeys: string[];
  onClose: () => void;
};

export const AchievementModal = ({ open, achievementKeys, onClose }: Props) => {
  const achievements = achievementKeys
    .map((key) => ACHIEVEMENTS.find((a) => a.key === key))
    .filter(Boolean);

  if (achievements.length === 0) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative bg-white rounded-3xl p-8 mx-4 max-w-sm w-full shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-slate-100 rounded-full transition"
            >
              <Icon name="x" size={20} />
            </button>

            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <Icon name="trophy" size={40} />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-700">🏆 新成就解锁！</h2>
              <p className="text-slate-400 mt-1">恭喜你获得了新的成就</p>
            </div>

            {/* Achievement list */}
            <div className="space-y-3 mb-6">
              {achievements.map((achievement, index) =>
                achievement ? (
                  <motion.div
                    key={achievement.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-700">{achievement.name}</h3>
                      <p className="text-sm text-slate-500">{achievement.description}</p>
                    </div>
                  </motion.div>
                ) : null
              )}
            </div>

            {/* Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-600 text-white font-bold rounded-2xl border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 transition-all hover:brightness-105"
            >
              太棒了！🎉
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
