"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "./server";
import { HEARTS_MAX, XP_PER_CORRECT, MISTAKE_RECOVERY_COUNT, EXAM_PASS_BONUS_XP, DAILY_TASK_REWARD_XP, DAILY_TASK_REWARD_XP_QUESTIONS, ACHIEVEMENTS, ACHIEVEMENT_XP_PER_LEVEL } from "@/lib/constants";
import type { LeaderboardEntry } from "@/lib/types";

// ============ 题库操作 ============

export async function getQuestions(chapter?: string) {
  const supabase = await createServerSupabaseClient();
  let query = supabase.from("questions").select("*");

  if (chapter && chapter !== "all") {
    query = query.eq("chapter", chapter);
  }

  const { data, error } = await query.order("id");

  if (error) throw new Error(error.message);
  return data;
}

export async function getQuestionById(id: number) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function getChapters() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("questions")
    .select("chapter")
    .order("chapter");

  if (error) throw new Error(error.message);
  const chapters = [...new Set(data.map((q) => q.chapter).filter(Boolean))];
  return chapters;
}

// ============ 用户进度操作 ============

export async function getUserProgress() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    // 创建默认进度
    const { data: newProgress, error: insertError } = await supabase
      .from("user_progress")
      .insert({
        user_id: user.id,
        hearts: HEARTS_MAX,
        xp: 0,
        streak: 0,
        total_correct: 0,
        chapter_correct: {},
      })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);
    return newProgress;
  }

  return data;
}

export async function addXp(amount: number) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.rpc("add_xp", {
    p_user_id: user.id,
    p_amount: amount,
  });

  if (error) {
    // fallback: 直接更新
    const progress = await getUserProgress();
    if (progress) {
      await supabase
        .from("user_progress")
        .update({ xp: (progress as any).xp + amount })
        .eq("user_id", user.id);
    }
  }

  revalidatePath("/learn");
  revalidatePath("/lesson");
  revalidatePath("/profile");
  revalidatePath("/leaderboard");
}

export async function removeHeart() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const progress = await getUserProgress();
  if (!progress) throw new Error("Progress not found");

  const currentHearts = (progress as any).hearts;

  if (currentHearts <= 0) {
    return { error: "hearts" as const };
  }

  const { error } = await supabase
    .from("user_progress")
    .update({ hearts: Math.max(currentHearts - 1, 0) })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/learn");
  revalidatePath("/lesson");
  revalidatePath("/mistakes");
  return { success: true };
}

export async function addHeart() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const progress = await getUserProgress();
  if (!progress) throw new Error("Progress not found");

  const currentHearts = (progress as any).hearts;

  if (currentHearts >= HEARTS_MAX) {
    return { error: "full" as const };
  }

  const { error } = await supabase
    .from("user_progress")
    .update({ hearts: Math.min(currentHearts + 1, HEARTS_MAX) })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/learn");
  revalidatePath("/mistakes");
  return { success: true };
}

export async function updateStreak() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  const progress = await getUserProgress();
  if (!progress) return;

  const lastActive = (progress as any).last_active
    ? new Date((progress as any).last_active).toISOString().split("T")[0]
    : null;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let newStreak = (progress as any).streak || 0;

  if (lastActive === today) {
    // 已经打过卡了
    return;
  }

  if (lastActive === yesterday) {
    // 连续打卡
    newStreak += 1;
  } else {
    // 中断，从1开始
    newStreak = 1;
  }

  const { error } = await supabase
    .from("user_progress")
    .update({
      streak: newStreak,
      last_active: today,
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/learn");
  revalidatePath("/profile");
}

export async function updateStreakFromClient(): Promise<{ success: boolean; newStreak: number }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, newStreak: 0 };

  const progress = await getUserProgress();
  if (!progress) return { success: false, newStreak: 0 };

  const lastActive = (progress as any).last_active
    ? new Date((progress as any).last_active).toISOString().split("T")[0]
    : null;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  let newStreak = (progress as any).streak || 0;

  if (lastActive === today) {
    return { success: false, newStreak };
  }

  if (lastActive === yesterday) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  const { error } = await supabase
    .from("user_progress")
    .update({
      streak: newStreak,
      last_active: today,
    })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/learn");
  revalidatePath("/profile");

  return { success: true, newStreak };
}

