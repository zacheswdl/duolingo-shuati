"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Mail, CheckCircle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signUpClient, resendOtpClient } from "@/lib/auth-client";
import { motion, AnimatePresence } from "framer-motion";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [clientError, setClientError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const [sendPending, setSendPending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // 倒计时
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
    const result = await resendOtpClient(email);
    if (result.success) {
      setResendCooldown(60);
    } else {
      setResendError(result.error || "发送失败，请稍后再试");
    }
  };

  // 前端表单验证
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

  // 使用 onSubmit 阻止默认表单提交，保留输入框内容
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
      setStep("confirm");
      setResendCooldown(60);
      setSendPending(false);
    }
  }, []);

  // 返回上一步
  const handleBack = () => {
    setStep("form");
  };

  // 合并显示的错误信息
  const errorMessage = sendError;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 顶部装饰 */}
      <div className="bg-gradient-to-b from-[#58cc02] to-[#4aad02] pt-12 pb-16 px-6">
        <div className="max-w-sm mx-auto text-center relative">
          {step === "confirm" && (
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
            {step === "form" ? (
              <Mail className="w-10 h-10 text-white" />
            ) : (
              <CheckCircle className="w-10 h-10 text-white" />
            )}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white"
          >
            {step === "form" ? "创建账号" : "验证邮箱"}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 mt-1 text-sm"
          >
            {step === "form"
              ? "注册账号，开始刷题练习"
              : "请查收邮箱中的确认邮件"}
          </motion.p>
        </div>
      </div>

      {/* 表单区域 */}
      <div className="flex-1 -mt-8 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-6 max-w-sm mx-auto"
        >
          <AnimatePresence mode="wait">
            {step === "form" ? (
              /* ========== 第一步：邮箱 + 密码 + 确认密码 ========== */
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
                    <li>系统发送确认邮件到邮箱</li>
                    <li>去邮箱点击确认链接 → 自动完成注册并登录</li>
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
            ) : (
              /* ========== 第二步：确认邮件已发送 ========== */
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="mb-6 text-center">
                  <p className="text-sm text-slate-500 mb-1">
                    确认邮件已发送至
                  </p>
                  <p className="text-base font-bold text-slate-700">{email}</p>
                </div>

                <div className="space-y-4">
                  {resendError && (
                    <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
                      {resendError}
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-4 text-sm leading-relaxed">
                    <p className="font-bold mb-1">📧 请查收邮件</p>
                    <p>我们已向您的邮箱发送了一封确认邮件，请点击邮件中的链接完成注册。</p>
                    <p className="mt-2 text-blue-500">如果没有收到，请检查垃圾邮件箱。</p>
                  </div>

                  {/* 重新发送 */}
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
                        : "重新发送确认邮件"}
                    </button>
                  </div>

                  <Link
                    href="/auth/login"
                    className="block w-full"
                  >
                    <Button
                      type="button"
                      variant="primary"
                      size="xl"
                      className="w-full"
                    >
                      前往登录
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 底部链接 */}
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
