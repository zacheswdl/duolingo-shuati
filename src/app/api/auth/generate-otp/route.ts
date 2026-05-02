import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "邮箱地址不能为空" },
        { status: 400 }
      );
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const { error } = await supabase
      .from("email_otps")
      .insert({
        email,
        otp,
        otp_type: "signup",
        expires_at: expiresAt.toISOString(),
      });

    if (error) {
      return NextResponse.json(
        { error: "验证码生成失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, otp });
  } catch (error) {
    console.error("Generate OTP error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
