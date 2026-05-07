import Taro from '@tarojs/taro';
import { getAuthUrl, getSupabaseAnonKey } from './config';
import { getSupabaseClient } from './supabase';

const TOKEN_KEY = 'sb-access-token';
const REFRESH_TOKEN_KEY = 'sb-refresh-token';

export async function wxLogin(): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const { code } = await Taro.login();
    if (!code) {
      return { success: false, error: '微信登录失败' };
    }

    const anonKey = getSupabaseAnonKey();
    const res = await Taro.request({
      url: getAuthUrl(),
      method: 'POST',
      header: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      data: { code },
    });

    if (res.statusCode !== 200 || !res.data?.access_token) {
      const errorMessage = res.data?.stage
        ? `${res.data.stage}: ${res.data?.error || '登录失败'}`
        : res.data?.error || '登录失败';
      console.error('[wxLogin] wechat-auth failed', {
        statusCode: res.statusCode,
        data: res.data,
      });
      return { success: false, error: errorMessage };
    }

    const { access_token, refresh_token } = res.data;
    Taro.setStorageSync(TOKEN_KEY, access_token);
    Taro.setStorageSync(REFRESH_TOKEN_KEY, refresh_token);

    const supabase = getSupabaseClient();
    const { data: sessionData } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    const userId = sessionData.session?.user.id;
    if (!userId) {
      const { data: { user } } = await supabase.auth.getUser();
      return { success: true, userId: user?.id };
    }

    return { success: true, userId };
  } catch (err: any) {
    return { success: false, error: err.message || '登录异常' };
  }
}

export async function silentLogin(): Promise<{ success: boolean; userId?: string }> {
  const token = Taro.getStorageSync(TOKEN_KEY);
  if (!token) return { success: false };

  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return { success: true, userId: user.id };
  } catch {
  }

  try {
    const refreshToken = Taro.getStorageSync(REFRESH_TOKEN_KEY);
    if (!refreshToken) return { success: false };

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      clearAuth();
      return { success: false };
    }

    Taro.setStorageSync(TOKEN_KEY, data.session.access_token);
    Taro.setStorageSync(REFRESH_TOKEN_KEY, data.session.refresh_token);
    return { success: true, userId: data.session.user.id };
  } catch {
    clearAuth();
    return { success: false };
  }
}

export function clearAuth() {
  Taro.removeStorageSync(TOKEN_KEY);
  Taro.removeStorageSync(REFRESH_TOKEN_KEY);
}

export async function logout() {
  try {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  clearAuth();
}

export function isLoggedIn(): boolean {
  return !!Taro.getStorageSync(TOKEN_KEY);
}
