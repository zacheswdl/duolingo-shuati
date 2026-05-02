import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "邮箱和验证码不能为空" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find the latest unused OTP for this email
    const { data: otpRecord, error: otpError } = await supabase
      .from("email_otps")
      .select("*")
      .eq("email", email)
      .eq("otp_type", "signup")
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      return NextResponse.json(
        { error: "验证码不存在，请重新获取" },
        { status: 400 }
      );
    }

    // Check if expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "验证码已过期，请重新获取" },
        { status: 400 }
      );
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      return NextResponse.json(
        { error: "验证码错误，请重试" },
        { status: 400 }
      );
    }

    // Mark as used
    await supabase
      .from("email_otps")
      .update({ used: true })
      .eq("id", otpRecord.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { error: "服务器错误" },
      { status: 500 }
    );
  }
}
