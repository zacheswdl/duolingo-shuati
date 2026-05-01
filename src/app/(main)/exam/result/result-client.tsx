"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { PASS_SCORE, EXAM_PASS_BONUS_XP } from "@/lib/constants";

type Props = {
  correct: number;
  total: number;
  xpEarned: number;
};

export default function ExamResultContent({ correct, total, xpEarned }: Props) {
  const router = useRouter();
  const [showConfetti, setShowConfetti] = useState(false);
  const percentage = Math.round((correct / total) * 100);
  const score = correct * 2; // 每题2分
  const passed = percentage >= PASS_SCORE;

  useEffect(() => {
    if (passed) {
      setShowConfetti(true);
    }
  }, [passed]);

  return (
    <>
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full"
              style={{
                backgroundColor: ["#58cc02", "#ffc800", "#1cb0f6", "#ff4b4b", "#ff9600"][i % 5],
                left: `${Math.random() * 100}%`,
              }}
              initial={{ y: -20, opacity: 1, rotate: 0 }}
              animate={{
                y: "100vh",
                opacity: 0,
                rotate: Math.random() * 720,
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: "easeIn",
              }}
            />
          ))}
        </div>
      )}

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="text-7xl mb-6"
      >
        {passed ? "🎉" : "💪"}
      </motion.div>

      <h1 className="text-3xl font-bold text-slate-700 mb-2">
        {passed ? "恭喜通过！" : "未通过，继续加油！"}
      </h1>
      <p className="text-slate-400 mb-8">
        你答对了 {correct}/{total} 题，得分 {score}/100
      </p>

      <div className="w-full max-w-sm bg-white border-2 border-slate-200 rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-500 font-medium">得分</span>
          <span
            className={`font-bold text-2xl ${passed ? "text-[#58cc02]" : "text-[#ff4b4b]"}`}
          >
            {score}分
          </span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-4 mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className={`h-full rounded-full ${passed ? "bg-[#58cc02]" : "bg-[#ff4b4b]"}`}
          />
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <span className="text-slate-500 font-medium">答题经验</span>
          <span className="font-bold text-xl text-amber-500">+{xpEarned} XP</span>
        </div>
        {passed && (
          <>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-slate-500 font-medium">🏆 考试及格奖励</span>
              <span className="font-bold text-xl text-amber-500">+{EXAM_PASS_BONUS_XP} XP</span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-slate-500 font-medium">🔥 连胜</span>
              <span className="font-bold text-xl text-orange-500">+1 天</span>
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <Button variant="primary" size="xl" className="w-full" onClick={() => router.push("/learn")}>
          返回首页
        </Button>
        <Button variant="secondaryOutline" size="lg" className="w-full" onClick={() => router.push("/mistakes")}>
          查看错题
        </Button>
      </div>
    </>
  );
}