export async function updateMaxExamScore(score: number) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const progress = await getUserProgress();
  if (!progress) throw new Error("Progress not found");

  const currentMax = (progress as any).max_exam_score || 0;
  const nextMax = Math.max(currentMax, score);

  if (nextMax === currentMax) return { updated: false, max_exam_score: currentMax };

  const { error } = await supabase
    .from("user_progress")
    .update({ max_exam_score: nextMax })
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/exam");
  revalidatePath("/leaderboard");
  return { updated: true, max_exam_score: nextMax };
}

// ============ 答题记录操作 ============

export async function recordAnswer(
  questionId: number,
  isCorrect: boolean
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // 检查是否已有记录
  const { data: existing } = await supabase
    .from("user_actions")
    .select("*")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .maybeSingle();

  if (existing) {
    // 更新已有记录
    const { error } = await supabase
      .from("user_actions")
      .update({
        is_correct: isCorrect,
        is_mistake: !isCorrect,
      })
      .eq("id", existing.id);

    if (error) throw new Error(error.message);
  } else {
    // 新建记录
    const { error } = await supabase.from("user_actions").insert({
      user_id: user.id,
      question_id: questionId,
      is_correct: isCorrect,
      is_mistake: !isCorrect,
    });

    if (error) throw new Error(error.message);
  }

  // 更新累计答对题数
  if (isCorrect) {
    const progress = await getUserProgress();
    if (progress) {
      const currentChapterCorrect = (progress as any).chapter_correct || {};
      // 获取题目章节
      const question = await getQuestionById(questionId);
      const chapter = question?.chapter || "unknown";
      const newChapterCorrect = {
        ...currentChapterCorrect,
        [chapter]: (currentChapterCorrect[chapter] || 0) + 1,
      };

      await supabase
        .from("user_progress")
        .update({
          total_correct: ((progress as any).total_correct || 0) + 1,
          chapter_correct: newChapterCorrect,
        })
        .eq("user_id", user.id);
    }
  }
}

// ============ 收藏操作 ============

export async function toggleFavorite(questionId: number): Promise<{ success: boolean; isFavorite: boolean }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, isFavorite: false };

  // 检查是否已有记录
  const { data: existing } = await supabase
    .from("user_actions")
    .select("*")
    .eq("user_id", user.id)
    .eq("question_id", questionId)
    .maybeSingle();

  let isFavorite: boolean;

  if (existing) {
    // 更新已有记录的收藏状态
    isFavorite = !(existing as any).is_favorite;
    const { error } = await supabase
      .from("user_actions")
      .update({ is_favorite: isFavorite })
      .eq("id", existing.id);

    if (error) {
      console.error("Failed to update favorite:", error);
      return { success: false, isFavorite: false };
    }
  } else {
    // 创建新记录，标记为收藏
    isFavorite = true;
    const { error } = await supabase.from("user_actions").insert({
      user_id: user.id,
      question_id: questionId,
      is_correct: false,
      is_mistake: false,
      is_favorite: true,
    });

    if (error) {
      console.error("Failed to insert favorite:", error);
      return { success: false, isFavorite: false };
    }
  }

  revalidatePath("/learn");
  revalidatePath("/favorites");
  return { success: true, isFavorite };
}

export async function getFavorites() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("user_actions")
    .select("*, questions(*)")
    .eq("user_id", user.id)
    .eq("is_favorite", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to get favorites:", error);
    return [];
  }

  return (data || []).map((item: any) => item.questions).filter(Boolean);
}

