"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Question } from "@/lib/types";
import { getFavorites, removeFavorite } from "@/lib/supabase/actions";
import { toast } from "sonner";

export default function FavoritesPage() {
  const router = useRouter();
  const [favorites, setFavorites] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getFavorites();
      setFavorites(data);
    } catch (e) {
      console.error("Failed to load favorites:", e);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const handleRemoveFavorite = async (questionId: number) => {
    try {
      await removeFavorite(questionId);
      setFavorites((prev) => prev.filter((q) => q.id !== questionId));
      toast.success("已取消收藏", { duration: 2000 });
    } catch (e) {
      console.error("Failed to remove favorite:", e);
      toast.error("取消收藏失败", { duration: 2000 });
    }
  };

  const handlePractice = () => {
    if (favorites.length === 0) return;
    const shuffled = [...favorites].sort(() => Math.random() - 0.5);
    // 使用localStorage传递收藏题目
    localStorage.setItem("favoriteQuestions", JSON.stringify(shuffled));
    router.push("/lesson?mode=favorites");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-700 flex items-center gap-2 justify-center">
          <Icon name="star" size={32} />
          我的收藏
        </h1>
        <p className="text-slate-400 mt-1">收藏有价值的题目，方便复习</p>
      </div>

      {/* 开始练习按钮 */}
      {favorites.length > 0 && (
        <Button
          variant="primary"
          size="xl"
          className="w-full"
          onClick={handlePractice}
        >
          <Icon name="book" size={28} />
          练习收藏题目 ({favorites.length}题)
        </Button>
      )}

      {/* 收藏列表 */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">正在加载收藏...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-5xl mb-4"
            >
              ⭐
            </motion.div>
            <p className="text-slate-500 font-medium">暂无收藏</p>
            <p className="text-slate-400 text-sm mt-1">在答题页面点击收藏按钮添加</p>
          </div>
        ) : (
          favorites.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border-2 border-slate-200 rounded-2xl p-4 hover:border-amber-200 transition-colors"
            >
              <div className="flex items-start gap-3">
                <Icon name="star" size={28} className="text-amber-500" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-bold",
                      question.type === "judge" ? "bg-purple-100 text-purple-600" :
                      question.type === "multiple" ? "bg-blue-100 text-blue-600" :
                      "bg-green-100 text-green-600"
                    )}>
                      {question.type === "judge" ? "判断" : question.type === "multiple" ? "多选" : "单选"}
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
                  {question.explanation && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {question.explanation}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveFavorite(question.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                >
                  <Icon name="x-circle" size={24} />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}