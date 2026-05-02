import { createClient } from '@supabase/supabase-js';
import Taro from '@tarojs/taro';
import { getSupabaseUrl, getSupabaseAnonKey } from './config';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
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
  return supabaseInstance;
}
