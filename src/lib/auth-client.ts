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
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true as const };
}

export async function verifyOtpClient(email: string, token: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error) {
    if (error.message.includes("invalid") || error.message.includes("expired")) {
      return { error: "验证码无效或已过期，请重新获取" };
    }
    return { error: error.message };
  }

  return { success: true as const };
}

export async function sendResetPasswordClient(email: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    if (error.message.includes("rate limit")) {
      return { error: "发送太频繁，请稍后再试" };
    }
    return { error: error.message };
  }

  return { success: true as const };
}

export async function verifyResetOtpClient(email: string, token: string) {
  const supabase = createClient();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });

  if (error) {
    if (error.message.includes("invalid") || error.message.includes("expired")) {
      return { error: "验证码无效或已过期，请重新获取" };
    }
    return { error: error.message };
  }

  return { success: true as const };
}

export async function updatePasswordClient(password: string) {
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
