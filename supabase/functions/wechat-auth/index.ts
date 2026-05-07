import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type JsonBody = Record<string, unknown>

function jsonResponse(body: JsonBody, status = 200) {
  return new Response(
    JSON.stringify(body),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function errorResponse(stage: string, error: unknown, status = 500) {
  const message = error instanceof Error ? error.message : String(error || 'Internal server error')
  console.error(`[wechat-auth] ${stage}:`, message)
  return jsonResponse({ error: message, stage }, status)
}

function getRequiredEnv(primary: string, fallback?: string) {
  const value = Deno.env.get(primary) || (fallback ? Deno.env.get(fallback) : '')
  if (!value) throw new Error(`Missing environment variable: ${primary}${fallback ? ` or ${fallback}` : ''}`)
  return value
}

function createLoginPassword(openid: string, secret: string) {
  const seed = `${openid}:${secret}`
  return `Wx_${btoa(seed).replace(/[^a-zA-Z0-9]/g, '').slice(0, 40)}_9a!`
}

function createWechatEmail(openid: string) {
  const safeOpenid = openid.replace(/[^a-zA-Z0-9._-]/g, '')
  return `${safeOpenid}@wechat-miniapp.example.com`
}

function isMissingWechatUsersTable(error: { message?: string; code?: string } | null) {
  return error?.code === '42P01' || /wechat_users|relation .* does not exist/i.test(error?.message || '')
}

async function findLinkedUserId(admin: ReturnType<typeof createClient>, openid: string) {
  const { data: existingLink, error } = await admin
    .from('wechat_users')
    .select('user_id')
    .eq('openid', openid)
    .maybeSingle()

  if (!error) {
    return existingLink?.user_id as string | undefined
  }

  if (isMissingWechatUsersTable(error)) {
    throw new Error('wechat_users table is missing. Run supabase/functions/wechat-auth/migration.sql in Supabase SQL editor.')
  }

  throw error
}

async function linkWechatUser(admin: ReturnType<typeof createClient>, openid: string, userId: string) {
  const { error } = await admin
    .from('wechat_users')
    .upsert({ openid, user_id: userId }, { onConflict: 'openid' })

  if (error) {
    throw error
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  let stage = 'parse-request'

  try {
    const { code } = await req.json()

    if (!code) {
      return jsonResponse({ error: 'Missing code parameter', stage }, 400)
    }

    stage = 'load-env'
    const APPID = getRequiredEnv('WECHAT_APPID')
    const SECRET = getRequiredEnv('WECHAT_SECRET')
    const SUPABASE_URL = getRequiredEnv('SUPABASE_URL', 'PROJECT_URL')
    const SUPABASE_ANON_KEY = getRequiredEnv('SUPABASE_ANON_KEY', 'ANON_KEY')
    const SUPABASE_SERVICE_ROLE_KEY = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY', 'SERVICE_ROLE_KEY')

    stage = 'wechat-jscode2session'
    const wechatUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`
    const wechatRes = await fetch(wechatUrl)
    const wechatData = await wechatRes.json()

    if (wechatData.errcode) {
      return jsonResponse({ error: wechatData.errmsg || 'WeChat auth failed', errcode: wechatData.errcode, stage }, 400)
    }

    const openid = wechatData.openid
    if (!openid) {
      return jsonResponse({ error: 'Failed to get openid from WeChat', stage }, 400)
    }

    stage = 'init-supabase-admin'
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const email = createWechatEmail(openid)

    stage = 'find-linked-user'
    let userId = await findLinkedUserId(admin, openid)
    const loginPassword = createLoginPassword(openid, SUPABASE_SERVICE_ROLE_KEY)

    if (!userId) {
      stage = 'create-auth-user'
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: loginPassword,
        email_confirm: true,
        user_metadata: { wechat_openid: openid },
      })

      if (createError || !created.user) {
        return errorResponse(stage, createError?.message || 'Failed to create user')
      }

      userId = created.user.id
    }

    stage = 'link-wechat-user'
    await linkWechatUser(admin, openid, userId)

    stage = 'prepare-login-session'
    const { error: updateError } = await admin.auth.admin.updateUserById(userId, {
      email,
      password: loginPassword,
      email_confirm: true,
      user_metadata: { wechat_openid: openid },
    })

    if (updateError) {
      return errorResponse(stage, updateError.message || 'Failed to prepare login session')
    }

    stage = 'sign-in-with-password'
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: sessionData, error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password: loginPassword,
    })

    if (signInError || !sessionData.session) {
      return errorResponse(stage, signInError?.message || 'Failed to create login session')
    }

    return jsonResponse({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
      user_id: userId,
    })
  } catch (err) {
    return errorResponse(stage, err)
  }
})
