import { getSupabaseClient } from './supabase';
import {
  HEARTS_MAX,
  DAILY_TASK_REWARD_XP,
  DAILY_TASK_REWARD_XP_QUESTIONS,
  ACHIEVEMENTS,
  ACHIEVEMENT_XP_PER_LEVEL,
} from './constants';
import type { LeaderboardEntry } from './types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SB = any;

function sb(): SB {
  return getSupabaseClient();
}

export async function getQuestions(chapter?: string) {
  const supabase = sb();
  let query = supabase.from('questions').select('*');
  if (chapter && chapter !== 'all') {
    query = query.eq('chapter', chapter);
  }
  const { data, error } = await query.order('id');
  if (error) throw new Error(error.message);
  return data;
}

export async function getQuestionById(id: number) {
  const supabase = sb();
  const { data, error } = await supabase.from('questions').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getChapters() {
  const supabase = sb();
  const { data, error } = await supabase.from('questions').select('chapter').order('chapter');
  if (error) throw new Error(error.message);
  const chapters = [...new Set(data.map((q: any) => q.chapter).filter(Boolean))];
  return chapters;
}

export async function getUserProgress() {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from('user_progress').select('*').eq('user_id', user.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    const { data: newProgress, error: insertError } = await supabase.from('user_progress').insert({
      user_id: user.id, hearts: HEARTS_MAX, xp: 0, streak: 0, total_correct: 0, chapter_correct: {}, last_hearts_reset: new Date().toISOString().split('T')[0],
    }).select().single();
    if (insertError) throw new Error(insertError.message);
    return newProgress;
  }
  return data;
}

export async function addXp(amount: number): Promise<{ success: boolean; newXp: number }> {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data, error } = await supabase.rpc('add_xp', { p_user_id: user.id, p_amount: amount });
  if (error) {
    const progress = await getUserProgress();
    if (progress) {
      const currentXp = progress.xp || 0;
      const targetXp = currentXp + amount;
      const { error: updateError } = await supabase.from('user_progress').update({ xp: targetXp }).eq('user_id', user.id);
      if (updateError) return { success: false, newXp: currentXp };
      return { success: true, newXp: targetXp };
    }
    return { success: false, newXp: 0 };
  }
  return { success: true, newXp: data ?? 0 };
}

export async function removeHeart() {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const progress = await getUserProgress();
  if (!progress) throw new Error('Progress not found');
  const currentHearts = progress.hearts;
  if (currentHearts <= 0) return { error: 'hearts' as const };
  const { error } = await supabase.from('user_progress').update({ hearts: Math.max(currentHearts - 1, 0) }).eq('user_id', user.id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function addHeart() {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const progress = await getUserProgress();
  if (!progress) throw new Error('Progress not found');
  const currentHearts = progress.hearts;
  if (currentHearts >= HEARTS_MAX) return { error: 'full' as const };
  const { error } = await supabase.from('user_progress').update({ hearts: Math.min(currentHearts + 1, HEARTS_MAX) }).eq('user_id', user.id);
  if (error) throw new Error(error.message);
  return { success: true };
}

export async function resetHeartsIfNewDay() {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: progress, error } = await supabase.from('user_progress').select('*').eq('user_id', user.id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!progress) return null;
  const today = new Date().toISOString().split('T')[0];
  const lastReset = progress.last_hearts_reset;
  if (!lastReset || lastReset < today) {
    const { data: updated, error: updateError } = await supabase.from('user_progress').update({ hearts: HEARTS_MAX, last_hearts_reset: today }).eq('user_id', user.id).select().single();
    if (updateError) throw new Error(updateError.message);
    return updated;
  }
  return progress;
}

export async function updateStreakFromClient(): Promise<{ success: boolean; newStreak: number }> {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, newStreak: 0 };
  const progress = await getUserProgress();
  if (!progress) return { success: false, newStreak: 0 };
  const lastActive = progress.last_active ? new Date(progress.last_active).toISOString().split('T')[0] : null;
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  let newStreak = progress.streak || 0;
  if (lastActive === today) return { success: false, newStreak };
  if (lastActive === yesterday) { newStreak += 1; } else { newStreak = 1; }
  const { error } = await supabase.from('user_progress').update({ streak: newStreak, last_active: today }).eq('user_id', user.id);
  if (error) throw new Error(error.message);
  return { success: true, newStreak };
}

