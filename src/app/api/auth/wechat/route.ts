"use server";

import { NextResponse } from "next/server";

export async function GET() {
  const WECHAT_APPID = process.env.WECHAT_APPID;
  const WECHAT_REDIRECT_URI = process.env.WECHAT_REDIRECT_URI;
  
  if (!WECHAT_APPID || !WECHAT_REDIRECT_URI) {
    return NextResponse.json(
      { error: "微信配置未设置" },
      { status: 500 }
    );
  }

  const redirectUri = encodeURIComponent(WECHAT_REDIRECT_URI);
  const state = Math.random().toString(36).substring(2, 15);
  
  const authUrl = `https://open.weixin.qq.com/connect/qrconnect?appid=${WECHAT_APPID}&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;

  return NextResponse.json({ authUrl, state });
}

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "缺少code参数" },
        { status: 400 }
      );
    }

    const WECHAT_APPID = process.env.WECHAT_APPID;
    const WECHAT_SECRET = process.env.WECHAT_SECRET;

    if (!WECHAT_APPID || !WECHAT_SECRET) {
      return NextResponse.json(
        { error: "微信配置未设置" },
        { status: 500 }
      );
    }

    const wechatUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&code=${code}&grant_type=authorization_code`;
    
    const wechatRes = await fetch(wechatUrl);
    const wechatData = await wechatRes.json();

    if (wechatData.errcode) {
      return NextResponse.json(
        { error: wechatData.errmsg || "微信授权失败", errcode: wechatData.errcode },
        { status: 400 }
      );
    }

    const { access_token, openid } = wechatData;

    if (!openid) {
      return NextResponse.json(
        { error: "未能获取openid" },
        { status: 400 }
      );
    }

    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`;
    const userInfoRes = await fetch(userInfoUrl);
    const userInfo = await userInfoRes.json();

    if (userInfo.errcode) {
      return NextResponse.json(
        { error: userInfo.errmsg || "获取用户信息失败", errcode: userInfo.errcode },
        { status: 400 }
      );
    }

    const { nickname, headimgurl } = userInfo;

    return NextResponse.json({
      openid,
      nickname,
      headimgurl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "服务器内部错误" },
      { status: 500 }
    );
  }
}