export async function removeFavorite(questionId: number) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("user_actions")
    .update({ is_favorite: false })
    .eq("user_id", user.id)
    .eq("question_id", questionId);

  if (error) throw new Error(error.message);
  
  revalidatePath("/learn");
  revalidatePath("/favorites");
}

// ============ 错题本操作 ============

export async function getMistakes() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("user_actions")
    .select("*, questions(*)")
    .eq("user_id", user.id)
    .eq("is_mistake", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function removeMistake(questionId: number) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("user_actions")
    .update({ is_mistake: false })
    .eq("user_id", user.id)
    .eq("question_id", questionId);

  if (error) throw new Error(error.message);
  revalidatePath("/mistakes");
}

export async function getMistakeRecoveryProgress() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { consecutiveCorrect: 0, heartsRecovered: 0 };

  // 获取最近的对错题记录（只算错题重做）
  const { data } = await supabase
    .from("user_actions")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_mistake", false)
    .order("created_at", { ascending: false })
    .limit(MISTAKE_RECOVERY_COUNT);

  const consecutiveCorrect = data?.length || 0;
  const heartsRecovered = Math.floor(consecutiveCorrect / MISTAKE_RECOVERY_COUNT);

  return { consecutiveCorrect, heartsRecovered };
}

// ============ 模拟考试 ============

export async function getExamQuestions(limit: number = 50) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .limit(limit);

  if (error) throw new Error(error.message);

  // 随机打乱
  const shuffled = [...(data || [])].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

// ============ 成就系统 ============

export async function checkAndUnlockAchievements() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const progress = await getUserProgress();
  if (!progress) return [];

  const currentXp = (progress as any).xp || 0;

  // 计算应该解锁的成就数量
  const earnedCount = Math.floor(currentXp / ACHIEVEMENT_XP_PER_LEVEL);

  // 获取已解锁的成就
  const { data: unlocked } = await supabase
    .from("user_achievements")
    .select("achievement_key")
    .eq("user_id", user.id);

  const unlockedKeys = new Set((unlocked || []).map((u: any) => u.achievement_key));

  // 找出新解锁的成就
  const newAchievements: string[] = [];
  for (let i = 1; i <= Math.min(earnedCount, ACHIEVEMENTS.length); i++) {
    const key = `achievement_${i}`;
    if (!unlockedKeys.has(key)) {
      newAchievements.push(key);
    }
  }

  // 插入新成就
  if (newAchievements.length > 0) {
    const inserts = newAchievements.map((key) => ({
      user_id: user.id,
      achievement_key: key,
    }));

    const { error } = await supabase.from("user_achievements").insert(inserts);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/profile");
  return newAchievements;
}

export async function getUserAchievements() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  // 兜底同步：避免因异步时序导致经验已达标但成就未及时解锁
  await checkAndUnlockAchievements();

  const { data, error } = await supabase
    .from("user_achievements")
    .select("*")
    .eq("user_id", user.id)
    .order("achievement_key");

  if (error) throw new Error(error.message);
  return data || [];
}

// ============ 排行榜 ============

export async function getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .rpc("get_leaderboard", { p_limit: limit });

  if (error) throw new Error(error.message);
  return (data || []) as LeaderboardEntry[];
}

export async function getUserRank(userId: string): Promise<LeaderboardEntry | null> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .rpc("get_user_rank", { p_user_id: userId });

  if (error) throw new Error(error.message);
  return (data && data.length > 0 ? data[0] : null) as LeaderboardEntry | null;
}


// ============ 用户统计数据 ============

