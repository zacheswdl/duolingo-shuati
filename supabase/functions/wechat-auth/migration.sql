CREATE TABLE IF NOT EXISTS wechat_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  openid TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE wechat_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can do everything on wechat_users"
  ON wechat_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their own wechat_users row"
  ON wechat_users
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
