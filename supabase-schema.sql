-- ============ 题库表 ============
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  chapter TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT 'single' CHECK (type IN ('single', 'multiple', 'judge')),
  content TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer TEXT NOT NULL,
  explanation TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_questions_chapter ON questions(chapter);

-- ============ 用户进度表 ============
CREATE TABLE IF NOT EXISTS user_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hearts INTEGER NOT NULL DEFAULT 5,
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  max_exam_score INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  chapter_correct JSONB NOT NULL DEFAULT '{}',
  last_active DATE,
  last_hearts_reset DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============ 用户答题记录表 ============
CREATE TABLE IF NOT EXISTS user_actions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  is_mistake BOOLEAN NOT NULL DEFAULT false,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, question_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_mistake ON user_actions(user_id, is_mistake) WHERE is_mistake = true;
CREATE INDEX IF NOT EXISTS idx_user_actions_favorite ON user_actions(user_id, is_favorite) WHERE is_favorite = true;

-- ============ 用户成就表 ============
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_key)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);

-- ============ 用户每日任务表 ============
CREATE TABLE IF NOT EXISTS user_daily_tasks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_date DATE NOT NULL DEFAULT CURRENT_DATE,
  task_type TEXT NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  target INTEGER NOT NULL DEFAULT 1,
  completed BOOLEAN NOT NULL DEFAULT false,
  claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, task_date, task_type)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_tasks_user_date ON user_daily_tasks(user_id, task_date);

-- ============ 排行榜函数 ============
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  user_id UUID,
  xp INTEGER,
  streak INTEGER,
  rank BIGINT,
  display_name TEXT,
  max_exam_score INTEGER
) LANGUAGE SQL SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT
    up.user_id,
    up.xp,
    up.streak,
    ROW_NUMBER() OVER (ORDER BY up.xp DESC)::BIGINT AS rank,
    ('用户' || LEFT(COALESCE(SPLIT_PART(au.email, '@', 1), up.user_id::TEXT), 6))::TEXT AS display_name,
    COALESCE(up.max_exam_score, 0) AS max_exam_score
  FROM user_progress up
  LEFT JOIN auth.users au ON au.id = up.user_id
  ORDER BY up.xp DESC
  LIMIT p_limit;
$$;

-- ============ 增加经验值函数 ============
CREATE OR REPLACE FUNCTION add_xp(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_xp INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Cannot add XP for another user';
  END IF;
  UPDATE user_progress
  SET xp = xp + p_amount
  WHERE user_id = p_user_id
  RETURNING xp INTO new_xp;
  IF new_xp IS NULL THEN
    INSERT INTO user_progress (user_id, hearts, xp, streak, total_correct, chapter_correct, last_hearts_reset)
    VALUES (p_user_id, 5, p_amount, 0, 0, '{}', CURRENT_DATE)
    RETURNING xp INTO new_xp;
  END IF;
  RETURN new_xp;
END;
$$;

-- ============ 行级安全策略 ============

-- questions: 所有人可读
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "questions_select_policy" ON questions;
CREATE POLICY "questions_select_policy" ON questions FOR SELECT USING (true);

-- user_progress: 用户只能读写自己的
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_progress_select_policy" ON user_progress;
DROP POLICY IF EXISTS "user_progress_insert_policy" ON user_progress;
DROP POLICY IF EXISTS "user_progress_update_policy" ON user_progress;
CREATE POLICY "user_progress_select_policy" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_progress_insert_policy" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_progress_update_policy" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

-- user_actions: 用户只能读写自己的
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_actions_select_policy" ON user_actions;
DROP POLICY IF EXISTS "user_actions_insert_policy" ON user_actions;
DROP POLICY IF EXISTS "user_actions_update_policy" ON user_actions;
CREATE POLICY "user_actions_select_policy" ON user_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_actions_insert_policy" ON user_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_actions_update_policy" ON user_actions FOR UPDATE USING (auth.uid() = user_id);

-- user_achievements: 用户只能读写自己的
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_achievements_select_policy" ON user_achievements;
DROP POLICY IF EXISTS "user_achievements_insert_policy" ON user_achievements;
CREATE POLICY "user_achievements_select_policy" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_achievements_insert_policy" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_daily_tasks: 用户只能读写自己的
ALTER TABLE user_daily_tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_daily_tasks_select_policy" ON user_daily_tasks;
DROP POLICY IF EXISTS "user_daily_tasks_insert_policy" ON user_daily_tasks;
DROP POLICY IF EXISTS "user_daily_tasks_update_policy" ON user_daily_tasks;
CREATE POLICY "user_daily_tasks_select_policy" ON user_daily_tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_daily_tasks_insert_policy" ON user_daily_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_daily_tasks_update_policy" ON user_daily_tasks FOR UPDATE USING (auth.uid() = user_id);