export async function getUserStats() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { totalQuestions: 0, practiced: 0, mistakes: 0, favorites: 0 };
  }

  // 统计总题目数
  const { count: totalQuestions, error: questionsError } = await supabase
    .from("questions")
    .select("*", { count: "exact", head: true });

  // 统计已练习数（用户作答过的题目数）
  const { count: practiced, error: practicedError } = await supabase
    .from("user_actions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // 统计错题数
  const { count: mistakes, error: mistakesError } = await supabase
    .from("user_actions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_mistake", true);

  // 统计收藏数
  const { count: favorites, error: favoritesError } = await supabase
    .from("user_actions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_favorite", true);

  if (favoritesError) console.error("Failed to get favorites count:", favoritesError);

  if (questionsError) console.error("Failed to get total questions:", questionsError);
  if (practicedError) console.error("Failed to get practiced count:", practicedError);
  if (mistakesError) console.error("Failed to get mistakes count:", mistakesError);

  return {
    totalQuestions: totalQuestions || 0,
    practiced: practiced || 0,
    mistakes: mistakes || 0,
    favorites: favorites || 0,
  };
}

// ============ 每日任务 ============

export async function getTodayCorrectCount(): Promise<number> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return 0;

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const { count, error } = await supabase
    .from('user_actions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_correct', true)
    .gte('created_at', today)
    .lt('created_at', tomorrow);

  if (error) {
    console.error('Failed to get today correct count:', error);
    return 0;
  }

  return count || 0;
}

export async function getDailyTasks() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return [];

  const today = new Date().toISOString().split("T")[0];

  // 获取今天的任务
  const { data, error } = await supabase
    .from("user_daily_tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("task_date", today);

  // 如果表不存在，返回空数组
  if (error) {
    console.error("Failed to get daily tasks (table may not exist yet):", error.message);
    return [];
  }

  // 如果没有任务，创建默认任务
  if (!data || data.length === 0) {
    const defaultTasks = [
      { user_id: user.id, task_date: today, task_type: "exam_pass", progress: 0, target: 1 },
      { user_id: user.id, task_date: today, task_type: "chapter_practice", progress: 0, target: 1 },
      { user_id: user.id, task_date: today, task_type: "chapter_correct_50", progress: 0, target: 100 },
      { user_id: user.id, task_date: today, task_type: "answer_20_questions", progress: 0, target: 20 },
    ];

    const { data: newTasks, error: insertError } = await supabase
      .from("user_daily_tasks")
      .insert(defaultTasks)
      .select();

    if (insertError) {
      console.error("Failed to create daily tasks (table may not exist yet):", insertError.message);
      return [];
    }
    return newTasks || [];
  }

  return data;
}

export async function updateDailyTaskProgress(taskType: string, progressIncrement: number = 1) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const today = new Date().toISOString().split("T")[0];

  // 获取当前任务
  const { data: task } = await supabase
    .from("user_daily_tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("task_date", today)
    .eq("task_type", taskType)
    .maybeSingle();

  if (!task) return null;

  // 如果是答题达人任务，重新计算今日累计答对题数
  let newProgress;
  if (taskType === "chapter_correct_50") {
    newProgress = await getTodayCorrectCount();
  } else {
    newProgress = Math.min((task as any).progress + progressIncrement, (task as any).target);
  }
  
  const completed = newProgress >= (task as any).target;

  const { data: updatedTask, error } = await supabase
    .from("user_daily_tasks")
    .update({
      progress: newProgress,
      completed,
    })
    .eq("id", (task as any).id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/learn");
  revalidatePath("/profile");
  return updatedTask;
}

export async function claimDailyTaskReward(taskId: number) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  // 获取任务
  const { data: task } = await supabase
    .from("user_daily_tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (!task || (task as any).claimed) return { error: "already_claimed" };
  if (!(task as any).completed) return { error: "not_completed" };

  // 标记已领取
  const { error: updateError } = await supabase
    .from("user_daily_tasks")
    .update({ claimed: true })
    .eq("id", taskId);

  if (updateError) throw new Error(updateError.message);

  // 发放奖励（刷题20道任务奖励50经验值，其他任务奖励100经验值）
  const rewardXp = (task as any).task_type === "answer_20_questions" ? DAILY_TASK_REWARD_XP_QUESTIONS : DAILY_TASK_REWARD_XP;
  await addXp(rewardXp);

  revalidatePath("/learn");
  revalidatePath("/profile");
  return { success: true, xpReward: rewardXp };
}
