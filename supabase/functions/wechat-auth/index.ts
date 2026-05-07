import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(
    JSON.stringify(body),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function getRequiredEnv(primary: string, fallback?: string) {
  const value = Deno.env.get(primary) || (fallback ? Deno.env.get(fallback) : '')
  if (!value) throw new Error(`Missing environment variable: ${primary}${fallback ? ` or ${fallback}` : ''}`)
  return value
}

function createLoginPassword(openid: string, sessionKey = '') {
  const seed = `${openid}:${sessionKey}:${crypto.randomUUID()}`
  return `Wx_${btoa(seed).replace(/[^a-zA-Z0-9]/g, '').slice(0, 40)}_9a!`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()

    if (!code) {
      return jsonResponse({ error: 'Missing code parameter' }, 400)
    }

    const APPID = getRequiredEnv('WECHAT_APPID')
    const SECRET = getRequiredEnv('WECHAT_SECRET')
    const SUPABASE_URL = getRequiredEnv('SUPABASE_URL', 'PROJECT_URL')
    const SUPABASE_ANON_KEY = getRequiredEnv('SUPABASE_ANON_KEY', 'ANON_KEY')
    const SUPABASE_SERVICE_ROLE_KEY = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY')

    const wechatUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`
    const wechatRes = await fetch(wechatUrl)
    const wechatData = await wechatRes.json()

    if (wechatData.errcode) {
      return jsonResponse({ error: wechatData.errmsg || 'WeChat auth failed', errcode: wechatData.errcode }, 400)
    }

    const openid = wechatData.openid
    if (!openid) {
      return jsonResponse({ error: 'Failed to get openid from WeChat' }, 400)
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const email = `${openid}@wechat.miniapp`

    const { data: existingLink, error: existingLinkError } = await admin
      .from('wechat_users')
      .select('user_id')
      .eq('openid', openid)
      .maybeSingle()

    if (existingLinkError) {
      return jsonResponse({ error: existingLinkError.message }, 500)
    }

    let userId = existingLink?.user_id as string | undefined

    if (!userId) {
      const initialPassword = createLoginPassword(openid, wechatData.session_key)
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: initialPassword,
        email_confirm: true,
        user_metadata: { wechat_openid: openid },
      })

      if (createError || !created.user) {
        return jsonResponse({ error: createError?.message || 'Failed to create user' }, 500)
      }

      userId = created.user.id

      const { error: linkError } = await admin
        .from('wechat_users')
        .insert({ openid, user_id: userId })

      if (linkError) {
        await admin.auth.admin.deleteUser(userId)
        return jsonResponse({ error: linkError.message || 'Failed to link WeChat account' }, 500)
      }
    }

    const loginPassword = createLoginPassword(openid, wechatData.session_key)
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      password: loginPassword,
      email_confirm: true,
      user_metadata: { wechat_openid: openid },
    })

    if (updateError) {
      return jsonResponse({ error: updateError.message || 'Failed to prepare login session' }, 500)
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: sessionData, error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password: loginPassword,
    })

    if (signInError || !sessionData.session) {
      return jsonResponse({ error: signInError?.message || 'Failed to create login session' }, 500)
    }

    return jsonResponse({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      user_id: userId,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return jsonResponse({ error: message }, 500)
  }
})
