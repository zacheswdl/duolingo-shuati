import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Missing code parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const APPID = Deno.env.get('WECHAT_APPID')!
    const SECRET = Deno.env.get('WECHAT_SECRET')!
    const SUPABASE_URL = Deno.env.get('PROJECT_URL')!
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!

    if (!APPID || !SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'Server configuration missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const wechatUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`
    const wechatRes = await fetch(wechatUrl)
    const wechatData = await wechatRes.json()

    if (wechatData.errcode) {
      return new Response(
        JSON.stringify({ error: wechatData.errmsg || 'WeChat auth failed', errcode: wechatData.errcode }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openid = wechatData.openid
    if (!openid) {
      return new Response(
        JSON.stringify({ error: 'Failed to get openid from WeChat' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: existingLink } = await supabase
      .from('wechat_users')
      .select('user_id')
      .eq('openid', openid)
      .single()

    let userId: string

    if (existingLink) {
      userId = existingLink.user_id
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: `${openid}@wechat.miniapp`,
        email_confirm: true,
        user_metadata: { wechat_openid: openid },
      })

      if (createError || !newUser) {
        return new Response(
          JSON.stringify({ error: createError?.message || 'Failed to create user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      userId = newUser.id

      const { error: linkError } = await supabase
        .from('wechat_users')
        .insert({ openid, user_id: userId })

      if (linkError) {
        await supabase.auth.admin.deleteUser(userId)
        return new Response(
          JSON.stringify({ error: 'Failed to link WeChat account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const { data: tokenData, error: tokenError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `${openid}@wechat.miniapp`,
    })

    if (tokenError || !tokenData) {
      return new Response(
        JSON.stringify({ error: tokenError?.message || 'Failed to generate token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const accessToken = tokenData.properties?.access_token || tokenData.access_token || ''
    const refreshToken = tokenData.properties?.refresh_token || tokenData.refresh_token || ''

    return new Response(
      JSON.stringify({
        access_token: accessToken,
        refresh_token: refreshToken,
        user_id: userId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
