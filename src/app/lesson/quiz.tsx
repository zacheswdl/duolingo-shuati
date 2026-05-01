"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";
import { Icon } from "@/components/Icon";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useUserProgress } from "@/store/use-user-progress";
import { useHeartsModal } from "@/store/use-hearts-modal";
import { useExitModal } from "@/store/use-exit-modal";
import { useCheckinStore } from "@/store/use-checkin";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { XP_PER_CORRECT, HEARTS_MAX } from "@/lib/constants";
import { addXp as addXpToServer, recordAnswer, updateDailyTaskProgress, checkAndUnlockAchievements, toggleFavorite, removeHeart as removeHeartServer, addHeart as addHeartServer, refreshUserProgress } from "@/lib/supabase/actions";
import { AchievementModal } from "@/components/modals/achievement-modal";
import { DailyTaskModal } from "@/components/modals/daily-task-modal";
import { CheckinModal } from "@/components/modals/checkin-modal";
import type { Question, UserDailyTask } from "@/lib/types";

type Props = {
  chapter?: string;
  questions?: Question[];
  isMistakeRecovery?: boolean;
  isExam?: boolean;
  onComplete?: (results: { correct: number; total: number; xpEarned: number }) => void;
};

// 答题反馈后自动进入下一题的延迟（毫秒）
const NEXT_QUESTION_DELAY_CORRECT_MS = 900;
const NEXT_QUESTION_DELAY_WRONG_MS = 1300;

