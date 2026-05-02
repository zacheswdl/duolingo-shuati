"use client";

import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-6xl">😵</div>
      <h2 className="text-xl font-semibold text-slate-700">页面加载出错</h2>
      <p className="text-slate-500 text-sm max-w-md text-center">
        {error.message || "发生了未知错误，请稍后再试"}
      </p>
      <div className="flex gap-3 mt-2">
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors text-sm font-medium"
        >
          重试
        </button>
        <button
          onClick={() => router.push("/learn")}
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
        >
          返回首页
        </button>
      </div>
    </div>
  );
}
