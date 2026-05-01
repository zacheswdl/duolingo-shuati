export type Question = {
  id: number;
  chapter: string;
  type: "single" | "multiple" | "judge";
  content: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
  created_at?: string;
};

export type UserProgress = {
  id: number;
  user_id: string;
  hearts: number;
  xp: number;
  streak: number;
  total_correct: number;
  chapter_correct: Record<string, number>;
  last_active: string | null;
  created_at: string;
};

export type UserAction = {
  id: number;
  user_id: string;
  question_id: number;
  is_correct: boolean;
  is_mistake: boolean;
  created_at: string;
  questions?: Question;
};

export type UserAchievement = {
  id: number;
  user_id: string;
  achievement_key: string;
  unlocked_at: string;
};

export type UserDailyTask = {
  id: number;
  user_id: string;
  task_date: string;
  task_type: string;
  progress: number;
  target: number;
  completed: boolean;
  claimed: boolean;
  created_at: string;
};

export type LeaderboardEntry = {
  user_id: string;
  xp: number;
  streak: number;
  rank: number;
  display_name?: string;
  max_exam_score?: number;
};

export type Achievement = {
  key: string;
  name: string;
  description: string;
};

export type DailyTaskDef = {
  type: string;
  name: string;
  icon: string;
  description: string;
};