export async function updateMaxExamScore(score: number) {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const progress = await getUserProgress();
  if (!progress) throw new Error('Progress not found');
  const currentMax = progress.max_exam_score || 0;
  const nextMax = Math.max(currentMax, score);
  if (nextMax === currentMax) return { updated: false, max_exam_score: currentMax };
  const { error } = await supabase.from('user_progress').update({ max_exam_score: nextMax }).eq('user_id', user.id);
  if (error) throw new Error(error.message);
  return { updated: true, max_exam_score: nextMax };
}

export async function recordAnswer(questionId: number, isCorrect: boolean) {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: existing } = await supabase.from('user_actions').select('*').eq('user_id', user.id).eq('question_id', questionId).maybeSingle();
  if (existing) {
    const { error } = await supabase.from('user_actions').update({ is_correct: isCorrect, is_mistake: !isCorrect }).eq('id', existing.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from('user_actions').insert({ user_id: user.id, question_id: questionId, is_correct: isCorrect, is_mistake: !isCorrect });
    if (error) throw new Error(error.message);
  }
  if (isCorrect) {
    const progress = await getUserProgress();
    if (progress) {
      const currentChapterCorrect = progress.chapter_correct || {};
      const question = await getQuestionById(questionId);
      const chapter = question?.chapter || 'unknown';
      const newChapterCorrect = { ...currentChapterCorrect, [chapter]: (currentChapterCorrect[chapter] || 0) + 1 };
      await supabase.from('user_progress').update({ total_correct: (progress.total_correct || 0) + 1, chapter_correct: newChapterCorrect }).eq('user_id', user.id);
    }
  }
}

export async function toggleFavorite(questionId: number): Promise<{ success: boolean; isFavorite: boolean }> {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, isFavorite: false };
  const { data: existing } = await supabase.from('user_actions').select('*').eq('user_id', user.id).eq('question_id', questionId).maybeSingle();
  let isFavorite: boolean;
  if (existing) {
    isFavorite = !existing.is_favorite;
    const { error } = await supabase.from('user_actions').update({ is_favorite: isFavorite }).eq('id', existing.id);
    if (error) return { success: false, isFavorite: false };
  } else {
    isFavorite = true;
    const { error } = await supabase.from('user_actions').insert({ user_id: user.id, question_id: questionId, is_correct: false, is_mistake: false, is_favorite: true });
    if (error) return { success: false, isFavorite: false };
  }
  return { success: true, isFavorite };
}

export async function getFavorites() {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from('user_actions').select('*, questions(*)').eq('user_id', user.id).eq('is_favorite', true).order('created_at', { ascending: false });
  if (error) return [];
  return (data || []).map((item: any) => item.questions).filter(Boolean);
}

export async function removeFavorite(questionId: number) {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { error } = await supabase.from('user_actions').update({ is_favorite: false }).eq('user_id', user.id).eq('question_id', questionId);
  if (error) throw new Error(error.message);
}

export async function getMistakes() {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase.from('user_actions').select('*, questions(*)').eq('user_id', user.id).eq('is_mistake', true).order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}

export async function removeMistake(questionId: number) {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { error } = await supabase.from('user_actions').update({ is_mistake: false }).eq('user_id', user.id).eq('question_id', questionId);
  if (error) throw new Error(error.message);
}

