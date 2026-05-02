"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { updatePasswordClient } from "@/lib/auth-client";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await updatePasswordClient(formData.get("password") as string);
    if (result.error) {
      setError(result.error);
      setPending(false);
    } else {
      setSuccess(true);
      router.push("/learn");
    }
  };

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
            重置密码
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 mt-1 text-sm"
          >
            请设置新密码
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

            <div className="bg-[#d4effa] rounded-xl p-3">
              <p className="text-sm text-[#1899d6]">
                ✅ 已验证成功，请设置新密码
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
                  placeholder="至少6位字符"
                  required
                  minLength={6}
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
                "更新密码"
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
