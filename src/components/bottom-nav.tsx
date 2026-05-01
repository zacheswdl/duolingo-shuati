"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "./Icon";

const navItems = [
  { href: "/learn", label: "章节练习", icon: "book" as IconName },
  { href: "/exam", label: "模拟考试", icon: "swords" as IconName },
  { href: "/favorites", label: "收藏", icon: "star" as IconName },
  { href: "/mistakes", label: "错题本", icon: "file-x" as IconName },
  { href: "/profile", label: "我的", icon: "user" as IconName },
];

export const BottomNav = () => {
  const pathname = usePathname();

  // 答题页面隐藏底部导航
  if (pathname?.startsWith("/lesson") || pathname?.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-slate-200">
      <div className="max-w-4xl mx-auto px-2">
        <div className="flex items-center justify-around h-20">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors",
                  isActive
                    ? "text-[#58cc02]"
                    : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Icon
                  name={item.icon}
                  size={32}
                  className={cn("transition-transform", isActive && "scale-110")}
                />
                <span className="text-xs font-bold">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