export const Quiz = ({
  chapter = "all",
  questions: externalQuestions = [],
  isMistakeRecovery = false,
  isExam = false,
  onComplete,
}: Props) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hearts, xp, streak, removeHeart, addXp, addHeart, incrementCorrect, setXp } = useUserProgress();
  const { open: openHeartsModal } = useHeartsModal();
  const { open: openExitModal } = useExitModal();
  const { 
    dailyAnswerCount, 
    hasCheckedInToday, 
    showCheckinModal, 
    incrementAnswerCount, 
    setHasCheckedInToday, 
    setShowCheckinModal,
    hydrateFromStorage 
  } = useCheckinStore();

  // 题库（仅在客户端挂载后打乱顺序，避免水合不匹配）
  const [questions, setQuestions] = useState<Question[]>(externalQuestions);

  useEffect(() => {
    setQuestions([...externalQuestions].sort(() => Math.random() - 0.5));
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [status, setStatus] = useState<"correct" | "wrong" | "none">("none");
  const [showXPFlyout, setShowXPFlyout] = useState(false);
  const [shake, setShake] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [pending, setPending] = useState(false);
  const [answers, setAnswers] = useState<Record<number, { option: string; isCorrect: boolean }>>({});
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [newAchievements, setNewAchievements] = useState<string[]>([]);
  const [showDailyTaskModal, setShowDailyTaskModal] = useState(false);
  const [completedDailyTasks, setCompletedDailyTasks] = useState<UserDailyTask[]>([]);
  const [favoriteStates, setFavoriteStates] = useState<Record<number, boolean>>({});

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const progress = ((currentIndex) / totalQuestions) * 100;

  // 判断题目类型
  const isJudge = currentQuestion?.type === "judge";
  const isMultiple = currentQuestion?.type === "multiple";

  const handleSelect = (optionKey: string) => {
    if (status !== "none" || pending) return;
    
    if (isMultiple) {
      // 多选题：切换选中状态
      setSelectedOptions((prev) => {
        if (prev.includes(optionKey)) {
          return prev.filter((key) => key !== optionKey);
        }
        return [...prev, optionKey].sort();
      });
    } else {
      // 单选/判断题：直接选择
      setSelectedOptions([optionKey]);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIndex > 0 && !pending) {
      const prevAnswer = answers[currentIndex - 1];
      setCurrentIndex(currentIndex - 1);
      if (prevAnswer) {
        setSelectedOptions(Array.isArray(prevAnswer.option) ? prevAnswer.option : [prevAnswer.option]);
        setStatus(prevAnswer.isCorrect ? "correct" : "wrong");
      } else {
        setSelectedOptions([]);
        setStatus("none");
      }
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < totalQuestions - 1 && !pending) {
      const nextAnswer = answers[currentIndex + 1];
      setCurrentIndex(currentIndex + 1);
      if (nextAnswer) {
        setSelectedOptions(Array.isArray(nextAnswer.option) ? nextAnswer.option : [nextAnswer.option]);
        setStatus(nextAnswer.isCorrect ? "correct" : "wrong");
      } else {
        setSelectedOptions([]);
        setStatus("none");
      }
    }
  };

  const handleFavorite = async () => {
    if (!currentQuestion) return;
    
    try {
      const { success, isFavorite } = await toggleFavorite(currentQuestion.id);
      if (success) {
        setFavoriteStates((prev) => ({
          ...prev,
          [currentQuestion.id]: isFavorite,
        }));
        toast.success(isFavorite ? "已收藏题目" : "已取消收藏", { duration: 2000 });
      } else {
        toast.error("操作失败，请稍后重试", { duration: 2000 });
      }
    } catch (e) {
      console.error("Failed to toggle favorite:", e);
      toast.error("操作失败，请稍后重试", { duration: 2000 });
    }
  };

  const handleSubmit = async () => {
    if (selectedOptions.length === 0 || !currentQuestion || pending) return;

    if (!isExam && !isMistakeRecovery && hearts <= 0) {
      openHeartsModal();
      return;
    }

    setPending(true);
    
    // 判断答案是否正确
    let isCorrect = false;
    if (isMultiple) {
      // 多选题：比较选中的选项数组与正确答案数组
      const correctAnswers = currentQuestion.correct_answer.split(",").sort();
      isCorrect = JSON.stringify(selectedOptions) === JSON.stringify(correctAnswers);
    } else {
      // 单选/判断题：比较单个选项
      isCorrect = selectedOptions[0] === currentQuestion.correct_answer;
    }
    
    setAnswers((prev) => ({
      ...prev,
      [currentIndex]: { option: isMultiple ? selectedOptions.join(",") : selectedOptions[0], isCorrect },
    }));

    // 非考试模式：每次答题更新刷题达人任务进度
    if (!isExam && !isMistakeRecovery) {
      updateDailyTaskProgress("answer_20_questions", 1).catch((e) =>
        console.error("Failed to update answer_20_questions task:", e)
      );
      
      // 增加每日答题计数，用于打卡判断
      incrementAnswerCount();
    }

    if (isCorrect) {
      setStatus("correct");
      setScore((prev) => prev + 1);
      addXp(XP_PER_CORRECT);
      incrementCorrect(currentQuestion.chapter);
      addXpToServer(XP_PER_CORRECT).then((result) => {
        if (result?.success && result.newXp > 0) {
          setXp(result.newXp);
        }
      }).catch((e) =>
        console.error("Failed to persist xp:", e)
      );

      // 记录答题到数据库
      try {
        await recordAnswer(currentQuestion.id, true);
      } catch (e) {
        console.error("Failed to record answer:", e);
      }

      // 实时更新答题达人任务进度
      if (!isExam && !isMistakeRecovery) {
        updateDailyTaskProgress("chapter_correct_50", 1).catch((e) =>
          console.error("Failed to update chapter_correct_50 task:", e)
        );
      }

      // 错题恢复模式：累计答对计数
      if (isMistakeRecovery && hearts < HEARTS_MAX) {
        addHeart();
        addHeartServer().catch((e) =>
          console.error("Failed to persist heart recovery:", e)
        );
        toast.success("答对错题！恢复1颗红心", { duration: 3000 });
      }

      // 显示 XP 飘出动画
      setShowXPFlyout(true);
      setTimeout(() => setShowXPFlyout(false), 1000);
    } else {
      setStatus("wrong");
      setShake(true);
      setTimeout(() => setShake(false), 500);

      // 记录错题到数据库
      try {
        await recordAnswer(currentQuestion.id, false);
      } catch (e) {
        console.error("Failed to record answer:", e);
      }

      // 非模拟考试模式扣心
      if (!isExam && !isMistakeRecovery) {
        removeHeart();
        removeHeartServer().catch((e) =>
          console.error("Failed to persist heart removal:", e)
        );
        if (hearts <= 1) {
          setTimeout(() => openHeartsModal(), 500);
        }
      }
    }

    // 自动切换到下一题
    setTimeout(() => {
      if (currentIndex < totalQuestions - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedOptions([]);
        setStatus("none");
      } else {
        setIsComplete(true);
      }
      setPending(false);
    }, isCorrect ? NEXT_QUESTION_DELAY_CORRECT_MS : NEXT_QUESTION_DELAY_WRONG_MS);
  };

  const handleFinish = useCallback(async () => {
    const xpEarned = score * XP_PER_CORRECT;
    const results = {
      correct: score,
      total: totalQuestions,
      xpEarned,
    };

    try {
      const refreshed = await refreshUserProgress();
      if (refreshed && refreshed.xp > 0) {
        setXp(refreshed.xp);
      }
    } catch (e) {
      console.error("Failed to refresh progress:", e);
    }

    if (!isExam && !isMistakeRecovery) {
      try {
        await updateDailyTaskProgress("chapter_practice", 1);

        const newAchievementKeys = await checkAndUnlockAchievements();
        if (newAchievementKeys.length > 0) {
          setNewAchievements(newAchievementKeys);
          setTimeout(() => setShowAchievementModal(true), 500);
        }

        const { getDailyTasks } = await import("@/lib/supabase/actions");
        const tasks = await getDailyTasks();
        const completed = tasks.filter((t: any) => t.completed && !t.claimed);
        if (completed.length > 0) {
          setCompletedDailyTasks(completed);
          setTimeout(() => setShowDailyTaskModal(true), 1000);
        }
      } catch (e) {
        console.error("Failed to update tasks:", e);
      }
    }

    if (onComplete) {
      onComplete(results);
    } else if (isExam) {
      router.push(`/exam/result?correct=${score}&total=${totalQuestions}&xp=${xpEarned}`);
    }
  }, [score, totalQuestions, router, isExam, onComplete, setXp]);

  // 如果红心为0且非错题恢复模式和非模拟考试，弹出提示
  useEffect(() => {
    if (hearts <= 0 && !isMistakeRecovery && !isExam && !isComplete) {
      openHeartsModal();
    }
  }, [hearts, isMistakeRecovery, isExam, isComplete, openHeartsModal]);

  if (isComplete) {
    const percentage = Math.round((score / totalQuestions) * 100);
    return (
      <>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center min-h-screen px-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-6xl mb-6"
          >
            {percentage >= 60 ? <Icon name="trophy" size={64} /> : <Icon name="flame" size={64} />}
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-700 mb-2">
            {percentage >= 60 ? "太棒了！" : "继续加油！"}
          </h1>
          <p className="text-slate-400 mb-8">
            你答对了 {score}/{totalQuestions} 题 ({percentage}%)
          </p>

          <div className="w-full max-w-xs bg-slate-100 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500">正确率</span>
              <span className={cn("font-bold text-lg", percentage >= 60 ? "text-[#58cc02]" : "text-[#ff4b4b]")}>
                {percentage}%
              </span>
            </div>
            <Progress value={percentage} />
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
              <span className="text-slate-500">获得经验</span>
              <span className="font-bold text-lg text-amber-500">+{score * XP_PER_CORRECT} XP</span>
            </div>
          </div>

          <Button variant="primary" size="lg" onClick={handleFinish}>
            {isExam ? "查看成绩单" : "返回首页"}
          </Button>
        </motion.div>

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
              addXp(100);
            }
          }}
        />
      </>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <p className="text-slate-400 text-lg mb-4">该章节暂无题目</p>
        <Button variant="primary" onClick={() => router.push("/learn")}>
          返回选择章节
        </Button>
      </div>
    );
  }

  const optionsEntries = Object.entries(currentQuestion.options);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="px-4 py-3 flex items-center gap-3 border-b border-slate-100">
        <button
          onClick={openExitModal}
          className="p-2 hover:bg-slate-100 rounded-xl transition"
        >
          <Icon name="arrow-left" size={20} />
        </button>
        <div className="flex-1">
          <Progress value={progress} />
        </div>
        <div className="flex items-center gap-2 text-rose-500 font-bold">
          <Icon name="heart" size={20} />
          <span className="text-sm">{hearts}</span>
        </div>
        {!isMistakeRecovery && !isExam && (
          <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-1 rounded-lg text-sm">
            <Icon name="star" size={16} />
            <span>{xp}</span>
          </div>
        )}
      </header>

      {/* Question Area */}
      <div className="flex-1 flex flex-col px-6 pt-8 pb-4">
        {/* 题型标签 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-bold",
              isJudge ? "bg-purple-100 text-purple-600" :
              isMultiple ? "bg-blue-100 text-blue-600" :
              "bg-green-100 text-green-600"
            )}>
              {isJudge ? "判断题" : isMultiple ? "多选题" : "单选题"}
            </span>
            <span className="text-xs text-slate-400">
              {currentIndex + 1}/{totalQuestions}
            </span>
          </div>
          <button
            onClick={handleFavorite}
            className={cn(
              "flex items-center gap-1 px-3 py-1.5 rounded-full transition-all",
              favoriteStates[currentQuestion.id]
                ? "bg-amber-100 text-amber-600"
                : "bg-slate-100 text-slate-400 hover:text-amber-500 hover:bg-amber-50"
            )}
          >
            <Star
              size={18}
              className={cn(
                "transition-all",
                favoriteStates[currentQuestion.id] && "fill-current"
              )}
            />
            <span className="text-xs font-medium">收藏</span>
          </button>
        </div>

        {/* 题目内容 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className={cn("flex-1", shake && "animate-shake")}
          >
            <h2 className="text-xl font-bold text-slate-700 mb-6 leading-relaxed">
              {currentQuestion.content}
            </h2>

            {/* 选项列表 */}
            <div className="grid gap-3">
              {optionsEntries.map(([key, value]) => {
                const isSelected = selectedOptions.includes(key);
                const isCorrectOption = isMultiple 
                  ? currentQuestion.correct_answer.split(",").includes(key)
                  : key === currentQuestion.correct_answer;
                let optionStatus: "default" | "selected" | "correct" | "wrong" = "default";

                if (status !== "none") {
                  if (isCorrectOption) {
                    optionStatus = "correct";
                  } else if (isSelected && !isCorrectOption) {
                    optionStatus = "wrong";
                  }
                } else if (isSelected) {
                  optionStatus = "selected";
                }

                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelect(key)}
                    disabled={status !== "none" || pending}
                    className={cn(
                      "flex items-center gap-4 w-full p-4 rounded-2xl border-2 text-left transition-all",
                      "hover:border-[#58cc02] hover:bg-[#d4edc9]/30",
                      optionStatus === "default" && "border-slate-200 bg-white",
                      optionStatus === "selected" && "border-[#58cc02] bg-[#d4edc9]/50",
                      optionStatus === "correct" && "border-[#58cc02] bg-[#d4edc9]",
                      optionStatus === "wrong" && "border-[#ff4b4b] bg-[#ffe0e0]",
                      (status !== "none" || pending) && "cursor-default"
                    )}
                  >
                    {/* 选项字母 */}
                    <span className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border-2",
                      optionStatus === "default" && "border-slate-200 text-slate-500 bg-slate-50",
                      optionStatus === "selected" && "border-[#58cc02] text-[#58cc02] bg-white",
                      optionStatus === "correct" && "border-[#58cc02] text-white bg-[#58cc02]",
                      optionStatus === "wrong" && "border-[#ff4b4b] text-white bg-[#ff4b4b]",
                    )}>
                      {optionStatus === "correct" ? (
                        <Icon name="check-circle" size={20} />
                      ) : optionStatus === "wrong" ? (
                        <Icon name="x-circle" size={20} />
                      ) : (
                        key
                      )}
                    </span>

                    {/* 选项文本 */}
                    <span className={cn(
                      "font-medium flex-1",
                      optionStatus === "correct" && "text-[#58cc02]",
                      optionStatus === "wrong" && "text-[#ff4b4b]",
                      optionStatus === "selected" && "text-[#58cc02]",
                      "text-slate-600"
                    )}>
                      {value}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 提交按钮 */}
      <div className="px-6 pb-6 space-y-3">
        {/* 上一题/下一题按钮 */}
        <div className="flex gap-3">
          {/* 上一题按钮 */}
          {currentIndex > 0 && (
            <Button
              variant="secondaryOutline"
              size="xl"
              className="flex-1"
              disabled={pending}
              onClick={handlePrevQuestion}
            >
              <Icon name="chevron-left" size={20} />
              上一题
            </Button>
          )}
          
          {/* 下一题按钮 - 仅在当前题目已回答且还有下一题时显示 */}
          {currentIndex < totalQuestions - 1 && status !== "none" && (
            <Button
              variant="secondaryOutline"
              size="xl"
              className="flex-1"
              disabled={pending}
              onClick={handleNextQuestion}
            >
              下一题
              <Icon name="chevron-left" size={20} className="rotate-180" />
            </Button>
          )}
        </div>
        
        {status === "none" ? (
          <Button
            variant="primary"
            size="xl"
            className="w-full"
            disabled={selectedOptions.length === 0 || pending}
            onClick={handleSubmit}
          >
            确认答案
          </Button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-2xl p-4 border-2",
              status === "correct"
                ? "bg-[#d4edc9] border-[#58cc02]"
                : "bg-[#ffe0e0] border-[#ff4b4b]"
            )}
          >
            <div className="flex items-start gap-3">
              {status === "correct" ? (
                <Icon name="check-circle" size={24} />
              ) : (
                <Icon name="x-circle" size={24} />
              )}
              <div>
                <p className={cn(
                  "font-bold text-lg",
                  status === "correct" ? "text-[#58cc02]" : "text-[#ff4b4b]"
                )}>
                  {status === "correct" ? "✓ 回答正确！" : "✗ 回答错误"}
                </p>
                {status === "correct" ? (
                  <p className="text-slate-600 text-sm mt-1">{currentQuestion.explanation}</p>
                ) : (
                  <div className="mt-1">
                    <p className="text-slate-600 text-sm">
                      正确答案是：
                      {isMultiple ? (
                        <span className="font-bold text-[#58cc02]">
                          {currentQuestion.correct_answer.split(",").map((key, index) => (
                            <span key={key}>
                              {index > 0 && ", "}
                              {key}. {currentQuestion.options[key]}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span className="font-bold text-[#58cc02]">
                          {currentQuestion.correct_answer}. {currentQuestion.options[currentQuestion.correct_answer]}
                        </span>
                      )}
                    </p>
                    <p className="text-slate-500 text-sm mt-1">{currentQuestion.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* XP 飘出动画 */}
      {showXPFlyout && (
        <div className="fixed top-1/3 right-8 z-50 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -60, scale: 1.3 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1 text-amber-500 font-bold text-2xl"
          >
            <Icon name="star" size={28} />
            <span>+{XP_PER_CORRECT}</span>
          </motion.div>
        </div>
      )}

      {/* 打卡弹窗 */}
      <CheckinModal
        open={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
        currentStreak={streak}
      />
    </div>
  );
};
