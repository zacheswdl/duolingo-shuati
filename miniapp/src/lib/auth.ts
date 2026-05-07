import Taro from '@tarojs/taro';
import { getAuthUrl, getSupabaseAnonKey } from './config';

const TOKEN_KEY = 'sb-access-token';
const REFRESH_TOKEN_KEY = 'sb-refresh-token';
const USER_ID_KEY = 'sb-user-id';
const LOGIN_TIMEOUT_MS = 30000;
const AUTH_REQUEST_TIMEOUT_MS = 20000;

function formatLoginError(err: any) {
  const message = String(err?.errMsg || err?.message || err || '登录异常');
  if (/timeout/i.test(message)) {
    return '微信登录超时：开发者工具未能获取登录 code，请检查 AppID、网络代理或换真机预览重试';
  }
  return message;
}

function loginWithCode(): Promise<{ code?: string }> {
  const loginTask = Taro.login();
  const timeoutTask = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('wx.login timeout')), LOGIN_TIMEOUT_MS);
  });

  return Promise.race([loginTask, timeoutTask]);
}

export async function wxLogin(): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    console.info('[wxLogin] start wx.login');
    const { code } = await loginWithCode();
    console.info('[wxLogin] wx.login success', { hasCode: Boolean(code) });
    if (!code) {
      return { success: false, error: '微信登录失败：未获取到登录 code' };
    }

    const anonKey = getSupabaseAnonKey();
    console.info('[wxLogin] request wechat-auth', { url: getAuthUrl() });
    const res = await Taro.request({
      url: getAuthUrl(),
      method: 'POST',
      timeout: AUTH_REQUEST_TIMEOUT_MS,
      header: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
      },
      data: { code },
    });
    console.info('[wxLogin] wechat-auth response', { statusCode: res.statusCode });

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

    const { access_token, refresh_token, user_id } = res.data;
    if (!user_id) {
      return { success: false, error: '登录失败：服务端未返回用户 ID' };
    }

    Taro.setStorageSync(TOKEN_KEY, access_token);
    Taro.setStorageSync(REFRESH_TOKEN_KEY, refresh_token);
    Taro.setStorageSync(USER_ID_KEY, user_id);

    return { success: true, userId: user_id };
  } catch (err: any) {
    const error = formatLoginError(err);
    console.error('[wxLogin] login exception', { error, raw: err });
    return { success: false, error };
  }
}

export async function silentLogin(): Promise<{ success: boolean; userId?: string }> {
  const token = Taro.getStorageSync(TOKEN_KEY);
  const userId = Taro.getStorageSync(USER_ID_KEY);
  if (!token || !userId) return { success: false };
  return { success: true, userId };
}

export function clearAuth() {
  Taro.removeStorageSync(TOKEN_KEY);
  Taro.removeStorageSync(REFRESH_TOKEN_KEY);
  Taro.removeStorageSync(USER_ID_KEY);
}

export async function logout() {
  clearAuth();
}

export function isLoggedIn(): boolean {
  return !!Taro.getStorageSync(TOKEN_KEY);
}
