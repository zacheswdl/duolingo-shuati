"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function WechatCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("正在处理微信登录...");

  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      setStatus("error");
      setMessage("微信授权失败，未获取到授权码");
      setTimeout(() => {
        router.push("/auth/login?error=wechat_auth_failed");
      }, 3000);
      return;
    }

    const handleWechatLogin = async () => {
      try {
        const res = await fetch("/api/auth/wechat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.openid) {
          throw new Error("未能获取微信用户信息");
        }

        setStatus("success");
        setMessage("微信登录成功！正在跳转...");

        setTimeout(() => {
          router.push("/learn");
        }, 1500);
      } catch (error: any) {
        setStatus("error");
        setMessage(error.message || "微信登录失败");
        setTimeout(() => {
          router.push("/auth/login?error=wechat_auth_failed");
        }, 3000);
      }
    };

    handleWechatLogin();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={status === "loading" ? { rotate: 360 } : {}}
          transition={status === "loading" ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{
            backgroundColor:
              status === "success"
                ? "#58cc02"
                : status === "error"
                ? "#ff4b4b"
                : "#58cc02",
          }}
        >
          {status === "loading" ? (
            <Loader2 className="w-10 h-10 text-white" />
          ) : status === "success" ? (
            <CheckCircle className="w-10 h-10 text-white" />
          ) : (
            <XCircle className="w-10 h-10 text-white" />
          )}
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-slate-800 mb-2"
        >
          {status === "success" ? "登录成功" : status === "error" ? "登录失败" : "处理中"}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-500"
        >
          {message}
        </motion.p>

        {status !== "loading" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6"
          >
            <button
              onClick={() => router.push("/auth/login")}
              className="text-[#58cc02] font-bold hover:underline"
            >
              返回登录页面
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}