"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Quiz } from "@/app/lesson/quiz";
import { EXAM_QUESTION_COUNT, EXAM_TIME_MINUTES, PASS_SCORE, EXAM_PASS_BONUS_XP, XP_PER_CORRECT } from "@/lib/constants";
import { useUserProgress } from "@/store/use-user-progress";
import { addXp, updateStreak, checkAndUnlockAchievements, updateDailyTaskProgress, updateMaxExamScore } from "@/lib/supabase/actions";
import { AchievementModal } from "@/components/modals/achievement-modal";
import { DailyTaskModal } from "@/components/modals/daily-task-modal";
import type { Question, UserDailyTask } from "@/lib/types";

export default function ExamPage() {
  const router = useRouter();
  const { addXp: addXpLocal, xp, setXp } = useUserProgress();
  const [started, setStarted] = useState(false);
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [examComplete, setExamComplete] = useState(false);
  const [results, setResults] = useState<{ correct: number; total: number; xpEarned: number } | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [showDailyTaskModal, setShowDailyTaskModal] = useState(false);
  const [completedDailyTasks, setCompletedDailyTasks] = useState<UserDailyTask[]>([]);

  const startExam = async () => {
    try {
      // 从 Supabase 随机获取题目
      const res = await fetch("/api/exam-questions");
      if (!res.ok) throw new Error("Failed to fetch");
      const questions = await res.json();
      setExamQuestions(questions.slice(0, EXAM_QUESTION_COUNT));
      setStarted(true);
    } catch (err) {
      console.error("获取考试题目失败:", err);
      alert("获取题目失败，请稍后重试");
    }
  };

  const handleComplete = async (res: { correct: number; total: number; xpEarned: number }) => {
    setResults(res);
    setExamComplete(true);

    const score = res.correct * 2; // 每题2分
    await updateMaxExamScore(score);

    const percentage = Math.round((res.correct / res.total) * 100);
    const passed = percentage >= PASS_SCORE;

    // 考试及格奖励
    if (passed) {
      const xpResult = await addXp(EXAM_PASS_BONUS_XP);
      addXpLocal(EXAM_PASS_BONUS_XP);
      if (xpResult?.success && xpResult.newXp > 0) {
        setXp(xpResult.newXp);
      }

      // 更新连续打卡
      await updateStreak();

      // 更新每日任务：考试通过
      await updateDailyTaskProgress("exam_pass", 1);

      // 检查成就
      const newAchievementKeys = await checkAndUnlockAchievements();
      if (newAchievementKeys.length > 0) {
        setNewAchievements(newAchievementKeys);
        setTimeout(() => setShowAchievementModal(true), 1000);
      }

      // 检查每日任务完成情况
      const { getDailyTasks } = await import("@/lib/supabase/actions");
      const tasks = await getDailyTasks();
      const completed = tasks.filter((t: any) => t.completed && !t.claimed);
      if (completed.length > 0) {
        setCompletedDailyTasks(completed);
        setTimeout(() => setShowDailyTaskModal(true), 1500);
      }
    }
  };

  if (started && !examComplete) {
    return (
      <Quiz
        questions={examQuestions}
        isExam
        onComplete={handleComplete}
      />
    );
  }

  if (examComplete && results) {
    return (
      <>
        <ExamResult correct={results.correct} total={results.total} xpEarned={results.xpEarned} />
        <AchievementModal
          open={showAchievementModal}
          achievementKeys={newAchievements}
          onClose={() => setShowAchievementModal(false)}
        />
        <DailyTaskModal
          open={showDailyTaskModal}
          completedTasks={completedDailyTasks}
          onClose={() => setShowDailyTaskModal(false)}
          onClaimed={(newXp) => {
            if (newXp && newXp > 0) {
              setXp(newXp);
            } else {
              addXpLocal(100);
            }
          }}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="w-24 h-24 bg-gradient-to-br from-[#ffc800] to-[#ff9600] rounded-3xl flex items-center justify-center mb-8 shadow-lg"
      >
        <Icon name="swords" size={64} />
      </motion.div>

      <h1 className="text-3xl font-bold text-slate-700 mb-2">模拟考试</h1>
      <p className="text-slate-400 text-center mb-8 max-w-sm">
        随机抽取 {EXAM_QUESTION_COUNT} 道题目（每题2分，满分100分），限时 {EXAM_TIME_MINUTES} 分钟完成
      </p>

      <div className="grid grid-cols-3 gap-4 w-full max-w-sm mb-8">
        <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-200">
          <Icon name="clock" size={32} />
          <p className="text-xs text-slate-400">限时</p>
          <p className="font-bold text-slate-700">{EXAM_TIME_MINUTES}分钟</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-200">
          <Icon name="swords" size={32} />
          <p className="text-xs text-slate-400">题量</p>
          <p className="font-bold text-slate-700">{EXAM_QUESTION_COUNT}题</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-200">
          <Icon name="trophy" size={32} />
          <p className="text-xs text-slate-400">及格线</p>
          <p className="font-bold text-[#58cc02]">{PASS_SCORE}分</p>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 max-w-sm">
        <Icon name="alert-triangle" size={28} />
        <p className="text-sm text-amber-700">
          及格线：{PASS_SCORE}分（需答对45题）。及格后可获得{EXAM_PASS_BONUS_XP}经验值和连续打卡奖励！
        </p>
      </div>

      <Button variant="warning" size="xl" className="w-full max-w-sm" onClick={startExam}>
          开始考试
        </Button>
    </div>
  );
}

// 结算页组件
function ExamResult({ correct, total, xpEarned }: { correct: number; total: number; xpEarned: number }) {
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
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6">
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
              initial={{ y: -20, opacity: 1 }}
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
        {passed ? <Icon name="trophy" size={104} /> : <Icon name="flame" size={104} />}
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
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Icon name="trophy" size={24} />
                考试及格奖励
              </span>
              <span className="font-bold text-xl text-amber-500">+{EXAM_PASS_BONUS_XP} XP</span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-slate-500 font-medium flex items-center gap-1">
                <Icon name="flame" size={24} />
                连胜
              </span>
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
    </div>
  );
}
