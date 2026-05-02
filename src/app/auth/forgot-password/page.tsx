"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, KeyRound, Mail, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { sendResetPasswordClient } from "@/lib/auth-client";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await sendResetPasswordClient(formData.get("email") as string);
    if (result.error) {
      setError(result.error);
      setPending(false);
    } else {
      setIsSuccess(true);
    }
  };

  // 发送成功后显示提示页面
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div className="bg-gradient-to-b from-[#1cb0f6] to-[#1899d6] pt-16 pb-24 px-6">
          <div className="max-w-sm mx-auto text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-24 h-24 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm"
            >
              <CheckCircle className="w-14 h-14 text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl font-bold text-white"
            >
              邮件已发送
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/80 mt-2 text-sm"
            >
              请查收重置密码邮件
            </motion.p>
          </div>
        </div>

        <div className="flex-1 -mt-16 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-6 max-w-sm mx-auto"
          >
            <div className="space-y-4">
              <div className="bg-[#d4effa] rounded-2xl p-5 text-center">
                <Mail className="w-10 h-10 text-[#1cb0f6] mx-auto mb-3" />
                <p className="font-bold text-slate-700 mb-1">📬 请查收重置邮件</p>
                <p className="text-sm text-slate-500 leading-relaxed">
                  我们已向您的邮箱发送了密码重置链接，请点击邮件中的链接重置密码。
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-700 leading-relaxed">
                  💡 如果收件箱看不到，请检查垃圾邮件文件夹。
                </p>
              </div>

              <Link href="/auth/login">
                <Button variant="secondary" size="xl" className="w-full">
                  返回登录
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 顶部装饰 */}
      <div className="bg-gradient-to-b from-[#1cb0f6] to-[#1899d6] pt-12 pb-16 px-6">
        <div className="max-w-sm mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
          >
            <KeyRound className="w-10 h-10 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-bold text-white"
          >
            找回密码
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 mt-1 text-sm"
          >
            输入注册时使用的邮箱，接收重置链接
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm font-medium">
                {error}
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

            <p className="text-xs text-slate-400 leading-relaxed">
              重置密码链接将发送到您的邮箱，请注意查收
            </p>

            <Button
              type="submit"
              variant="secondary"
              size="xl"
              className="w-full"
              disabled={pending}
            >
              {pending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "发送重置链接"
              )}
            </Button>
          </form>

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
        </motion.div>
      </div>
    </div>
  );
}
