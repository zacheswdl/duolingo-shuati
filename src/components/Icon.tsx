"use client";

import React from "react";
import Image from "next/image";
import {
  Book,
  Swords,
  Trophy,
  FileX,
  User,
  Flame,
  Heart,
  Star,
  ChevronLeft,
  Gift,
  CheckCircle2,
  Target,
  Pen,
  Clock,
  AlertTriangle,
  Crown,
  Medal,
  RotateCcw,
  XCircle,
  LogOut,
  Settings,
  Lock,
  BarChart3,
  Zap,
  X,
  Loader2,
  Frown,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type IconName =
  | "book"
  | "swords"
  | "trophy"
  | "file-x"
  | "user"
  | "flame"
  | "heart"
  | "star"
  | "chevron-left"
  | "gift"
  | "check-circle"
  | "target"
  | "pen"
  | "clock"
  | "alert-triangle"
  | "crown"
  | "medal"
  | "rotate-ccw"
  | "x-circle"
  | "log-out"
  | "settings"
  | "lock"
  | "bar-chart"
  | "zap"
  | "x"
  | "loader"
  | "frown"
  | "arrow-left";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  mode?: "glass" | "emoji" | "image";
  color?: string;
}

const iconLucideMap: Record<IconName, React.ComponentType<{ className?: string; size?: number | string; color?: string }>> = {
  book: Book,
  swords: Swords,
  trophy: Trophy,
  "file-x": FileX,
  user: User,
  flame: Flame,
  heart: Heart,
  star: Star,
  "chevron-left": ChevronLeft,
  gift: Gift,
  "check-circle": CheckCircle2,
  target: Target,
  pen: Pen,
  clock: Clock,
  "alert-triangle": AlertTriangle,
  crown: Crown,
  medal: Medal,
  "rotate-ccw": RotateCcw,
  "x-circle": XCircle,
  "log-out": LogOut,
  settings: Settings,
  lock: Lock,
  "bar-chart": BarChart3,
  zap: Zap,
  x: X,
  loader: Loader2,
  frown: Frown,
  "arrow-left": ArrowLeft,
};

const iconEmojiMap: Record<IconName, string> = {
  book: "📖",
  swords: "⚔️",
  trophy: "🏆",
  "file-x": "❌",
  user: "👤",
  flame: "🔥",
  heart: "❤️",
  star: "⭐",
  "chevron-left": "⬅️",
  gift: "🎁",
  "check-circle": "✅",
  target: "🎯",
  pen: "✏️",
  clock: "⏰",
  "alert-triangle": "⚠️",
  crown: "👑",
  medal: "🥈",
  "rotate-ccw": "🔄",
  "x-circle": "❌",
  "log-out": "🚪",
  settings: "⚙️",
  lock: "🔒",
  "bar-chart": "📊",
  zap: "⚡",
  x: "❌",
  loader: "⏳",
  frown: "😢",
  "arrow-left": "⬅️",
};

const iconFileMap: Record<IconName, string> = {
  book: "/icons/book.png",
  swords: "/icons/swords.png",
  trophy: "/icons/trophy.png",
  "file-x": "/icons/file-x.png",
  user: "/icons/user.png",
  flame: "/icons/flame.png",
  heart: "/icons/heart.png",
  star: "/icons/star.png",
  "chevron-left": "/icons/chevron-left.png",
  gift: "/icons/gift.png",
  "check-circle": "/icons/check-circle.png",
  target: "/icons/target.png",
  pen: "/icons/pen.png",
  clock: "/icons/clock.png",
  "alert-triangle": "/icons/alert-triangle.png",
  crown: "/icons/crown.png",
  medal: "/icons/medal.png",
  "rotate-ccw": "/icons/rotate-ccw.png",
  "x-circle": "/icons/x-circle.png",
  "log-out": "/icons/log-out.png",
  settings: "/icons/settings.png",
  lock: "/icons/lock.png",
  "bar-chart": "/icons/bar-chart.png",
  zap: "/icons/zap.png",
  x: "/icons/x.png",
  loader: "/icons/loader.png",
  frown: "/icons/frown.png",
  "arrow-left": "/icons/arrow-left.png",
};

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  className,
  style,
  mode = "glass",
  color,
}) => {
  if (mode === "image") {
    const iconPath = iconFileMap[name];
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center select-none",
          className
        )}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
          transform: "translateZ(0)",
          ...style,
        }}
      >
        <Image
          src={iconPath}
          alt={name}
          width={size}
          height={size}
          className="object-contain"
        />
      </span>
    );
  }

  if (mode === "emoji") {
    const emoji = iconEmojiMap[name] || "❓";
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center select-none",
          className
        )}
        style={{
          fontSize: `${size}px`,
          lineHeight: 1,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
          transform: "translateZ(0)",
          ...style,
        }}
      >
        {emoji}
      </span>
    );
  }

  const LucideIcon = iconLucideMap[name];
  const containerSize = size * 1.6;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center select-none bg-white/20 rounded-2xl backdrop-blur-sm",
        className
      )}
      style={{
        width: `${containerSize}px`,
        height: `${containerSize}px`,
        ...style,
      }}
    >
      <LucideIcon
        size={size}
        color={color}
        className={cn(name === "loader" && "animate-spin")}
      />
    </span>
  );
};
