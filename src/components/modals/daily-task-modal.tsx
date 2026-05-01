"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Icon } from "@/components/Icon";
import { useState } from "react";
import { DAILY_TASKS, DAILY_TASK_REWARD_XP } from "@/lib/constants";
import { claimDailyTaskReward } from "@/lib/supabase/actions";
import type { UserDailyTask } from "@/lib/types";

type Props = {
  open: boolean;
  completedTasks: UserDailyTask[];
  onClose: () => void;
  onClaimed: (newXp?: number) => void;
};

export const DailyTaskModal = ({ open, completedTasks, onClose, onClaimed }: Props) => {
  const [claimingId, setClaimingId] = useState<number | null>(null);

  const handleClaim = async (taskId: number) => {
    setClaimingId(taskId);
    const result = await claimDailyTaskReward(taskId);
    if (result.success) {
      onClaimed((result as any).newXp);
    }
    setClaimingId(null);
  };

  const allClaimed = completedTasks.every((t) => t.claimed);

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
                className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <Icon name="gift" size={40} />
              </motion.div>
              <h2 className="text-2xl font-bold text-slate-700">🎁 每日任务完成！</h2>
              <p className="text-slate-400 mt-1">领取你的任务奖励吧</p>
            </div>

            {/* Task list */}
            <div className="space-y-3 mb-6">
              {completedTasks.map((task, index) => {
                const taskDef = DAILY_TASKS.find((t) => t.type === task.task_type);
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                        <Icon name="check-circle" size={24} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-700 text-sm">
                          {taskDef?.icon} {taskDef?.name || task.task_type}
                        </h3>
                        <p className="text-xs text-slate-500">+{DAILY_TASK_REWARD_XP} XP</p>
                      </div>
                    </div>
                    {task.claimed ? (
                      <span className="text-xs font-bold text-green-500 bg-green-100 px-3 py-1 rounded-full">
                        已领取
                      </span>
                    ) : (
                      <button
                        onClick={() => handleClaim(task.id)}
                        disabled={claimingId === task.id}
                        className="px-4 py-2 bg-gradient-to-r from-purple-400 to-purple-600 text-white font-bold text-sm rounded-xl border-b-2 border-purple-700 active:border-b-0 active:translate-y-0.5 transition-all hover:brightness-105 disabled:opacity-50"
                      >
                        {claimingId === task.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "领取"
                        )}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* All claimed message */}
            {allClaimed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-sm text-green-600 font-bold mb-4"
              >
                全部领取完毕！明天继续加油 💪
              </motion.p>
            )}

            {/* Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-purple-400 to-purple-600 text-white font-bold rounded-2xl border-b-4 border-purple-700 active:border-b-0 active:translate-y-1 transition-all hover:brightness-105"
            >
              好的！🎉
            </motion.button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
