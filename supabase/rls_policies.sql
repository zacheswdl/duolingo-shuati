-- 为 questions 表添加公共读取权限
ALTER TABLE IF EXISTS public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read questions" ON public.questions;
CREATE POLICY "Public can read questions" 
  ON public.questions 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

-- 为 user_progress 表添加权限
ALTER TABLE IF EXISTS public.user_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_progress;
CREATE POLICY "Users can view their own progress" 
  ON public.user_progress 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_progress;
CREATE POLICY "Users can update their own progress" 
  ON public.user_progress 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

-- 为 user_mistakes 表添加权限
ALTER TABLE IF EXISTS public.user_mistakes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own mistakes" ON public.user_mistakes;
CREATE POLICY "Users can view their own mistakes" 
  ON public.user_mistakes 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own mistakes" ON public.user_mistakes;
CREATE POLICY "Users can insert their own mistakes" 
  ON public.user_mistakes 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- 为 user_favorites 表添加权限
ALTER TABLE IF EXISTS public.user_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own favorites" ON public.user_favorites;
CREATE POLICY "Users can view their own favorites" 
  ON public.user_favorites 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own favorites" ON public.user_favorites;
CREATE POLICY "Users can insert their own favorites" 
  ON public.user_favorites 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- 为 user_daily_tasks 表添加权限
ALTER TABLE IF EXISTS public.user_daily_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own daily tasks" ON public.user_daily_tasks;
CREATE POLICY "Users can view their own daily tasks" 
  ON public.user_daily_tasks 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own daily tasks" ON public.user_daily_tasks;
CREATE POLICY "Users can update their own daily tasks" 
  ON public.user_daily_tasks 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

-- 为 user_achievements 表添加权限
ALTER TABLE IF EXISTS public.user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own achievements" ON public.user_achievements;
CREATE POLICY "Users can view their own achievements" 
  ON public.user_achievements 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert their own achievements" ON public.user_achievements;
CREATE POLICY "Users can insert their own achievements" 
  ON public.user_achievements 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- 为 leaderboard_view 添加公共访问权限
DROP POLICY IF EXISTS "Public can read leaderboard" ON public.leaderboard_view;
CREATE POLICY "Public can read leaderboard" 
  ON public.leaderboard_view 
  FOR SELECT 
  TO anon, authenticated 
  USING (true);

SELECT 'RLS policies updated successfully' as result;