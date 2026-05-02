const SUPABASE_URL = process.env.TARO_APP_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.TARO_APP_SUPABASE_ANON_KEY || '';

export function getSupabaseUrl() {
  return SUPABASE_URL;
}

export function getSupabaseAnonKey() {
  return SUPABASE_ANON_KEY;
}

export function getAuthUrl() {
  return `${SUPABASE_URL}/functions/v1/wechat-auth`;
}
