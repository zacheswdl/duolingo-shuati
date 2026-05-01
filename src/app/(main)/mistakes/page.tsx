"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Quiz } from "@/app/lesson/quiz";
import { useUserProgress } from "@/store/use-user-progress";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";
import { getMistakes } from "@/lib/supabase/actions";

export default function MistakesPage() {
  const router = useRouter();
  const { hearts } = useUserProgress();
  const [mode, setMode] = useState<"list" | "recovery">("list");
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [mistakes, setMistakes] = useState<Question[]>([]);
  const [loadingMistakes, setLoadingMistakes] = useState(true);
  const [recoveryComplete, setRecoveryComplete] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<{ correct: number; total: number } | null>(null);

  const loadMistakes = useCallback(async () => {
    try {
      setLoadingMistakes(true);
      const data = await getMistakes();
      const mapped: Question[] = (data || [])
        .map((item: any) => item.questions)
        .filter(Boolean);
      setMistakes(mapped);
    } catch (e) {
      console.error("Failed to load mistakes:", e);
      setMistakes([]);
    } finally {
      setLoadingMistakes(false);
    }
  }, []);

  useEffect(() => {
    loadMistakes();
  }, [loadMistakes]);

  const startRecovery = () => {
    // 打乱错题
    const shuffled = [...mistakes].sort(() => Math.random() - 0.5);
    setSelectedQuestions(shuffled);
    setMode("recovery");
  };

  const handleRecoveryComplete = (results: { correct: number; total: number; xpEarned: number }) => {
    setRecoveryResult({ correct: results.correct, total: results.total });
    setRecoveryComplete(true);
  };

  // 回血挑战完成页
  if (recoveryComplete && recoveryResult) {
    const heartsRecovered = recoveryResult.correct;
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-7xl mb-6"
          >
            {heartsRecovered > 0 ? <Icon name="heart" size={104} /> : <Icon name="flame" size={104} />}
          </motion.div>
          <h1 className="text-3xl font-bold text-slate-700 mb-2">
            {heartsRecovered > 0 ? "太棒了！红心恢复！" : "继续加油！"}
          </h1>
          <p className="text-slate-400 mb-8">
            答对 {recoveryResult.correct}/{recoveryResult.total} 题
          </p>

          <div className="w-full max-w-sm bg-white border-2 border-slate-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500">答对题数</span>
              <span className="font-bold text-lg text-[#58cc02]">{recoveryResult.correct}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-500">恢复红心</span>
              <span className="font-bold text-lg text-rose-500 flex items-center gap-1">+{heartsRecovered} <Icon name="heart" size={28} /></span>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-slate-500 font-medium">当前红心</span>
              <span className="font-bold text-xl text-rose-500">{hearts} / 5</span>
            </div>
          </div>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Button
            variant="primary"
            size="xl"
            className="w-full"
            onClick={() => {
              setMode("list");
              setRecoveryComplete(false);
              loadMistakes();
            }}
          >
            返回错题本
          </Button>
          <Button variant="ghost" size="lg" className="w-full" onClick={() => router.push("/learn")}>
            继续练习
          </Button>
        </div>
      </div>
    );
  }

  // 回血挑战模式
  if (mode === "recovery") {
    return (
      <Quiz
        questions={selectedQuestions}
        isMistakeRecovery
        onComplete={handleRecoveryComplete}
      />
    );
  }

  // 错题本列表模式
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2 justify-center">
          <Icon name="file-x" size={32} />
          错题本
        </h1>
        <p className="text-slate-400 mt-1">复习错题，巩固知识</p>
      </div>

      {/* 状态卡片 */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Icon name="heart" size={32} />
            <span className="font-bold text-slate-700">当前红心</span>
          </div>
          <span className="text-xl font-bold text-rose-500">{hearts} / 5</span>
        </div>
        <p className="text-sm text-slate-400">
          每答对1道错题，恢复1颗红心！
        </p>
      </div>

      {/* 开始回血挑战 */}
      {mistakes.length > 0 && (
        <Button
          variant="warning"
          size="xl"
          className="w-full"
          onClick={startRecovery}
        >
          <Icon name="rotate-ccw" size={28} />
          消灭错题恢复红心 ({mistakes.length}题)
        </Button>
      )}

      {/* 错题列表 */}
      <div className="space-y-3 mt-2">
        {loadingMistakes ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">正在加载错题...</p>
          </div>
        ) : mistakes.length === 0 ? (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-5xl mb-4"
            >
              🎉
            </motion.div>
            <p className="text-slate-500 font-medium">暂无错题</p>
            <p className="text-slate-400 text-sm mt-1">继续保持！</p>
          </div>
        ) : (
          mistakes.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border-2 border-slate-200 rounded-2xl p-4 hover:border-rose-200 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Icon name="x-circle" size={28} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-bold",
                      question.type === "judge" ? "bg-purple-100 text-purple-600" : "bg-green-100 text-green-600"
                    )}>
                      {question.type === "judge" ? "判断" : "单选"}
                    </span>
                    <span className="text-xs text-slate-400">{question.chapter}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-700 line-clamp-2">
                    {question.content}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Icon name="check-circle" size={24} />
                    <span className="text-xs text-[#58cc02] font-medium">
                      {question.correct_answer}. {question.options[question.correct_answer]}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
