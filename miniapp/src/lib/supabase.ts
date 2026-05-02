import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey } from './config';

let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(getSupabaseUrl(), getSupabaseAnonKey(), {
      auth: {
        storage: {
          getItem: (key: string) => {
            return Promise.resolve(wx.getStorageSync(key) || null);
          },
          setItem: (key: string, value: string) => {
            wx.setStorageSync(key, value);
            return Promise.resolve();
          },
          removeItem: (key: string) => {
            wx.removeStorageSync(key);
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
