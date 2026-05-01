"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Icon, type IconName } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useUserProgress } from "@/store/use-user-progress";
import { signOut } from "@/lib/auth-actions";
import { claimDailyTaskReward, getUserAchievements, getDailyTasks } from "@/lib/supabase/actions";
import { ACHIEVEMENTS, DAILY_TASKS, DAILY_TASK_REWARD_XP, DAILY_TASK_REWARD_XP_QUESTIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { UserAchievement, UserDailyTask } from "@/lib/types";

const iconMap: Record<string, IconName> = {
  Trophy: "trophy",
  BookOpen: "book",
  Target: "target",
  PenTool: "pen",
};

export default function ProfilePage() {
  const router = useRouter();
  const { hearts, xp, streak, totalCorrect, addXp: addXpLocal } = useUserProgress();
  const [signingOut, setSigningOut] = useState(false);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [dailyTasks, setDailyTasks] = useState<UserDailyTask[]>([]);
  const [claimingTaskId, setClaimingTaskId] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState("用户游客");
  const [loading, setLoading] = useState(true);

  const formatDisplayName = (email?: string | null) => {
    const emailPrefix = email?.split("@")[0]?.slice(0, 6) || "游客";
    return `用户${emailPrefix}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [achData, taskData] = await Promise.all([
          getUserAchievements(),
          getDailyTasks(),
        ]);
        setAchievements(achData);
        setDailyTasks(taskData);

        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        setDisplayName(formatDisplayName(authData?.user?.email));
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  const handleClaimTask = async (taskId: number) => {
    setClaimingTaskId(taskId);
    try {
      const result = await claimDailyTaskReward(taskId);
      if ((result as any)?.success) {
        const xpReward = (result as any).xpReward || DAILY_TASK_REWARD_XP;
        addXpLocal(xpReward);
        setDailyTasks((prev) =>
          prev.map((task) =>
            task.id === taskId ? { ...task, claimed: true } : task
          )
        );
      }
    } catch (e) {
      console.error("Failed to claim task reward:", e);
    } finally {
      setClaimingTaskId(null);
    }
  };

  const earnedCount = achievements.length;
  const totalAchievements = ACHIEVEMENTS.length;
  const getTaskRewardXp = (taskType: string) =>
    taskType === "answer_20_questions" ? DAILY_TASK_REWARD_XP_QUESTIONS : DAILY_TASK_REWARD_XP;
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
        requirement: "要求：任一章节累计答对100题",
        howTo: "方式：持续刷同一章节并尽量提高正确率",
      },
      answer_20_questions: {
        requirement: "要求：当日任意答题20道",
        howTo: "方式：章节练习/考试任意模式累计作答",
      },
    };
    return guides[taskType] || {
      requirement: "要求：完成任务进度条目标",
      howTo: "方式：按任务提示继续练习",
    };
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 用户信息卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#58cc02] to-[#4aad02] rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
            🐣
          </div>
          <div>
            <h2 className="font-bold text-xl">{displayName}</h2>
            <p className="text-white/70 text-sm">学无止境，继续加油！</p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <Icon name="star" size={28} />
            <p className="text-xl font-bold">{xp.toLocaleString()}</p>
            <p className="text-xs text-white/70">总经验</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <Icon name="flame" size={28} />
            <p className="text-xl font-bold">{streak}</p>
            <p className="text-xs text-white/70">连胜</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <Icon name="heart" size={28} />
            <p className="text-xl font-bold">{hearts}/5</p>
            <p className="text-xs text-white/70">红心</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <Icon name="check-circle" size={28} />
            <p className="text-xl font-bold">{totalCorrect}</p>
            <p className="text-xs text-white/70">答对</p>
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
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Icon name="gift" size={20} />
          今日任务
        </h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        ) : dailyTasks.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">暂无任务</p>
        ) : (
          <div className="space-y-3">
            {dailyTasks.map((task) => {
              const taskDef = DAILY_TASKS.find((t) => t.type === task.task_type);
              const progressPercent = task.target > 0 ? Math.round((task.progress / task.target) * 100) : 0;
              const taskGuide = getTaskGuide(task.task_type);
              return (
                <div key={task.id} className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0",
                    task.completed ? "bg-green-100" : "bg-slate-100"
                  )}>
                    {task.completed ? <Icon name="check-circle" size={20} /> : <Icon name={taskDef?.icon ? iconMap[taskDef.icon] || "book" : "book"} size={20} />}
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
                    {task.completed && !task.claimed && (
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-green-500 font-bold">
                          已完成！可领取奖励
                        </p>
                        <button
                          onClick={() => handleClaimTask(task.id)}
                          disabled={claimingTaskId === task.id}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-green-500 text-white hover:bg-green-600 disabled:opacity-60"
                        >
                          {claimingTaskId === task.id ? "领取中..." : `领取 +${getTaskRewardXp(task.task_type)} XP`}
                        </button>
                      </div>
                    )}
                    {task.claimed && (
                      <p className="text-xs text-green-500 font-bold mt-1">
                        已领取奖励 ✅
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* 成就展示 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border-2 border-slate-200 rounded-2xl p-5"
      >
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Icon name="trophy" size={20} />
          成就 ({earnedCount}/{totalAchievements})
        </h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-1.5">
            {ACHIEVEMENTS.slice(0, 60).map((ach) => {
              const unlocked = achievements.some((a) => a.achievement_key === ach.key);
              return (
                <div
                  key={ach.key}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center text-center p-0.5 transition-all",
                    unlocked
                      ? "bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200"
                      : "bg-slate-50 border border-slate-200 opacity-40"
                  )}
                  title={unlocked ? `${ach.name}: ${ach.description}` : "???"}
                >
                  {unlocked ? <Icon name="trophy" size={24} /> : <Icon name="lock" size={20} />}
                  <span className={cn(
                    "text-[8px] font-bold leading-tight mt-0.5",
                    unlocked ? "text-amber-700" : "text-slate-400"
                  )}>
                    {unlocked ? ach.name : "???"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {earnedCount > 60 && (
          <p className="text-center text-xs text-slate-400 mt-3">
            还有 {earnedCount - 60} 个已解锁成就未显示
          </p>
        )}
      </motion.div>

      {/* 快捷入口 */}
      <div className="grid gap-3">
        <QuickLink
          icon={<Icon name="book" size={20} />}
          label="章节练习"
          bg="bg-[#d4edc9]"
          onClick={() => router.push("/learn")}
        />
        <QuickLink
          icon={<Icon name="swords" size={20} />}
          label="模拟考试"
          bg="bg-[#fff3cc]"
          onClick={() => router.push("/exam")}
        />
        <QuickLink
          icon={<Icon name="trophy" size={20} />}
          label="排行榜"
          bg="bg-amber-50"
          onClick={() => router.push("/leaderboard")}
        />
        <QuickLink
          icon={<Icon name="file-x" size={20} />}
          label="错题本"
          bg="bg-[#ffe0e0]"
          onClick={() => router.push("/mistakes")}
        />
      </div>

      {/* 统计数据 */}
      <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Icon name="bar-chart" size={20} />
          学习统计
        </h3>
        <div className="space-y-3">
          <StatRow icon={<Icon name="flame" size={16} />} label="连续打卡" value={`${streak} 天`} color="text-orange-500" />
          <StatRow icon={<Icon name="zap" size={16} />} label="总经验值" value={`${xp.toLocaleString()} XP`} color="text-amber-500" />
          <StatRow icon={<Icon name="heart" size={16} />} label="当前红心" value={`${hearts}/5`} color="text-rose-500" />
          <StatRow icon={<Icon name="check-circle" size={16} />} label="累计答对" value={`${totalCorrect} 题`} color="text-green-500" />
          <StatRow icon={<Icon name="trophy" size={16} />} label="成就数量" value={`${earnedCount}/${totalAchievements}`} color="text-amber-500" />
        </div>
      </div>

      {/* 设置等操作 */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="lg"
          className="w-full justify-start text-slate-500"
        >
          <Icon name="settings" size={20} />
          设置
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <Loader2 className="w-5 h-5 mr-3 animate-spin" />
          ) : (
            <Icon name="log-out" size={20} />
          )}
          退出登录
        </Button>
      </div>

      <p className="text-center text-xs text-slate-400 pb-4">
        Duolingo-Style 刷题练习 v2.0
      </p>
    </div>
  );
}

function QuickLink({
  icon,
  label,
  bg,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  bg: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 w-full p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-slate-300 transition-all text-left"
    >
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", bg)}>
        {icon}
      </div>
      <span className="font-bold text-slate-700">{label}</span>
    </button>
  );
}

function StatRow({
  icon,
  label,
  value,
  color,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        {icon && <span className={cn(color)}>{icon}</span>}
        <span className="text-slate-500">{label}</span>
      </div>
      <span className={cn("font-bold", color)}>{value}</span>
    </div>
  );
}
