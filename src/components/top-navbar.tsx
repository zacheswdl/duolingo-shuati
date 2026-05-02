"use client";

import { useUserProgress } from "@/store/use-user-progress";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon } from "./Icon";

type Props = {
  title?: string;
  showBack?: boolean;
};

export const TopNavbar = ({ title = "浙江省能力验证600道题库", showBack }: Props) => {
  const { hearts, xp, streak, isLoading } = useUserProgress();
  const router = useRouter();
  const pathname = usePathname();

  if (pathname?.startsWith("/lesson")) return null;

  if (isLoading) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b-2 border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={() => router.back()}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <Icon name="chevron-left" size={32} />
              </button>
            )}
            <h1 className="font-bold text-lg text-slate-700 truncate max-w-[180px] sm:max-w-[280px]">
              {title}
            </h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 opacity-0">
            <div className="flex items-center gap-1 text-sm font-bold text-orange-500">
              <Icon name="flame" size={32} />
              <span>{streak}</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-rose-500">
              <Icon name="heart" size={28} />
              <span>{hearts}/5</span>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              <Icon name="star" size={24} />
              <span>{xp.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b-2 border-slate-200">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* 左侧：返回按钮+标题 */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-1 hover:bg-slate-100 rounded-lg transition"
            >
              <Icon name="chevron-left" size={32} />
            </button>
          )}
          <h1 className="font-bold text-lg text-slate-700 truncate max-w-[180px] sm:max-w-[280px]">
            {title}
          </h1>
        </div>

        {/* 右侧：游戏化状态 */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* 连胜火焰 */}
          <div className="flex items-center gap-1 text-sm font-bold text-orange-500">
            <Icon name="flame" size={32} />
            <span>{streak}</span>
          </div>

          {/* 红心 */}
          <div className="flex items-center gap-1 text-sm font-bold text-rose-500">
            <Icon
              name="heart"
              size={28}
              style={{ opacity: hearts === 0 ? 0.3 : 1 }}
            />
            <span>{hearts}/5</span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-1 text-sm font-bold text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            <Icon name="star" size={24} />
            <span>{xp.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
