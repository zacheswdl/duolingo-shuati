"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, LogIn, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loginClient } from "@/lib/auth-client";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wechatAuthUrl, setWechatAuthUrl] = useState<string | null>(null);
  const [wechatLoading, setWechatLoading] = useState(false);

  useEffect(() => {
    const errorMsg = searchParams.get("error");
    if (errorMsg === "wechat_auth_failed") {
      setError("微信登录失败，请重试");
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchWechatAuthUrl = async () => {
      try {
        const res = await fetch("/api/auth/wechat");
        const data = await res.json();
        if (data.authUrl) {
          setWechatAuthUrl(data.authUrl);
        }
      } catch (err) {
        console.log("微信登录配置未设置，跳过微信登录按钮");
      }
    };
    fetchWechatAuthUrl();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await loginClient(formData.get("email") as string, formData.get("password") as string);
    if (result.error) {
      setError(result.error);
      setPending(false);
    } else {
      router.push("/learn");
    }
  };

  const handleWechatLogin = () => {
    if (wechatAuthUrl) {
      setWechatLoading(true);
      window.location.href = wechatAuthUrl;
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-gradient-to-b from-[#58cc02] to-[#4aad02] pt-12 pb-16 px-6">
        <div className="max-w-sm mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
          >
            <LogIn className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white"
          >
            欢迎回来
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 mt-1 text-sm"
          >
            登录账号，继续刷题练习
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
          {wechatAuthUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-6"
            >
              <Button
                onClick={handleWechatLogin}
                disabled={wechatLoading}
                className="w-full bg-[#07C160] hover:bg-[#07C160]/90 border-[#06AD56] border-b-4 active:border-b-0 text-white"
                size="xl"
              >
                {wechatLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c4.801 0 8.692-3.29 8.692-7.343 0-4.054-3.891-7.342-8.692-7.342zM6.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 5.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.546.719-4.74 2.032-.576.658-.944 1.45-.944 2.29 0 1.908 1.54 3.45 3.433 3.45.658 0 1.284-.18 1.822-.496a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.024-.12-.04-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 15.27 24 13.282 24 10.96c0-3.21-2.931-5.837-6.656-6.108l-.01-.003zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
                    </svg>
                    微信登录
                  </>
                )}
              </Button>
            </motion.div>
          )}

          <div className="flex items-center justify-center mb-4">
            <div className="flex-1 h-px bg-slate-200"></div>
            <span className="px-3 text-slate-400 text-sm font-medium">或</span>
            <div className="flex-1 h-px bg-slate-200"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">
                <Mail className="w-4 h-4 inline mr-1" />
                邮箱
              </label>
              <input
                type="email"
                name="email"
                placeholder="请输入邮箱地址"
                required
                className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 text-slate-700 font-medium placeholder:text-slate-400 focus:outline-none focus:border-[#58cc02] focus:ring-2 focus:ring-[#58cc02]/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-600 mb-1.5">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="请输入密码"
                  required
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

            <div className="text-right">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-[#1cb0f6] font-bold hover:underline"
              >
                忘记密码？
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="xl"
              className="w-full"
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "登录"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              还没有账号？{" "}
              <Link
                href="/auth/register"
                className="text-[#58cc02] font-bold hover:underline"
              >
                立即注册
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}