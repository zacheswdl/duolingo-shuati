-- 创建OTP表存储6位验证码
CREATE TABLE IF NOT EXISTS public.email_otps (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  otp_type TEXT NOT NULL DEFAULT 'signup',
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON public.email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires ON public.email_otps(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_otps_otp_type ON public.email_otps(otp_type);

-- 启用RLS
ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;

-- 不允许直接访问（只通过Edge Function访问）
DROP POLICY IF EXISTS "No direct access" ON public.email_otps;
