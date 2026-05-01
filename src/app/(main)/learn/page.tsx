"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Book, FileText, CheckCircle, XCircle, Star } from "lucide-react";
import { Icon, type IconName } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useUserProgress } from "@/store/use-user-progress";
import { getChapters, getDailyTasks, getUserStats, getLeaderboard, getUserRank } from "@/lib/supabase/actions";
import { DAILY_TASKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { UserDailyTask, LeaderboardEntry } from "@/lib/types";

const iconMap: Record<string, IconName> = {
  Trophy: "trophy",
  BookOpen: "book",
  Target: "target",
  PenTool: "pen",
};

const chapterNameMap: Record<string, string> = {
  chapter_judge: "判断题",
  chapter_multiple: "多选题",
  chapter_single: "单选题",
};

const getChapterDisplayName = (chapter: string): string => {
  return chapterNameMap[chapter] || chapter;
};

export default function LearnPage() {
  const router = useRouter();
  const { hearts, xp, streak, isLoading } = useUserProgress();
  const [chapters, setChapters] = useState<string[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [dailyTasks, setDailyTasks] = useState<UserDailyTask[]>([]);
  const [stats, setStats] = useState({ totalQuestions: 0, practiced: 0, mistakes: 0, favorites: 0 });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [myRankEntry, setMyRankEntry] = useState<LeaderboardEntry | null>(null);
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false);
  
  const getTaskGuide = (taskType: string) => {
    const guides: Record<string, { requirement: string; howTo: string }> = {
      exam_pass: {
        requirement: "要求：模拟考试达到90分及以上",
        howTo: "方式：进入“模拟考试”完成一次考试",
      },
      chapter_practice: {
        requirement: "要求：完成1次章节练习",
        howTo: "方式：进入“章节练习”并完成一轮题目",
      },
      chapter_correct_50: {
        requirement: "要求：今日累计答对100题",
        howTo: "方式：持续刷题，当日答对题目自动累计",
      },
      answer_20_questions: {
        requirement: "要求：今日任意刷题20道",
        howTo: "方式：章节练习/考试任意模式累计作答",
      },
    };
    return guides[taskType] || {
      requirement: "要求：完成任务进度条目标",
      howTo: "方式：按任务提示继续练习",
    };
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [chaptersData, tasksData, statsData, leaderboardData] = await Promise.all([
          getChapters(),
          getDailyTasks(),
          getUserStats(),
          getLeaderboard(50),
        ]);
        setChapters(chaptersData);
        setDailyTasks(tasksData);
        setStats(statsData);
        setLeaderboard(leaderboardData);

        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (user) {
          setCurrentUserId(user.id);
          if (!leaderboardData.find((e: LeaderboardEntry) => e.user_id === user.id)) {
            try {
              const rankEntry = await getUserRank(user.id);
              setMyRankEntry(rankEntry);
            } catch (err) {
              console.error("Failed to load user rank:", err);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoadingChapters(false);
      }
    };
    load();
  }, []);

  const progressPercent = stats.totalQuestions > 0 
    ? Math.min((stats.practiced / stats.totalQuestions) * 100, 100) 
    : 0;

  if (isLoading || loadingChapters) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 统计信息面板 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-4"
      >
        {/* 题库名称卡片 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Book className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">学习是你自己该偷着去做的自私行为</h2>
              <p className="text-blue-100 text-sm">2026.5.1内测 欢迎大家提出宝贵的改进建议，13587635027同微信</p>
            </div>
          </div>
        </div>

        {/* 排行榜模块 */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <Icon name="trophy" size={20} />
              排行榜
            </h3>
            <button
              onClick={() => router.push("/leaderboard")}
              className="text-xs text-blue-500 font-bold hover:text-blue-600 transition-colors"
            >
              查看完整排行 →
            </button>
          </div>

          {/* 我的排名 */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="trophy" size={20} />
                <span className="text-sm font-bold text-amber-700">我的排名</span>
              </div>
              <span className="text-xl font-bold text-amber-600">
                #{leaderboard.find((e) => e.user_id === currentUserId)?.rank || myRankEntry?.rank || "?"}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 bg-amber-100 rounded-lg px-2 py-1">
                <Icon name="star" size={16} />
                <span className="text-xs font-bold text-amber-700">{xp.toLocaleString()} XP</span>
              </div>
              <div className="flex items-center gap-1 bg-orange-100 rounded-lg px-2 py-1">
                <Icon name="flame" size={16} />
                <span className="text-xs font-bold text-orange-700">连续{streak}天</span>
              </div>
            </div>
          </div>

          {/* 排行榜列表 */}
          <div className="space-y-2">
            {(showAllLeaderboard ? leaderboard : leaderboard.slice(0, 5)).map((entry, index) => {
              const isMe = entry.user_id === currentUserId;
              const rankIcon = entry.rank === 1 ? <Icon name="crown" size={20} /> : entry.rank <= 3 ? <Icon name="medal" size={20} /> : null;
              return (
                <div
                  key={entry.user_id}
                  className={cn(
                    "flex items-center gap-3 p-2.5 rounded-xl border transition-all",
                    isMe
                      ? "bg-blue-50 border-blue-200"
                      : entry.rank === 1
                      ? "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200"
                      : entry.rank === 2
                      ? "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200"
                      : entry.rank === 3
                      ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200"
                      : "bg-white border-slate-100"
                  )}
                >
                  <div className="w-7 flex items-center justify-center shrink-0">
                    {rankIcon || <span className="text-sm font-bold text-slate-400">#{entry.rank}</span>}
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-[#58cc02] to-[#4aad02] rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {String.fromCharCode(65 + (entry.rank - 1) % 26)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-bold truncate", isMe ? "text-blue-700" : "text-slate-700")}>
                      {entry.display_name || `用户${entry.user_id.slice(0, 6)}`}
                      {isMe && <span className="text-xs text-blue-500 ml-1">(我)</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Icon name="star" size={14} />
                    <span className="text-xs font-bold text-amber-600">{entry.xp.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {leaderboard.length > 5 && (
            <button
              onClick={() => setShowAllLeaderboard(!showAllLeaderboard)}
              className="w-full text-center text-sm text-slate-400 font-medium mt-3 py-2 hover:text-slate-600 transition-colors"
            >
              {showAllLeaderboard ? "收起" : `展开全部 ${leaderboard.length} 名`}
            </button>
          )}
        </div>

        {/* 统计数字 */}
        <div className="grid grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-2 border-slate-200 rounded-xl p-4 text-center"
          >
            <div className="flex items-center justify-center mb-2">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.totalQuestions}</p>
            <p className="text-xs text-slate-400 mt-1">总题目</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white border-2 border-slate-200 rounded-xl p-4 text-center"
          >
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.practiced}</p>
            <p className="text-xs text-slate-400 mt-1">已练习</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white border-2 border-slate-200 rounded-xl p-4 text-center"
          >
            <div className="flex items-center justify-center mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.mistakes}</p>
            <p className="text-xs text-slate-400 mt-1">错题</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-white border-2 border-slate-200 rounded-xl p-4 text-center"
          >
            <div className="flex items-center justify-center mb-2">
              <Star className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.favorites}</p>
            <p className="text-xs text-slate-400 mt-1">收藏</p>
          </motion.div>
        </div>

        {/* 总进度条 */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-600">总进度</span>
            <span className="text-sm font-bold text-blue-600">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* 每日任务 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border-2 border-slate-200 rounded-2xl p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Icon name="gift" size={28} />
            今日任务
          </h3>
          <span className="text-xs text-slate-400 font-bold">
            {dailyTasks.filter((t) => t.completed).length}/{dailyTasks.length}
          </span>
        </div>
        <div className="space-y-3">
          {dailyTasks.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-2">加载中...</p>
          ) : (
            dailyTasks.map((task) => {
              const taskDef = DAILY_TASKS.find((t) => t.type === task.task_type);
              const progressPercent = task.target > 0 ? Math.round((task.progress / task.target) * 100) : 0;
              const taskGuide = getTaskGuide(task.task_type);
              return (
                <div key={task.id} className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0",
                    task.completed ? "bg-green-100" : "bg-slate-100"
                  )}>
                    {task.completed ? <Icon name="check-circle" size={26} /> : <Icon name={taskDef?.icon ? iconMap[taskDef.icon] || "book" : "book"} size={26} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={cn(
                        "text-sm font-bold",
                        task.completed ? "text-green-600" : "text-slate-600"
                      )}>
                        {taskDef?.name || task.task_type}
                      </span>
                      <span className="text-xs text-slate-400">
                        {task.progress}/{task.target}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-1">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          task.completed ? "bg-green-500" : "bg-amber-400"
                        )}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{taskGuide.requirement}</p>
                    <p className="text-xs text-slate-400">{taskGuide.howTo}</p>
                    {task.claimed && (
                      <p className="text-xs text-green-500 font-bold mt-1">
                        已领取奖励 ✅
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* 章节列表 */}
      <div>
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Icon name="book" size={28} />
          章节练习
        </h2>
        <div className="grid gap-3">
          {chapters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-2">暂无章节数据</p>
              <p className="text-sm text-slate-300">请先导入题库</p>
            </div>
          ) : (
            chapters.map((chapter, index) => (
              <motion.button
                key={chapter}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/lesson?chapter=${encodeURIComponent(chapter)}`)}
                className="flex items-center gap-4 w-full p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-[#58cc02] hover:bg-[#d4edc9]/20 transition-all text-left"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-[#58cc02] to-[#4aad02] rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-700 truncate">{getChapterDisplayName(chapter)}</p>
                  <p className="text-sm text-slate-400">点击开始练习</p>
                </div>
                <Icon name="book" size={24} style={{ opacity: 0.5 }} />
              </motion.button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
