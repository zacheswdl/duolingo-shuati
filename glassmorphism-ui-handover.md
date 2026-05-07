# 网页端毛玻璃UI设计交接文档

> 生成日期：2026-05-07
> 用途：供另一开发工具照葫芦画瓢实现一致的毛玻璃UI效果

---

## 目录

1. [设计概述](#1-设计概述)
2. [技术实现基础](#2-技术实现基础)
3. [核心毛玻璃配方](#3-核心毛玻璃配方)
4. [各场景应用规范](#4-各场景应用规范)
5. [图标毛玻璃系统](#5-图标毛玻璃系统)
6. [卡片设计规范](#6-卡片设计规范)
7. [页面布局框架](#7-页面布局框架)
8. [颜色系统](#8-颜色系统)
9. [动效规范](#9-动效规范)
10. [完整代码示例](#10-完整代码示例)
11. [常见场景速查表](#11-常见场景速查表)
12. [注意事项](#12-注意事项)

---

## 1. 设计概述

### 1.1 设计风格

本项目采用 **Duolingo 风格 + 轻度毛玻璃（Glassmorphism）** 设计语言。

核心理念：
- **背景简洁**：白色/浅色背景，无花哨装饰
- **卡片分明**：使用边框 (`border-2`) 和圆角 (`rounded-2xl`) 分隔区域
- **毛玻璃点缀**：在特定场景使用 `bg-white/20 + backdrop-blur-sm` 实现毛玻璃效果
- **游戏化视觉**：鲜艳的主色（绿色 `#58cc02`）搭配 XP、红心、连胜等游戏元素
- **Juicy 按钮**：底部边框按压效果，Duolingo 标志性风格

### 1.2 视觉层次

```
层级 1: 纯色背景（白色 #ffffff）
层级 2: 卡片区域（白色 + border-2 border-slate-200）
层级 3: 渐变卡片（彩色渐变背景）
层级 4: 毛玻璃元素（白色半透明 + backdrop-blur，用于图标和装饰）
层级 5: 浮层（弹窗、导航栏，fixed 定位）
```

---

## 2. 技术实现基础

### 2.1 技术栈

| 技术 | 版本/说明 |
|------|-----------|
| 框架 | Next.js 16 (App Router) |
| 样式方案 | Tailwind CSS 4 (utility-first) |
| 动画库 | Framer Motion |
| 图标 | Lucide React (SVG) + 自定义 PNG |
| CSS 后处理 | PostCSS |

### 2.2 Tailwind CSS 配置

**文件：`src/app/globals.css`**

```css
@import "tailwindcss";

@theme inline {
  --color-background: #ffffff;
  --color-foreground: #171717;
  --color-primary: #58cc02;
  --color-primary-dark: #4aad02;
  --color-primary-light: #d4edc9;
  --color-danger: #ff4b4b;
  --color-danger-light: #ffe0e0;
  --color-warning: #ffc800;
  --color-warning-light: #fff3cc;
  --color-info: #1cb0f6;
  --color-info-light: #d4effa;
  --color-info-dark: #1899d6;
  --color-mascot: #ff9600;

  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-mono);
}

body {
  background: var(--color-background);
  color: var(--color-foreground);
  font-family: var(--font-sans), Arial, Helvetica, sans-serif;
}

/* Duolingo-style juicy button base class */
.juicy-btn {
  @apply rounded-2xl font-bold border-b-4 transition-all duration-100 active:border-b-0 active:translate-y-1 uppercase tracking-wide;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}
```

### 2.3 自定义动画

```css
/* Shake animation */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
  20%, 40%, 60%, 80% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 0.5s ease-in-out;
}

/* XP float up animation */
@keyframes float-up {
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-60px) scale(1.3); }
}
.animate-float-up {
  animation: float-up 1s ease-out forwards;
}

/* Bounce in animation */
@keyframes bounce-in {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); opacity: 1; }
}
.animate-bounce-in {
  animation: bounce-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Confetti-like sparkle */
@keyframes sparkle {
  0%, 100% { opacity: 0; transform: scale(0); }
  50% { opacity: 1; transform: scale(1); }
}
```

### 2.4 工具函数

**文件：`src/lib/utils.ts`**

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 3. 核心毛玻璃配方

### 3.1 基础毛玻璃组合

**这是本项目毛玻璃效果的核心配方，必须严格使用以下 Tailwind class 组合：**

```
bg-white/20 + backdrop-blur-sm + rounded-2xl
```

| 属性 | Tailwind Class | 实际值 | 说明 |
|------|----------------|--------|------|
| 背景色 | `bg-white/20` | `background: rgba(255, 255, 255, 0.2)` | 白色 20% 透明度 |
| 毛玻璃模糊 | `backdrop-blur-sm` | `backdrop-filter: blur(4px)` | 轻度模糊 |
| 圆角 | `rounded-2xl` | `border-radius: 1rem (16px)` | 大圆角 |

### 3.2 使用场景

毛玻璃效果仅用于以下场景：

1. **图标容器**（Icon 组件默认模式）
2. **渐变背景上的装饰性元素**（如用户头像框、功能图标容器）
3. **登录/注册页面的图标展示区域**

### 3.3 毛玻璃强度变体

| 场景 | 背景透明度 | 模糊度 | Tailwind 组合 |
|------|------------|--------|---------------|
| 默认图标 | `bg-white/20` | `backdrop-blur-sm` | `bg-white/20 rounded-2xl backdrop-blur-sm` |
| 强对比渐变背景 | `bg-white/15` | 无 | `bg-white/15 rounded-xl` |
| 弱对比渐变背景 | `bg-white/20` | `backdrop-blur-sm` | `bg-white/20 rounded-xl backdrop-blur-sm` |
| 纯装饰容器 | `bg-white/20` | `backdrop-blur-sm` | `bg-white/20 rounded-3xl backdrop-blur-sm` |

### 3.4 重要说明

- **毛玻璃效果不用于卡片主体**：主要卡片使用纯白色背景 + 边框，不使用毛玻璃
- **毛玻璃效果不用于导航栏**：顶栏和底栏使用纯白色背景
- **毛玻璃效果不用于按钮**：按钮使用实心颜色 + 底部边框

---

## 4. 各场景应用规范

### 4.1 图标组件（Icon.tsx）

**文件：`src/components/Icon.tsx`**

这是毛玻璃效果的核心应用。Icon 组件默认使用 `"glass"` 模式。

```tsx
import React from "react";
import Image from "next/image";
import { Book, Swords, Trophy, /* ... more icons */ } from "lucide-react";
import { cn } from "@/lib/utils";

export type IconName = "book" | "swords" | "trophy" | /* ... */ "arrow-left";

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  mode?: "glass" | "emoji" | "image";
  color?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  className,
  style,
  mode = "glass",
  color,
}) => {
  // image 模式：使用 PNG 图片
  if (mode === "image") {
    const iconPath = iconFileMap[name];
    return (
      <span
        className={cn("inline-flex items-center justify-center select-none", className)}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
          transform: "translateZ(0)",
          ...style,
        }}
      >
        <Image src={iconPath} alt={name} width={size} height={size} className="object-contain" />
      </span>
    );
  }

  // emoji 模式：使用系统 emoji
  if (mode === "emoji") {
    const emoji = iconEmojiMap[name] || "❓";
    return (
      <span
        className={cn("inline-flex items-center justify-center select-none", className)}
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

  // glass 模式（默认）：毛玻璃容器 + Lucide SVG 图标
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
```

**关键规则：**

1. 容器尺寸 = 图标尺寸 × 1.6（如 size=24 → 容器 38.4px）
2. 使用 `inline-flex` + `items-center` + `justify-center` 居中
3. **毛玻璃三件套必须同时存在**：`bg-white/20` + `rounded-2xl` + `backdrop-blur-sm`
4. 添加 `select-none` 防止选中
5. 可传入 `className` 覆盖默认样式

**使用示例：**

```tsx
<Icon name="trophy" size={20} />
<Icon name="book" size={28} />
<Icon name="flame" size={32} className="text-orange-500" />
<Icon name="heart" size={28} style={{ opacity: hearts === 0 ? 0.3 : 1 }} />
```

### 4.2 登录/注册页面图标区域

**应用场景：认证页面的装饰性图标容器**

```tsx
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", stiffness: 200, damping: 15 }}
  className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm"
>
  <LogIn className="w-10 h-10 text-white" />
</motion.div>
```

**规格：**
- 容器：`w-20 h-20` (80px)
- 背景：`bg-white/20`
- 圆角：`rounded-3xl` (24px)
- 模糊：`backdrop-blur-sm`
- 图标：40px (w-10 h-10)
- 位置：居中 + 底部间距

### 4.3 渐变卡片上的毛玻璃子元素

**应用场景：用户信息卡片（profile 页面）中的统计小卡片**

```tsx
<div className="bg-gradient-to-br from-[#58cc02] to-[#4aad02] rounded-2xl p-6 text-white">
  {/* ... */}
  <div className="grid grid-cols-4 gap-2">
    <div className="bg-white/15 rounded-xl p-3 text-center">
      <Icon name="star" size={28} />
      <p className="text-xl font-bold">{xp.toLocaleString()}</p>
      <p className="text-xs text-white/70">总经验</p>
    </div>
    {/* ... 更多统计项 */}
  </div>
</div>
```

**规格：**
- 父容器：渐变背景
- 子元素：`bg-white/15` (不使用 backdrop-blur，因为是半透明白色覆盖在渐变上)
- 圆角：`rounded-xl` (12px)

### 4.4 学习页面题库名称卡片图标

**应用场景：学习页面顶部题库名称卡片的图标容器**

```tsx
<div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
  <div className="flex items-center gap-4">
    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
      <Book className="w-7 h-7" />
    </div>
    <div>
      <h2 className="text-xl font-bold">...</h2>
      <p className="text-blue-100 text-sm">...</p>
    </div>
  </div>
</div>
```

**规格：**
- 容器：`w-14 h-14` (56px)
- 背景：`bg-white/20`
- 圆角：`rounded-xl`
- 图标：28px (w-7 h-7)
- 注意：此处**不使用** `backdrop-blur-sm`（因为渐变背景本身已提供足够对比度）

### 4.5 排行榜排名图标

**应用场景：排行榜第一名显示皇冠图标，2-3名显示奖牌图标**

```tsx
const rankIcon = entry.rank === 1
  ? <Icon name="crown" size={20} />
  : entry.rank <= 3
  ? <Icon name="medal" size={20} />
  : null;
```

使用 Icon 组件默认 glass 模式，自动应用毛玻璃效果。

---

## 5. 图标毛玻璃系统

### 5.1 支持的图标列表

| 图标名称 | Lucide 组件 | 用途 |
|----------|-------------|------|
| book | Book | 章节练习、学习 |
| swords | Swords | 模拟考试 |
| trophy | Trophy | 排行榜、成就 |
| file-x | FileX | 错题本 |
| user | User | 个人中心 |
| flame | Flame | 连胜 |
| heart | Heart | 红心 |
| star | Star | XP/经验值 |
| chevron-left | ChevronLeft | 返回 |
| gift | Gift | 每日任务 |
| check-circle | CheckCircle2 | 完成/正确 |
| target | Target | 目标 |
| pen | Pen | 编辑 |
| clock | Clock | 时间 |
| alert-triangle | AlertTriangle | 警告 |
| crown | Crown | 第一名 |
| medal | Medal | 第二/三名 |
| rotate-ccw | RotateCcw | 重置 |
| x-circle | XCircle | 错误 |
| log-out | LogOut | 退出 |
| settings | Settings | 设置 |
| lock | Lock | 锁定 |
| bar-chart | BarChart3 | 统计 |
| zap | Zap | 闪电/快速 |
| x | X | 关闭 |
| loader | Loader2 | 加载中（旋转） |
| frown | Frown | 难过表情 |
| arrow-left | ArrowLeft | 返回 |

### 5.2 图标尺寸规范

| 使用场景 | size 值 | 容器尺寸 | 说明 |
|----------|---------|---------|------|
| 导航栏状态图标 | 32 | 51.2px | 火焰、红心、XP 星号 |
| 页面标题图标 | 28 | 44.8px | 章节标题、区块标题 |
| 卡片内图标 | 20-24 | 32-38.4px | 统计卡片、任务卡片 |
| 列表项图标 | 16-20 | 25.6-32px | 排行榜条目、统计行 |
| 大装饰图标 | 64-104 | 102.4-166.4px | 考试页面、结果页 |
| 成就图标 | 24 | 38.4px | 成就墙 |

### 5.3 三种渲染模式

```tsx
// 1. Glass 模式（默认）- 毛玻璃容器 + SVG
<Icon name="book" size={24} mode="glass" />

// 2. Emoji 模式 - 使用系统 emoji
<Icon name="book" size={24} mode="emoji" />

// 3. Image 模式 - 使用 PNG 图片
<Icon name="book" size={24} mode="image" />
```

**模式选择指南：**

| 场景 | 推荐模式 | 原因 |
|------|----------|------|
| 导航栏 | glass | 统一风格 |
| 按钮/列表 | glass | 清晰可辨 |
| 小程序端 | image | 兼容性好 |
| 装饰性场景 | emoji | 趣味性 |

---

## 6. 卡片设计规范

### 6.1 卡片类型与样式

| 卡片类型 | 样式 | 圆角 | 边框 | 背景 |
|----------|------|------|------|------|
| 标准卡片 | 白色卡片 | `rounded-2xl` | `border-2 border-slate-200` | `bg-white` |
| 小卡片 | 紧凑卡片 | `rounded-xl` | `border-2 border-slate-200` | `bg-white` |
| 渐变卡片 | 彩色渐变 | `rounded-2xl` | 无 | `bg-gradient-to-r/br` |
| 统计小卡片 | 白色小卡片 | `rounded-xl` | 无 | `bg-slate-50` + `border` |
| 列表项卡片 | 可点击条目 | `rounded-2xl` | `border-2` | `bg-white` + hover |
| 状态卡片 | 完成/进行中 | `rounded-xl` | `border` | 颜色渐变 |

### 6.2 标准卡片模板

```tsx
<div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
  <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
    <Icon name="trophy" size={20} />
    标题
  </h3>
  <div className="space-y-3">
    {/* 内容 */}
  </div>
</div>
```

### 6.3 渐变卡片模板

```tsx
<div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
  <div className="flex items-center gap-4">
    <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
      <Book className="w-7 h-7" />
    </div>
    <div>
      <h2 className="text-xl font-bold">标题</h2>
      <p className="text-blue-100 text-sm">描述</p>
    </div>
  </div>
</div>
```

### 6.4 可点击卡片模板

```tsx
<button
  className="flex items-center gap-4 w-full p-4 bg-white border-2 border-slate-200 rounded-2xl 
             hover:border-[#58cc02] hover:bg-[#d4edc9]/20 transition-all text-left"
>
  <div className="w-12 h-12 bg-gradient-to-br from-[#58cc02] to-[#4aad02] rounded-xl 
                  flex items-center justify-center text-white font-bold text-lg shrink-0">
    序号
  </div>
  <div className="flex-1 min-w-0">
    <p className="font-bold text-slate-700 truncate">标题</p>
    <p className="text-sm text-slate-400">描述</p>
  </div>
  <Icon name="book" size={24} style={{ opacity: 0.5 }} />
</button>
```

### 6.5 卡片间距规范

```tsx
<div className="flex flex-col gap-6">
  {/* 卡片之间间距 24px (gap-6) */}
  <div className="space-y-4">
    {/* 卡片内部元素间距 16px (space-y-4) */}
  </div>
</div>
```

---

## 7. 页面布局框架

### 7.1 主布局结构

**文件：`src/app/(main)/layout.tsx`**

```tsx
import { TopNavbar } from "@/components/top-navbar";
import { BottomNav } from "@/components/bottom-nav";
import { ProgressHydrator } from "@/components/progress-hydrator";
import { AuthGuard } from "@/components/auth-guard";

const MainLayout = ({ children }: Props) => {
  return (
    <AuthGuard>
      <ProgressHydrator />
      <TopNavbar />
      <main className="flex-1 pt-14 pb-20">
        <div className="max-w-4xl mx-auto px-4 py-6 h-full">
          {children}
        </div>
      </main>
      <BottomNav />
    </AuthGuard>
  );
};
```

**布局特点：**
- 最大宽度 `max-w-4xl` (896px) 居中
- 左右间距 `px-4` (16px)
- 上下内边距 `py-6` (24px)
- 顶部导航固定高度 `pt-14` (56px)
- 底部导航固定高度 `pb-20` (80px)

### 7.2 顶部导航栏

**文件：`src/components/top-navbar.tsx`**

```tsx
<header className="fixed top-0 left-0 right-0 z-40 bg-white border-b-2 border-slate-200">
  <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
    {/* 左侧：返回按钮 + 标题 */}
    <div className="flex items-center gap-3">
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
        <Icon name="heart" size={28} />
        <span>{hearts}/5</span>
      </div>

      {/* XP */}
      <div className="flex items-center gap-1 text-sm font-bold text-amber-500 
                      bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
        <Icon name="star" size={24} />
        <span>{xp.toLocaleString()}</span>
      </div>
    </div>
  </div>
</header>
```

**导航栏样式规范：**
- 固定定位：`fixed top-0 left-0 right-0 z-40`
- 背景：`bg-white`
- 边框：`border-b-2 border-slate-200`
- 高度：`h-14` (56px)
- 内容区域：`max-w-4xl mx-auto px-4`
- **不使用毛玻璃效果**

### 7.3 底部导航栏

**文件：`src/components/bottom-nav.tsx`**

```tsx
<nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t-2 border-slate-200">
  <div className="max-w-4xl mx-auto px-2">
    <div className="flex items-center justify-around h-20">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors",
              isActive ? "text-[#58cc02]" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Icon name={item.icon} size={32} 
                  className={cn("transition-transform", isActive && "scale-110")} />
            <span className="text-xs font-bold">{item.label}</span>
          </Link>
        );
      })}
    </div>
  </div>
</nav>
```

**导航栏样式规范：**
- 固定定位：`fixed bottom-0 left-0 right-0 z-40`
- 背景：`bg-white`
- 边框：`border-t-2 border-slate-200`
- 高度：`h-20` (80px)
- 激活颜色：`text-[#58cc02]` + `scale-110`
- **不使用毛玻璃效果**

---

## 8. 颜色系统

### 8.1 核心品牌色

| 名称 | 色值 | Tailwind | 用途 |
|------|------|----------|------|
| Primary Green | `#58cc02` | `text-[#58cc02]` | 主按钮、激活状态、正确答案 |
| Primary Dark | `#4aad02` | - | 渐变深色端 |
| Primary Light | `#d4edc9` | - | hover 背景、浅色装饰 |

### 8.2 功能色

| 名称 | 色值 | Tailwind | 用途 |
|------|------|----------|------|
| Danger/错误 | `#ff4b4b` | `text-[#ff4b4b]` | 错误答案、红心 |
| Danger Light | `#ffe0e0` | - | 错误背景 |
| Warning/警告 | `#ffc800` | `text-[#ffc800]` | XP、警告 |
| Warning Light | `#fff3cc` | - | 警告背景 |
| Info/信息 | `#1cb0f6` | `text-[#1cb0f6]` | 信息提示 |
| Info Light | `#d4effa` | - | 信息背景 |
| Info Dark | `#1899d6` | - | 信息深色 |
| Mascot Orange | `#ff9600` | - | 装饰色 |

### 8.3 背景色

| 用途 | Tailwind Class | 实际值 |
|------|----------------|--------|
| 页面背景 | `bg-white` | `#ffffff` |
| 卡片背景 | `bg-white` | `#ffffff` |
| 卡片背景(浅灰) | `bg-slate-50` | `#f8fafc` |
| 进度条背景 | `bg-slate-100` | `#f1f5f9` |
| 毛玻璃背景 | `bg-white/20` | `rgba(255,255,255,0.2)` |
| 毛玻璃半透明白 | `bg-white/15` | `rgba(255,255,255,0.15)` |

### 8.4 边框色

| 用途 | Tailwind Class | 实际值 |
|------|----------------|--------|
| 主边框 | `border-slate-200` | `#e2e8f0` |
| 激活边框 | `border-[#58cc02]` | `#58cc02` |
| 错误边框 | `border-[#ff4b4b]` | `#ff4b4b` |
| 警告边框 | `border-amber-200` | `#fde68a` |
| 成功边框 | `border-green-200` | `#bbf7d0` |

### 8.5 文字色

| 用途 | Tailwind Class | 实际值 |
|------|----------------|--------|
| 主文字 | `text-slate-700` | `#334155` |
| 次要文字 | `text-slate-500` | `#64748b` |
| 辅助文字 | `text-slate-400` | `#94a3b8` |
| 标题文字 | `text-slate-800` | `#1e293b` |
| 激活链接 | `text-[#58cc02]` | `#58cc02` |
| 错误文字 | `text-[#ff4b4b]` | `#ff4b4b` |

### 8.6 渐变组合

| 渐变名称 | Class | 用途 |
|----------|-------|------|
| 绿色渐变 | `from-[#58cc02] to-[#4aad02]` | 用户卡片、按钮 |
| 蓝色渐变 | `from-blue-500 to-blue-600` | 题库卡片 |
| 黄色/橙色渐变 | `from-[#ffc800] to-[#ff9600]` | 考试图标 |
| 琥珀渐变 | `from-amber-50 to-orange-50` | 排名卡片 |
| 金色渐变 | `from-yellow-50 to-amber-50` | 第一名背景 |

---

## 9. 动效规范

### 9.1 页面入场动画

使用 Framer Motion 实现淡入 + 上滑效果：

```tsx
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.05 }}
>
  {/* 内容 */}
</motion.div>
```

**延迟阶梯：**
- 第一个元素：`delay: 0.05`
- 第二个元素：`delay: 0.1`
- 第三个元素：`delay: 0.15`
- 以此类推，每个元素增加 0.05

### 9.2 列表项动画

```tsx
{items.map((item, index) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
  >
    {/* 内容 */}
  </motion.div>
))}
```

### 9.3 图标弹入动画

```tsx
<motion.div
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ type: "spring", stiffness: 200, damping: 15 }}
>
  <Icon name="trophy" size={64} />
</motion.div>
```

### 9.4 进度条动画

```tsx
<motion.div
  initial={{ width: 0 }}
  animate={{ width: `${percentage}%` }}
  transition={{ duration: 1, delay: 0.3 }}
  className="h-full rounded-full bg-[#58cc02]"
/>
```

### 9.5 答错抖动动画

使用 CSS 动画（已在 globals.css 中定义）：

```tsx
<div className="animate-shake">
  {/* 错误反馈内容 */}
</div>
```

### 9.6 XP 飘出动画

```tsx
<motion.div
  initial={{ opacity: 1, y: 0 }}
  animate={{ opacity: 0, y: -60 }}
  transition={{ duration: 1, ease: "easeOut" }}
  className="absolute text-[#58cc02] font-bold text-lg"
>
  +10 XP
</motion.div>
```

### 9.7 彩纸飘落动画（考试通过）

```tsx
{Array.from({ length: 50 }).map((_, i) => (
  <motion.div
    key={i}
    className="absolute w-3 h-3 rounded-full"
    style={{
      backgroundColor: ["#58cc02", "#ffc800", "#1cb0f6", "#ff4b4b", "#ff9600"][i % 5],
      left: `${Math.random() * 100}%`,
    }}
    initial={{ y: -20, opacity: 1 }}
    animate={{ y: "100vh", opacity: 0, rotate: Math.random() * 720 }}
    transition={{
      duration: 2 + Math.random() * 2,
      delay: Math.random() * 0.5,
      ease: "easeIn",
    }}
  />
))}
```

---

## 10. 完整代码示例

### 10.1 学习页面（完整版）

**文件：`src/app/(main)/learn/page.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Book, FileText, CheckCircle, XCircle, Star } from "lucide-react";
import { Icon, type IconName } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useUserProgress } from "@/store/use-user-progress";
import { getChapters, getDailyTasks, getUserStats, getLeaderboard, getUserRank } from "@/lib/supabase/client-actions";
import { DAILY_TASKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { UserDailyTask, LeaderboardEntry } from "@/lib/types";

export default function LearnPage() {
  const router = useRouter();
  const { hearts, xp, streak, isLoading } = useUserProgress();
  const [chapters, setChapters] = useState<string[]>([]);
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [dailyTasks, setDailyTasks] = useState<UserDailyTask[]>([]);
  const [stats, setStats] = useState({ totalQuestions: 0, practiced: 0, mistakes: 0, favorites: 0 });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [myRankEntry, setMyRankEntry] = useState<LeaderboardEntry | null>(null);
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false);

  // 加载数据逻辑...
  useEffect(() => {
    const load = async () => {
      try {
        const [chaptersData, tasksData, statsData, leaderboardData] = await Promise.all([
          getChapters(),
          getDailyTasks(),
          getUserStats(),
          getLeaderboard(50),
        ]);
        setChapters(chaptersData);
        setDailyTasks(tasksData);
        setStats(statsData);
        setLeaderboard(leaderboardData);

        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        const user = authData?.user;
        if (user) {
          setCurrentUserId(user.id);
          if (!leaderboardData.find((e: LeaderboardEntry) => e.user_id === user.id)) {
            try {
              const rankEntry = await getUserRank(user.id);
              setMyRankEntry(rankEntry);
            } catch (err) {
              console.error("Failed to load user rank:", err);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        setLoadingChapters(false);
      }
    };
    load();
  }, []);

  const progressPercent = stats.totalQuestions > 0
    ? Math.min((stats.practiced / stats.totalQuestions) * 100, 100)
    : 0;

  if (isLoading || loadingChapters) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. 统计信息面板 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="space-y-4"
      >
        {/* 题库名称卡片 - 蓝色渐变 */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white">
          <div className="flex items-center gap-4">
            {/* 毛玻璃图标容器 */}
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
              <Book className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">题库名称</h2>
              <p className="text-blue-100 text-sm">描述文字</p>
            </div>
          </div>
        </div>

        {/* 排行榜模块 */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl p-5">
          {/* 内容 */}
        </div>

        {/* 统计数字 - 四宫格 */}
        <div className="grid grid-cols-4 gap-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-2 border-slate-200 rounded-xl p-4 text-center"
          >
            <div className="flex items-center justify-center mb-2">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.totalQuestions}</p>
            <p className="text-xs text-slate-400 mt-1">总题目</p>
          </motion.div>
          {/* 其他三个统计卡片 */}
        </div>

        {/* 总进度条 */}
        <div className="bg-white border-2 border-slate-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-slate-600">总进度</span>
            <span className="text-sm font-bold text-blue-600">{Math.round(progressPercent)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* 2. 每日任务 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border-2 border-slate-200 rounded-2xl p-5"
      >
        {/* 任务列表 */}
      </motion.div>

      {/* 3. 章节列表 */}
      <div>
        <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Icon name="book" size={28} />
          章节练习
        </h2>
        <div className="grid gap-3">
          {chapters.map((chapter, index) => (
            <motion.button
              key={chapter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => router.push(`/lesson?chapter=${encodeURIComponent(chapter)}`)}
              className="flex items-center gap-4 w-full p-4 bg-white border-2 border-slate-200 
                         rounded-2xl hover:border-[#58cc02] hover:bg-[#d4edc9]/20 transition-all text-left"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-[#58cc02] to-[#4aad02] rounded-xl 
                              flex items-center justify-center text-white font-bold text-lg shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-700 truncate">{chapter}</p>
                <p className="text-sm text-slate-400">点击开始练习</p>
              </div>
              <Icon name="book" size={24} style={{ opacity: 0.5 }} />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 10.2 个人中心页面（毛玻璃重点示例）

**文件：`src/app/(main)/profile/page.tsx`**

```tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Icon, type IconName } from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { useUserProgress } from "@/store/use-user-progress";
import { signOutClient } from "@/lib/auth-client";

export default function ProfilePage() {
  const router = useRouter();
  const { hearts, xp, streak, totalCorrect } = useUserProgress();
  const [displayName, setDisplayName] = useState("用户游客");

  return (
    <div className="flex flex-col gap-6">
      {/* 用户信息卡片 - 绿色渐变 + 毛玻璃子元素 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#58cc02] to-[#4aad02] rounded-2xl p-6 text-white"
      >
        <div className="flex items-center gap-4 mb-4">
          {/* 毛玻璃头像容器 */}
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
            🐣
          </div>
          <div>
            <h2 className="font-bold text-xl">{displayName}</h2>
            <p className="text-white/70 text-sm">学无止境，继续加油！</p>
          </div>
        </div>
        
        {/* 统计网格 - 毛玻璃子卡片 */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <Icon name="star" size={28} />
            <p className="text-xl font-bold">{xp.toLocaleString()}</p>
            <p className="text-xs text-white/70">总经验</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <Icon name="flame" size={28} />
            <p className="text-xl font-bold">{streak}</p>
            <p className="text-xs text-white/70">连胜</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <Icon name="heart" size={28} />
            <p className="text-xl font-bold">{hearts}/5</p>
            <p className="text-xs text-white/70">红心</p>
          </div>
          <div className="bg-white/15 rounded-xl p-3 text-center">
            <Icon name="check-circle" size={28} />
            <p className="text-xl font-bold">{totalCorrect}</p>
            <p className="text-xs text-white/70">答对</p>
          </div>
        </div>
      </motion.div>

      {/* 每日任务 - 标准白色卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white border-2 border-slate-200 rounded-2xl p-5"
      >
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Icon name="gift" size={20} />
          今日任务
        </h3>
        {/* 任务列表 */}
      </motion.div>

      {/* 成就展示 - 标准白色卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white border-2 border-slate-200 rounded-2xl p-5"
      >
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Icon name="trophy" size={20} />
          成就
        </h3>
        {/* 成就网格 */}
      </motion.div>

      {/* 快捷入口 - 可点击卡片 */}
      <div className="grid gap-3">
        <button
          onClick={() => router.push("/learn")}
          className="flex items-center gap-4 w-full p-4 bg-white border-2 border-slate-200 
                     rounded-2xl hover:border-slate-300 transition-all text-left"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#d4edc9]">
            <Icon name="book" size={20} />
          </div>
          <span className="font-bold text-slate-700">章节练习</span>
        </button>
        {/* 更多快捷入口 */}
      </div>
    </div>
  );
}
```

### 10.3 登录页面（毛玻璃重点示例）

**文件：`src/app/auth/login/page.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#58cc02] to-[#4aad02] flex items-center justify-center p-6">
      <div className="max-w-sm mx-auto text-center">
        {/* 毛玻璃图标容器 - 重点 */}
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
          className="text-3xl font-bold text-white mb-2"
        >
          欢迎回来
        </motion.h1>
        <p className="text-white/70 mb-8">登录你的账号继续练习</p>

        {/* 登录表单 - 白色卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl p-6 space-y-4"
        >
          {/* 表单内容 */}
        </motion.div>
      </div>
    </div>
  );
}
```

---

## 11. 常见场景速查表

### 11.1 毛玻璃效果速查

| 场景 | 完整 Tailwind Class |
|------|---------------------|
| Icon 默认毛玻璃 | `inline-flex items-center justify-center select-none bg-white/20 rounded-2xl backdrop-blur-sm` |
| 渐变背景毛玻璃图标 | `w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center` |
| 用户头像毛玻璃 | `w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl` |
| 登录页图标容器 | `w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm` |
| 统计卡片(渐变背景上) | `bg-white/15 rounded-xl p-3 text-center` |

### 11.2 卡片样式速查

| 卡片类型 | 完整 Tailwind Class |
|----------|---------------------|
| 标准卡片 | `bg-white border-2 border-slate-200 rounded-2xl p-5` |
| 小卡片 | `bg-white border-2 border-slate-200 rounded-xl p-4` |
| 可点击卡片 | `flex items-center gap-4 w-full p-4 bg-white border-2 border-slate-200 rounded-2xl hover:border-[#58cc02] hover:bg-[#d4edc9]/20 transition-all text-left` |
| 渐变卡片 | `bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-5 text-white` |
| 统计网格卡片 | `bg-slate-50 rounded-2xl p-4 text-center border border-slate-200` |
| 排行榜条目 | `flex items-center gap-3 p-2.5 rounded-xl border transition-all` |

### 11.3 按钮样式速查

| 按钮类型 | 说明 |
|----------|------|
| Primary | 绿色实心按钮，Duolingo 风格 |
| Warning | 黄色实心按钮，用于考试/警告 |
| Danger | 红色实心按钮，用于删除/错误 |
| Secondary | 灰色实心按钮 |
| SecondaryOutline | 白色 + 边框，次要操作 |
| Ghost | 透明背景，仅文字 |

### 11.4 间距规范速查

| 用途 | Class | 值 |
|------|-------|----|
| 页面内边距 | `px-4 py-6` | 16px 32px |
| 卡片内边距 | `p-5` | 20px |
| 卡片内边距(小) | `p-4` | 16px |
| 卡片间距 | `gap-6` | 24px |
| 卡片内部元素间距 | `space-y-3/space-y-4` | 12px/16px |
| 图标与文字间距 | `gap-2/gap-3/gap-4` | 8px/12px/16px |

### 11.5 圆角规范速查

| 用途 | Class | 值 |
|------|-------|----|
| 大容器 | `rounded-3xl` | 24px |
| 卡片 | `rounded-2xl` | 16px |
| 小元素 | `rounded-xl` | 12px |
| 徽章/标签 | `rounded-full` | 50% |
| 进度条 | `rounded-full` | 50% |
| 图标容器 | `rounded-2xl` | 16px |

---

## 12. 注意事项

### 12.1 毛玻璃效果使用限制

| 规则 | 说明 |
|------|------|
| **仅在渐变背景上使用 backdrop-blur** | 纯白色背景上 backdrop-blur 无效果 |
| **不用于主卡片背景** | 主卡片使用 `bg-white + border-2` |
| **不用于导航栏** | 导航栏使用 `bg-white` 纯色 |
| **不用于按钮** | 按钮使用实心颜色 |
| **透明度不超过 20%** | `bg-white/20` 是最大值，保持可见性 |

### 12.2 浏览器兼容性

| 特性 | 支持情况 |
|------|---------|
| backdrop-filter | 现代浏览器均支持（Chrome 76+, Safari 9+, Firefox 103+） |
| bg-white/20 | Tailwind 语法，最终编译为 rgba |
| border-radius | 完全支持 |

### 12.3 性能优化

| 建议 | 说明 |
|------|------|
| 减少 backdrop-blur 使用数量 | 过多毛玻璃元素可能影响滚动性能 |
| 使用 transform: translateZ(0) | 在 Icon 组件中使用，启用 GPU 加速 |
| 避免大面积毛玻璃 | 仅用于小元素（图标容器） |

### 12.4 设计一致性检查清单

在实现新页面或组件时，检查以下项：

- [ ] 图标是否使用 Icon 组件（glass 模式默认毛玻璃）
- [ ] 卡片是否使用 `bg-white + border-2 border-slate-200 + rounded-2xl`
- [ ] 渐变卡片上的子元素是否使用 `bg-white/20` 或 `bg-white/15`
- [ ] 导航栏是否为纯白色背景（不使用毛玻璃）
- [ ] 按钮是否使用 Duolingo juicy 风格（底部边框）
- [ ] 动画是否使用 Framer Motion 的淡入+上滑效果
- [ ] 颜色是否使用项目定义的品牌色和功能色
- [ ] 圆角是否遵循规范（卡片 2xl、小元素 xl）
- [ ] 间距是否使用 Tailwind 的间距系统
- [ ] 文字层级是否清晰（标题 bold、正文 medium、辅助 regular）

### 12.5 小程序端注意事项

| 限制 | 说明 | 替代方案 |
|------|------|---------|
| 不支持 backdrop-filter | 微信小程序 WXSS 不支持 | 使用 `opacity` + 半透明背景模拟 |
| 不支持 `*` 通配符 | WXSS 限制 | 使用具体选择器 |
| 不支持 ::before/::after | WXSS 限制 | 使用额外元素 |
| Framer Motion 不可用 | 仅 Web 库 | 使用 CSS 动画或 Taro API |
| 不支持 CSS var() 部分 | 部分支持 | 使用硬编码值 |

---

## 附录：文件索引

| 文件 | 路径 | 说明 |
|------|------|------|
| 全局样式 | `src/app/globals.css` | Tailwind 配置、动画、变量 |
| Icon 组件 | `src/components/Icon.tsx` | 毛玻璃图标系统核心 |
| 工具函数 | `src/lib/utils.ts` | cn() class merge 函数 |
| 主布局 | `src/app/(main)/layout.tsx` | 页面框架 |
| 顶部导航 | `src/components/top-navbar.tsx` | 固定顶栏 |
| 底部导航 | `src/components/bottom-nav.tsx` | 固定底栏 |
| 学习页面 | `src/app/(main)/learn/page.tsx` | 完整页面示例 |
| 个人中心 | `src/app/(main)/profile/page.tsx` | 毛玻璃重点示例 |
| 登录页面 | `src/app/auth/login/page.tsx` | 认证页毛玻璃示例 |
| 模拟考试 | `src/app/(main)/exam/page.tsx` | 考试页面示例 |
| 按钮组件 | `src/components/ui/button.tsx` | Duolingo 风格按钮 |
| 类型定义 | `src/lib/types.ts` | TypeScript 类型 |
| 常量定义 | `src/lib/constants.ts` | 游戏配置常量 |

---

## 总结

### 毛玻璃效果核心公式（记住这个！）

```
bg-white/20 + rounded-2xl + backdrop-blur-sm
```

### 使用场景（只在这三个地方用毛玻璃）

1. **Icon 组件容器**（默认 glass 模式）
2. **渐变背景上的装饰元素**（头像框、功能图标容器）
3. **认证页面的装饰图标区域**

### 不使用毛玻璃的地方

1. 卡片主体（用白色 + 边框）
2. 导航栏（用纯白色）
3. 按钮（用实心颜色 + 底部边框）
4. 表单输入（用白色 + 边框）

### 设计关键词

- 简洁
- 游戏化
- Duolingo 风格
- 毛玻璃仅用于点缀
- 边框分隔
- 鲜艳品牌色
- 圆角友好
