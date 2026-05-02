import { createClient } from "@/lib/supabase/client";

export async function loginClient(email: string, password: string) {
  const supabase = createClient();

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

  return {};
}

export async function signUpClient(email: string, password: string) {
  if (password.length < 8) {
    return { error: "密码至少8个字符" };
  }
  if (!/[A-Z]/.test(password)) {
    return { error: "密码必须包含至少一个大写字母" };
  }
  if (!/[a-z]/.test(password)) {
    return { error: "密码必须包含至少一个小写字母" };
  }

  const supabase = createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=/learn`,
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

  return { success: true as const };
}

export async function resendOtpClient(email: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback?next=/learn`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true as const };
}

export async function sendResetPasswordClient(email: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    if (error.message.includes("rate limit")) {
      return { error: "发送太频繁，请稍后再试" };
    }
    return { error: error.message };
  }

  return { success: true, message: "密码重置链接已发送到您的邮箱，请查收并点击链接重置密码" };
}

export async function updatePasswordClient(password: string) {
  if (password.length < 6) {
    return { error: "密码至少6个字符" };
  }

  const supabase = createClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return {};
}

export async function signOutClient() {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return {};
}
