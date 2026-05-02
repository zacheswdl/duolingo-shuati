"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, KeyRound, Mail, CheckCircle, ArrowLeft, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendResetPasswordClient, verifyResetOtpClient, updatePasswordClient } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";

type Step = "email" | "verify" | "reset" | "success";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");

  const [sendPending, setSendPending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifyPending, setVerifyPending] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendError, setResendError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      timerRef.current = window.setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            window.clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    };
  }, [resendCooldown]);

  const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSendError(null);
    const formData = new FormData(e.currentTarget);
    const emailVal = formData.get("email") as string;
    if (!emailVal) return;

    setSendPending(true);
    const result = await sendResetPasswordClient(emailVal);
    if (result.error) {
      setSendError(result.error);
      setSendPending(false);
    } else {
      setEmail(emailVal);
      setStep("verify");
      setResendCooldown(60);
      setSendPending(false);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value.slice(-1);
    setOtpValues(newOtpValues);
    setVerifyError(null);
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 0) return;
    const newOtpValues = [...otpValues];
    for (let i = 0; i < 6; i++) {
      newOtpValues[i] = pastedData[i] || "";
    }
    setOtpValues(newOtpValues);
    const nextEmptyIndex = pastedData.length < 6 ? pastedData.length : 5;
    otpInputRefs.current[nextEmptyIndex]?.focus();
  };

  const handleVerify = async () => {
    const token = otpValues.join("");
    if (token.length !== 6) {
      setVerifyError("请输入完整的6位验证码");
      return;
    }
    setVerifyPending(true);
    setVerifyError(null);
    const result = await verifyResetOtpClient(email, token);
    if (result.error) {
      setVerifyError(result.error);
      setVerifyPending(false);
    } else {
      setStep("reset");
      setVerifyPending(false);
    }
  };

  useEffect(() => {
    const token = otpValues.join("");
    if (token.length === 6 && !verifyPending && step === "verify") {
      handleVerify();
    }
  }, [otpValues]);

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setResendError(null);
    setOtpValues(["", "", "", "", "", ""]);
    setVerifyError(null);
    const result = await sendResetPasswordClient(email);
    if (result.success) {
      setResendCooldown(60);
    } else {
      setResendError(result.error || "发送失败，请稍后再试");
    }
  };

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetError(null);
    const formData = new FormData(e.currentTarget);
    const pwd = formData.get("password") as string;
    const confirmPwd = formData.get("confirmPassword") as string;

    if (pwd.length < 8) {
      setResetError("密码至少8个字符");
      return;
    }
    if (!/[A-Z]/.test(pwd)) {
      setResetError("密码必须包含至少一个大写字母");
      return;
    }
    if (!/[a-z]/.test(pwd)) {
      setResetError("密码必须包含至少一个小写字母");
      return;
    }
    if (pwd !== confirmPwd) {
      setResetError("两次输入的密码不一致");
      return;
    }

    setResetPending(true);
    const result = await updatePasswordClient(pwd);
    if (result.error) {
      setResetError(result.error);
      setResetPending(false);
    } else {
      setStep("success");
      setResetPending(false);
      setTimeout(() => {
        router.push("/learn");
      }, 1500);
    }
  };

  const handleBack = () => {
    if (step === "verify") {
      setStep("email");
      setOtpValues(["", "", "", "", "", ""]);
      setVerifyError(null);
    } else if (step === "reset") {
      setStep("verify");
      setResetError(null);
    }
  };

  const stepConfig: Record<Step, { icon: React.ReactNode; title: string; subtitle: string }> = {
    email: {
      icon: <KeyRound className="w-10 h-10 text-white" />,
      title: "找回密码",
      subtitle: "输入注册邮箱，接收验证码",
    },
    verify: {
      icon: <Mail className="w-10 h-10 text-white" />,
      title: "验证邮箱",
      subtitle: "输入邮箱收到的6位验证码",
    },
    reset: {
      icon: <KeyRound className="w-10 h-10 text-white" />,
      title: "重置密码",
      subtitle: "设置你的新密码",
    },
    success: {
      icon: <CheckCircle className="w-10 h-10 text-white" />,
      title: "重置成功",
      subtitle: "正在跳转到主页...",
    },
  };

  const current = stepConfig[step];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-gradient-to-b from-[#1cb0f6] to-[#1899d6] pt-12 pb-16 px-6">
        <div className="max-w-sm mx-auto text-center relative">
          {(step === "verify" || step === "reset") && (
            <button
              onClick={handleBack}
              className="absolute left-0 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
          >
            {current.icon}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white"
          >
            {current.title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 mt-1 text-sm"
          >
            {current.subtitle}
          </motion.p>
        </div>
      </div>

      <div className="flex-1 -mt-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-6 max-w-sm mx-auto"
        >
          <AnimatePresence mode="wait">
            {step === "email" && (
              <motion.form
                key="email"
                onSubmit={handleSendOtp}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {sendError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
                    {sendError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">
                    邮箱
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="请输入注册时的邮箱"
                    required
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1cb0f6] focus:ring-2 focus:ring-[#1cb0f6]/20 transition-all"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 text-xs leading-relaxed">
                  <p className="font-bold mb-1">📋 找回密码流程：</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>输入注册邮箱 → 点击"发送验证码"</li>
                    <li>输入邮箱收到的6位验证码</li>
                    <li>设置新密码 → 完成重置</li>
                  </ol>
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  size="xl"
                  className="w-full"
                  disabled={sendPending}
                >
                  {sendPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "发送验证码"
                  )}
                </Button>
              </motion.form>
            )}

            {step === "verify" && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6 text-center">
                  <p className="text-sm text-slate-500 mb-1">验证码已发送至</p>
                  <p className="text-base font-bold text-slate-700">{email}</p>
                </div>

                <div className="space-y-4">
                  {(verifyError || resendError) && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
                      {verifyError || resendError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-slate-600 mb-3 text-center">
                      输入6位验证码
                    </label>
                    <div className="flex justify-center gap-2">
                      {otpValues.map((value, index) => (
                        <input
                          key={index}
                          ref={(el) => { otpInputRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={value}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onPaste={index === 0 ? handleOtpPaste : undefined}
                          className="w-11 h-13 text-center text-xl font-bold rounded-xl border-2 border-slate-200 text-slate-700 focus:outline-none focus:border-[#1cb0f6] focus:ring-2 focus:ring-[#1cb0f6]/20 transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    size="xl"
                    className="w-full"
                    disabled={verifyPending || otpValues.join("").length !== 6}
                    onClick={handleVerify}
                  >
                    {verifyPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "验证"
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0}
                      className="inline-flex items-center gap-1 text-sm text-[#1cb0f6] font-bold hover:underline disabled:text-slate-300 disabled:no-underline disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? "animate-spin" : ""}`} />
                      {resendCooldown > 0
                        ? `${resendCooldown}s 后重新发送`
                        : "重新发送验证码"}
                    </button>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 text-xs leading-relaxed">
                    <p className="font-bold mb-1">💡 提示</p>
                    <p>如果没有收到验证码，请检查垃圾邮件箱。</p>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "reset" && (
              <motion.form
                key="reset"
                onSubmit={handleResetPassword}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {resetError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
                    {resetError}
                  </div>
                )}

                <div className="bg-[#d4effa] rounded-xl p-3">
                  <p className="text-sm text-[#1899d6]">
                    ✅ 验证成功，请设置新密码
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">
                    新密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="至少8位，含大小写字母"
                      required
                      className="w-full h-12 px-4 pr-12 rounded-xl border-2 border-slate-200 text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1cb0f6] focus:ring-2 focus:ring-[#1cb0f6]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">
                    确认新密码
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="请再次输入新密码"
                      required
                      className="w-full h-12 px-4 pr-12 rounded-xl border-2 border-slate-200 text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#1cb0f6] focus:ring-2 focus:ring-[#1cb0f6]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="secondary"
                  size="xl"
                  className="w-full"
                  disabled={resetPending}
                >
                  {resetPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "重置密码"
                  )}
                </Button>
              </motion.form>
            )}

            {step === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 bg-[#1cb0f6] rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>
                <p className="text-lg font-bold text-slate-700">密码重置成功！</p>
                <p className="text-sm text-slate-500 mt-1">正在跳转到主页...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {step === "email" && (
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                想起密码了？{" "}
                <Link
                  href="/auth/login"
                  className="text-[#1cb0f6] font-bold hover:underline"
                >
                  返回登录
                </Link>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
