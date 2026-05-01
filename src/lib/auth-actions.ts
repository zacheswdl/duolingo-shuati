"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "./supabase/server";

// ============ 自定义 Rate Limit（内存级，每个邮箱限制） ============

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 秒窗口
const MAX_OTP_REQUESTS = 1; // 每个窗口最多 1 次

const otpRequestMap = new Map<string, number[]>();

function checkRateLimit(email: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const timestamps = otpRequestMap.get(email) || [];
  // 清除窗口外的旧记录
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= MAX_OTP_REQUESTS) {
    const oldest = recent[0];
    const retryAfter = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000);
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  recent.push(now);
  otpRequestMap.set(email, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

// ============ 登录 ============

export async function login(_prev: { error?: string } | undefined, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "请填写邮箱和密码" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message.includes("Invalid login credentials")) {
      return { error: "邮箱或密码错误" };
    }
    if (error.message.includes("Email not confirmed")) {
      return { error: "邮箱未验证，请先查收验证邮件并输入验证码完成验证" };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/learn");
}

// ============ 注册（发送确认邮件） ============

export async function sendOtp(_prev: { error?: string } | undefined, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "请填写邮箱和密码" };
  }

  // 密码强度校验
  if (password.length < 8) {
    return { error: "密码至少8个字符" };
  }
  if (!/[A-Z]/.test(password)) {
    return { error: "密码必须包含至少一个大写字母" };
  }
  if (!/[a-z]/.test(password)) {
    return { error: "密码必须包含至少一个小写字母" };
  }

  // 自定义 Rate Limit 检查（在调用 Supabase 之前拦截）
  const { allowed, retryAfterSeconds } = checkRateLimit(email);
  if (!allowed) {
    return { error: `发送太频繁，请 ${retryAfterSeconds} 秒后再试` };
  }

  // 使用 signUp 发送确认邮件，用户点击邮件中的链接完成注册
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/learn`,
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "该邮箱已注册，请直接登录" };
    }
    if (error.message.includes("rate limit")) {
      return { error: "发送太频繁，请稍后再试" };
    }
    return { error: error.message };
  }

  // 返回成功，进入确认页面
  return { success: true as const, email, password };
}

// ============ 验证 OTP 验证码（已废弃，改用邮件链接确认） ============

export async function verifyOtp(_prev: { error?: string } | undefined, formData: FormData) {
  // 此函数已不再使用，注册改为邮件链接确认方式
  return { error: "请通过邮件中的链接完成注册" };
}

// ============ 重新发送确认邮件 ============

export async function resendOtp(email: string) {
  const supabase = await createServerSupabaseClient();

  // 自定义 Rate Limit 检查（在调用 Supabase 之前拦截）
  const { allowed, retryAfterSeconds } = checkRateLimit(email);
  if (!allowed) {
    return { error: `发送太频繁，请 ${retryAfterSeconds} 秒后再试` };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password: crypto.randomUUID(), // 随机密码，仅用于重新发送确认邮件
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback?next=/learn`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ============ 检查是否已验证 ============

export async function checkEmailConfirmed() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { confirmed: false };
  return { confirmed: !!user.email_confirmed_at };
}

// ============ 忘记密码（发送重置邮件） ============

export async function sendResetPassword(_prev: { error?: string; success?: boolean; message?: string } | undefined, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "请填写邮箱" };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/reset-password`,
  });

  if (error) {
    if (error.message.includes("rate limit")) {
      return { error: "发送太频繁，请稍后再试" };
    }
    return { error: error.message };
  }

  return { success: true, message: "密码重置链接已发送到您的邮箱，请查收并点击链接重置密码" };
}

// ============ 更新密码 ============

export async function updatePassword(_prev: { error?: string } | undefined, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const password = formData.get("password") as string;

  if (!password || password.length < 6) {
    return { error: "密码至少6个字符" };
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/learn");
}

// ============ 退出登录 ============

export async function signOut() {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/auth/login");
}

// ============ 获取当前用户 ============

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
