import Taro from '@tarojs/taro';
import { getAuthUrl } from './config';
import { getSupabaseClient } from './supabase';

const TOKEN_KEY = 'sb-access-token';
const REFRESH_TOKEN_KEY = 'sb-refresh-token';

export async function wxLogin(): Promise<{ success: boolean; error?: string }> {
  try {
    const { code } = await Taro.login();
    if (!code) {
      return { success: false, error: '微信登录失败' };
    }

    const res = await Taro.request({
      url: getAuthUrl(),
      method: 'POST',
      data: { code },
    });

    if (res.statusCode !== 200 || !res.data?.access_token) {
      return { success: false, error: res.data?.error || '登录失败' };
    }

    const { access_token, refresh_token } = res.data;
    Taro.setStorageSync(TOKEN_KEY, access_token);
    Taro.setStorageSync(REFRESH_TOKEN_KEY, refresh_token);

    const supabase = getSupabaseClient();
    await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || '登录异常' };
  }
}

export async function silentLogin(): Promise<boolean> {
  const token = Taro.getStorageSync(TOKEN_KEY);
  if (!token) return false;

  try {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) return true;
  } catch {
    // token invalid, try refresh
  }

  try {
    const refreshToken = Taro.getStorageSync(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      clearAuth();
      return false;
    }

    Taro.setStorageSync(TOKEN_KEY, data.session.access_token);
    Taro.setStorageSync(REFRESH_TOKEN_KEY, data.session.refresh_token);
    return true;
  } catch {
    clearAuth();
    return false;
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
