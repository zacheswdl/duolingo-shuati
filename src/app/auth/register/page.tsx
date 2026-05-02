"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, Mail, CheckCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signUpClient, resendOtpClient, verifyOtpClient } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<"form" | "verify">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [clientError, setClientError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [sendPending, setSendPending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [verifyPending, setVerifyPending] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setResendError(null);
    setOtpValues(["", "", "", "", "", ""]);
    setVerifyError(null);
    const result = await resendOtpClient(email);
    if (result.success) {
      setResendCooldown(60);
    } else {
      setResendError(result.error || "发送失败，请稍后再试");
    }
  };

  const validateForm = (emailVal: string, pwd: string, confirmPwd: string): string | null => {
    if (!emailVal) {
      return "请填写邮箱";
    }
    if (pwd.length < 8) {
      return "密码至少8个字符";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "密码必须包含至少一个大写字母";
    }
    if (!/[a-z]/.test(pwd)) {
      return "密码必须包含至少一个小写字母";
    }
    if (pwd !== confirmPwd) {
      return "两次输入的密码不一致";
    }
    return null;
  };

  const handleFormSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setClientError(null);
    setSendError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const emailVal = formData.get("email") as string;
    const pwd = formData.get("password") as string;
    const confirmPwd = formData.get("confirmPassword") as string;

    const validationError = validateForm(emailVal, pwd, confirmPwd);
    if (validationError) {
      setClientError(validationError);
      return;
    }

    setSendPending(true);
    const result = await signUpClient(emailVal, pwd);
    if (result.error) {
      setSendError(result.error);
      setSendPending(false);
    } else {
      setEmail(emailVal);
      setPassword(pwd);
      setStep("verify");
      setResendCooldown(60);
      setSendPending(false);
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    }
  }, []);

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
    const result = await verifyOtpClient(email, token);
    if (result.error) {
      setVerifyError(result.error);
      setVerifyPending(false);
    } else {
      setVerifySuccess(true);
      setVerifyPending(false);
      setTimeout(() => {
        router.push("/learn");
      }, 1500);
    }
  };

  useEffect(() => {
    const token = otpValues.join("");
    if (token.length === 6 && !verifyPending && !verifySuccess) {
      handleVerify();
    }
  }, [otpValues]);

  const handleBack = () => {
    setStep("form");
    setOtpValues(["", "", "", "", "", ""]);
    setVerifyError(null);
  };

  const errorMessage = sendError;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-gradient-to-b from-[#58cc02] to-[#4aad02] pt-12 pb-16 px-6">
        <div className="max-w-sm mx-auto text-center relative">
          {step === "verify" && !verifySuccess && (
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
            {verifySuccess ? (
              <CheckCircle className="w-10 h-10 text-white" />
            ) : step === "form" ? (
              <Mail className="w-10 h-10 text-white" />
            ) : (
              <Mail className="w-10 h-10 text-white" />
            )}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white"
          >
            {verifySuccess ? "注册成功" : step === "form" ? "创建账号" : "验证邮箱"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 mt-1 text-sm"
          >
            {verifySuccess
              ? "正在跳转到主页..."
              : step === "form"
                ? "注册账号，开始刷题练习"
                : "输入邮箱收到的6位验证码"}
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
            {step === "form" ? (
              <motion.form
                key="form"
                ref={formRef}
                onSubmit={handleFormSubmit}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {(sendError || clientError) && (
                  <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
                    {clientError || sendError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">
                    邮箱
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="请输入邮箱地址"
                    required
                    defaultValue={email}
                    className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#58cc02] focus:ring-2 focus:ring-[#58cc02]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-1.5">
                    设置密码
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="至少8位，含大小写字母"
                      required
                      defaultValue={password}
                      className="w-full h-12 px-4 pr-12 rounded-xl border-2 border-slate-200 text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#58cc02] focus:ring-2 focus:ring-[#58cc02]/20 transition-all"
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
                    确认密码
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      placeholder="请再次输入密码"
                      required
                      defaultValue={confirmPassword}
                      className="w-full h-12 px-4 pr-12 rounded-xl border-2 border-slate-200 text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#58cc02] focus:ring-2 focus:ring-[#58cc02]/20 transition-all"
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

                <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 text-xs leading-relaxed">
                  <p className="font-bold mb-1">📋 注册流程：</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>填写邮箱、密码、确认密码 → 点击"注册"</li>
                    <li>系统发送6位验证码到邮箱</li>
                    <li>输入验证码 → 完成注册并登录</li>
                  </ol>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="xl"
                  className="w-full"
                  disabled={sendPending}
                >
                  {sendPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    "注册"
                  )}
                </Button>
              </motion.form>
            ) : verifySuccess ? (
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
                  className="w-16 h-16 bg-[#58cc02] rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle className="w-8 h-8 text-white" />
                </motion.div>
                <p className="text-lg font-bold text-slate-700">注册成功！</p>
                <p className="text-sm text-slate-500 mt-1">正在跳转到主页...</p>
              </motion.div>
            ) : (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6 text-center">
                  <p className="text-sm text-slate-500 mb-1">
                    验证码已发送至
                  </p>
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
                          className="w-11 h-13 text-center text-xl font-bold rounded-xl border-2 border-slate-200 text-slate-700 focus:outline-none focus:border-[#58cc02] focus:ring-2 focus:ring-[#58cc02]/20 transition-all"
                        />
                      ))}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="primary"
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
                    <p>验证码有效期为24小时。如果没有收到，请检查垃圾邮件箱。</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {step === "form" && (
            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                已有账号？{" "}
                <Link
                  href="/auth/login"
                  className="text-[#58cc02] font-bold hover:underline"
                >
                  立即登录
                </Link>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
