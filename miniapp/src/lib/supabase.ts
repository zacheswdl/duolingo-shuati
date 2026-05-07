import { createClient } from '@supabase/supabase-js';
import Taro from '@tarojs/taro';
import { getSupabaseUrl, getSupabaseAnonKey } from './config';

type SupabaseClient = ReturnType<typeof createClient>;

type MiniappGlobal = typeof globalThis & {
  wx?: MiniappGlobal;
  __duolingoShuatiSupabase?: SupabaseClient;
};

const miniappGlobal = ((globalThis as MiniappGlobal).wx || globalThis) as MiniappGlobal;

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
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }
  return miniappGlobal.__duolingoShuatiSupabase;
}