export async function getExamQuestions(limit: number = 50) {
  const supabase = sb();
  const { data, error } = await supabase.from('questions').select('*').limit(limit);
  if (error) throw new Error(error.message);
  const shuffled = [...(data || [])].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

export async function checkAndUnlockAchievements() {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const progress = await getUserProgress();
  if (!progress) return [];
  const currentXp = progress.xp || 0;
  const earnedCount = Math.floor(currentXp / ACHIEVEMENT_XP_PER_LEVEL);
  const { data: unlocked } = await supabase.from('user_achievements').select('achievement_key').eq('user_id', user.id);
  const unlockedKeys = new Set((unlocked || []).map((u: any) => u.achievement_key));
  const newAchievements: string[] = [];
  for (let i = 1; i <= Math.min(earnedCount, ACHIEVEMENTS.length); i++) {
    const key = `achievement_${i}`;
    if (!unlockedKeys.has(key)) newAchievements.push(key);
  }
  if (newAchievements.length > 0) {
    const inserts = newAchievements.map((key) => ({ user_id: user.id, achievement_key: key }));
    const { error } = await supabase.from('user_achievements').insert(inserts);
    if (error) throw new Error(error.message);
  }
  return newAchievements;
}

export async function getUserAchievements() {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  await checkAndUnlockAchievements();
  const { data, error } = await supabase.from('user_achievements').select('*').eq('user_id', user.id).order('achievement_key');
  if (error) throw new Error(error.message);
  return data || [];
}

export async function getLeaderboard(limit: number = 50): Promise<LeaderboardEntry[]> {
  const supabase = sb();
  const { data, error } = await supabase.rpc('get_leaderboard', { p_limit: limit });
  if (error) throw new Error(error.message);
  return (data || []) as LeaderboardEntry[];
}

export async function getUserStats() {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { totalQuestions: 0, practiced: 0, mistakes: 0, favorites: 0 };
  const { count: totalQuestions } = await supabase.from('questions').select('*', { count: 'exact', head: true });
  const { count: practiced } = await supabase.from('user_actions').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
  const { count: mistakes } = await supabase.from('user_actions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_mistake', true);
  const { count: favorites } = await supabase.from('user_actions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_favorite', true);
  return { totalQuestions: totalQuestions || 0, practiced: practiced || 0, mistakes: mistakes || 0, favorites: favorites || 0 };
}

export async function getTodayCorrectCount(): Promise<number> {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const { count, error } = await supabase.from('user_actions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_correct', true).gte('created_at', today).lt('created_at', tomorrow);
  if (error) return 0;
  return count || 0;
}

export async function getDailyTasks() {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase.from('user_daily_tasks').select('*').eq('user_id', user.id).eq('task_date', today);
  if (error) return [];
  if (!data || data.length === 0) {
    const defaultTasks = [
      { user_id: user.id, task_date: today, task_type: 'exam_pass', progress: 0, target: 1 },
      { user_id: user.id, task_date: today, task_type: 'chapter_practice', progress: 0, target: 1 },
      { user_id: user.id, task_date: today, task_type: 'chapter_correct_50', progress: 0, target: 100 },
      { user_id: user.id, task_date: today, task_type: 'answer_20_questions', progress: 0, target: 20 },
    ];
    const { data: newTasks, error: insertError } = await supabase.from('user_daily_tasks').insert(defaultTasks).select();
    if (insertError) return [];
    return newTasks || [];
  }
  return data;
}

export async function updateDailyTaskProgress(taskType: string, progressIncrement: number = 1) {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const today = new Date().toISOString().split('T')[0];
  const { data: task } = await supabase.from('user_daily_tasks').select('*').eq('user_id', user.id).eq('task_date', today).eq('task_type', taskType).maybeSingle();
  if (!task) return null;
  let newProgress;
  if (taskType === 'chapter_correct_50') {
    newProgress = await getTodayCorrectCount();
  } else {
    newProgress = Math.min(task.progress + progressIncrement, task.target);
  }
  const completed = newProgress >= task.target;
  const { data: updatedTask, error } = await supabase.from('user_daily_tasks').update({ progress: newProgress, completed }).eq('id', task.id).select().single();
  if (error) throw new Error(error.message);
  return updatedTask;
}

export async function claimDailyTaskReward(taskId: number) {
  const supabase = sb();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');
  const { data: task } = await supabase.from('user_daily_tasks').select('*').eq('id', taskId).eq('user_id', user.id).single();
  if (!task || task.claimed) return { error: 'already_claimed' };
  if (!task.completed) return { error: 'not_completed' };
  const { error: updateError } = await supabase.from('user_daily_tasks').update({ claimed: true }).eq('id', taskId);
  if (updateError) throw new Error(updateError.message);
  const rewardXp = task.task_type === 'answer_20_questions' ? DAILY_TASK_REWARD_XP_QUESTIONS : DAILY_TASK_REWARD_XP;
  const xpResult = await addXp(rewardXp);
  return { success: true, xpReward: rewardXp, newXp: xpResult.newXp };
}
