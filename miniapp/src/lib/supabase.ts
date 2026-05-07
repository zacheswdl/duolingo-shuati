import { createClient } from '@supabase/supabase-js';
import Taro from '@tarojs/taro';
import { getSupabaseUrl, getSupabaseAnonKey } from './config';

type SupabaseClient = ReturnType<typeof createClient>;
type MiniappFetch = typeof fetch;

type MiniappGlobal = typeof globalThis & {
  __duolingoShuatiSupabase?: SupabaseClient;
};

const miniappGlobal = globalThis as MiniappGlobal;

const miniappFetch: MiniappFetch = async (input, init?: RequestInit) => {
  const requestInit = init || {};
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  const method = requestInit.method || (typeof input !== 'string' && !(input instanceof URL) ? input.method : undefined) || 'GET';
  const headers = new Headers(typeof input !== 'string' && !(input instanceof URL) ? input.headers : undefined);

  new Headers(requestInit.headers).forEach((value, key) => {
    headers.set(key, value);
  });

  const body = requestInit.body ?? (typeof input !== 'string' && !(input instanceof URL) ? input.body : undefined);

  const response = await Taro.request({
    url,
    method: method as Taro.request.Option['method'],
    header: Object.fromEntries(headers.entries()),
    data: typeof body === 'string' ? body : body ? String(body) : undefined,
    timeout: 20000,
    enableHttp2: true,
  });

  const responseHeaders = new Headers();
  Object.entries(response.header || {}).forEach(([key, value]) => {
    if (typeof value !== 'undefined') responseHeaders.set(key, String(value));
  });

  const responseBody = typeof response.data === 'string' ? response.data : JSON.stringify(response.data ?? null);

  return new Response(responseBody, {
    status: response.statusCode,
    headers: responseHeaders,
  });
};

export function getSupabaseClient() {
  if (!miniappGlobal.__duolingoShuatiSupabase) {
    miniappGlobal.__duolingoShuatiSupabase = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        storageKey: 'duolingo-shuati-auth-token',
        storage: {
          getItem: (key: string) => {
            return Promise.resolve(Taro.getStorageSync(key) || null);
          },
          setItem: (key: string, value: string) => {
            Taro.setStorageSync(key, value);
            return Promise.resolve();
          },
          removeItem: (key: string) => {
            Taro.removeStorageSync(key);
            return Promise.resolve();
          },
        },
        autoRefreshToken: false,
        persistSession: true,
        detectSessionInUrl: false,
        flowType: 'implicit',
      },
      global: {
        fetch: miniappFetch,
      },
    });
  }
  return miniappGlobal.__duolingoShuatiSupabase;
}
