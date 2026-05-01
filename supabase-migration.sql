-- =============================================
-- 迁移脚本：新增成就系统、每日任务、排行榜功能
-- 在 Supabase Dashboard > SQL Editor 中执行
-- =============================================

-- ============ 补充 user_progress 表缺失的列 ============
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS total_correct INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS chapter_correct JSONB NOT NULL DEFAULT '{}';
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS last_active DATE;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_progress ADD COLUMN IF NOT EXISTS max_exam_score INTEGER NOT NULL DEFAULT 0;

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
  id SERIAL PRIARY KEY,
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

-- ============ 查询用户排名函数 ============
CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  xp INTEGER,
  streak INTEGER,
  rank BIGINT,
  display_name TEXT,
  max_exam_score INTEGER
) LANGUAGE SQL SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT
    sub.user_id,
    sub.xp,
    sub.streak,
    sub.rank,
    sub.display_name,
    sub.max_exam_score
  FROM (
    SELECT
      up.user_id,
      up.xp,
      up.streak,
      ROW_NUMBER() OVER (ORDER BY up.xp DESC)::BIGINT AS rank,
      ('用户' || LEFT(COALESCE(SPLIT_PART(au.email, '@', 1), up.user_id::TEXT), 6))::TEXT AS display_name,
      COALESCE(up.max_exam_score, 0) AS max_exam_score
    FROM user_progress up
    LEFT JOIN auth.users au ON au.id = up.user_id
  ) sub
  WHERE sub.user_id = p_user_id;
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

-- ============ 补充 user_actions 表收藏字段 ============
ALTER TABLE user_actions ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_user_actions_favorite ON user_actions(user_id, is_favorite) WHERE is_favorite = true;

-- ============ 行级安全策略 ============

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
