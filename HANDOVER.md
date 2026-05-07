# 刷题练习（Duolingo Style）— 项目交接文档

> 生成日期：2026-05-07
> 用途：将项目从当前 AI 辅助开发环境迁移至 Cursor 继续开发

---

## 目录

1. [项目概览](#1-项目概览)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [已实现功能](#4-已实现功能)
5. [开发中功能](#5-开发中功能)
6. [待开发功能](#6-待开发功能)
7. [数据库设计](#7-数据库设计)
8. [认证系统](#8-认证系统)
9. [网页端与小程序端代码对照](#9-网页端与小程序端代码对照)
10. [开发流程与命令](#10-开发流程与命令)
11. [已知问题与修复记录](#11-已知问题与修复记录)
12. [环境变量清单](#12-环境变量清单)
13. [外部依赖清单](#13-外部依赖清单)
14. [开发规范与约定](#14-开发规范与约定)
15. [下一步开发建议](#15-下一步开发建议)

---

## 1. 项目概览

### 1.1 项目目标

面向需要备考**浙江省能力验证考试**的用户，提供游戏化刷题体验。通过仿 Duolingo 风格的 UI 和游戏机制（经验值 XP、红心 Hearts、连胜 Streak、成就系统、每日任务），降低刷题枯燥感，提高学习积极性。

### 1.2 双端架构

| 端 | 框架 | 状态 |
|----|------|------|
| **网页端** | Next.js 16 + App Router | 已上线部署（腾讯云 EdgeOne Pages） |
| **微信小程序端** | Taro 4.2 + React 18 | 开发中，已同步网页端首页 UI |

两端共享同一套 Supabase 数据库和认证体系。

### 1.3 项目仓库

- 项目根目录：`/Users/zacheswdl/duolingo-shuati`
- 网页端源码：`/src/`
- 小程序端源码：`/miniapp/`

---

## 2. 技术栈

### 2.1 网页端

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js (App Router) | 16 (v16) |
| UI 库 | React | 19 |
| 样式 | Tailwind CSS | 4 |
| 动画 | Framer Motion | 最新 |
| 状态管理 | Zustand | 5.0 |
| 数据库 & 认证 | Supabase (PostgreSQL + Auth) | 2.x |
| UI 组件 | Radix UI (Dialog, Progress) | 最新 |
| 图标 | 自定义 PNG 图标 + Lucide React | 最新 |
| 通知 | Sonner | 最新 |
| 语言 | TypeScript | 5 |

### 2.2 微信小程序端

| 类别 | 技术 | 版本 |
|------|------|------|
| 跨端框架 | Taro | 4.2.0 |
| UI 库 | React | 18.3 |
| 样式 | SCSS | 1.77 |
| 状态管理 | Zustand | 5.0 |
| 数据库 & 认证 | Supabase (共享) | 2.x |
| 语言 | TypeScript | 5.4 |

### 2.3 后端服务

| 类别 | 技术 |
|------|------|
| 数据库 | PostgreSQL (Supabase 托管) |
| 认证 | Supabase Auth (邮箱 + 微信 OAuth) |
| Serverless | Supabase Edge Functions (Deno) |
| 行级安全 | RLS (Row Level Security) |

---

## 3. 项目结构

```
duolingo-shuati/
├── .env.example              # 环境变量模板
├── .gitignore
├── AGENTS.md                 # AI Agent 规则
├── HANDOVER.md               # 本交接文档
├── next.config.ts            # Next.js 配置
├── package.json              # 网页端依赖
├── postcss.config.mjs
├── tsconfig.json
│
├── src/                      # ============ 网页端源码 ============
│   ├── app/
│   │   ├── (main)/           # 主布局（带顶部导航 + 底部导航）
│   │   │   ├── exam/         # 模拟考试页面
│   │   │   │   ├── result/   # 考试结果页
│   │   │   │   └── page.tsx
│   │   │   ├── favorites/    # 收藏夹
│   │   │   ├── leaderboard/  # 排行榜
│   │   │   ├── learn/        # 学习首页
│   │   │   ├── mistakes/     # 错题本
│   │   │   ├── profile/      # 个人中心
│   │   │   ├── layout.tsx    # 主布局组件
│   │   │   ├── error.tsx     # 错误边界
│   │   │   └── loading.tsx   # 加载占位
│   │   ├── admin/            # 管理后台（题库管理）
│   │   ├── api/              # API Routes
│   │   │   ├── auth/         # 认证 API
│   │   │   │   ├── generate-otp/  # 发送验证码
│   │   │   │   ├── verify-otp/    # 验证验证码
│   │   │   │   └── wechat/        # 网页端微信登录
│   │   │   └── exam-questions/    # 考试题目 API
│   │   ├── auth/             # 认证页面
│   │   │   ├── login/        # 登录
│   │   │   ├── register/     # 注册
│   │   │   ├── forgot-password/  # 忘记密码
│   │   │   ├── reset-password/   # 重置密码
│   │   │   ├── callback/     # OAuth 回调
│   │   │   └── wechat/callback/  # 微信登录回调
│   │   ├── lesson/           # 答题页面
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── quiz.tsx      # 答题核心组件
│   │   ├── globals.css
│   │   ├── layout.tsx        # 根布局
│   │   └── page.tsx          # 根页面（重定向到 /learn）
│   │
│   ├── components/
│   │   ├── modals/           # 弹窗组件
│   │   │   ├── achievement-modal.tsx   # 成就解锁弹窗
│   │   │   ├── checkin-modal.tsx       # 打卡弹窗
│   │   │   ├── daily-task-modal.tsx    # 每日任务弹窗
│   │   │   ├── exit-modal.tsx          # 退出确认弹窗
│   │   │   ├── hearts-modal.tsx        # 红心耗尽弹窗
│   │   │   └── practice-modal.tsx      # 练习弹窗
│   │   ├── ui/               # UI 基础组件
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── progress.tsx
│   │   ├── Icon.tsx          # 图标组件（自定义 PNG + Lucide）
│   │   ├── auth-guard.tsx    # 认证守卫
│   │   ├── bottom-nav.tsx    # 底部导航栏
│   │   ├── progress-hydrator.tsx  # 进度数据水合组件
│   │   └── top-navbar.tsx    # 顶部导航栏
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── actions.ts        # 服务端数据库操作
│   │   │   ├── client-actions.ts # 客户端数据库操作
│   │   │   ├── client.ts         # Supabase 客户端
│   │   │   └── server.ts         # Supabase 服务端客户端
│   │   ├── auth-actions.ts       # 认证操作（服务端）
│   │   ├── auth-client.ts        # 认证操作（客户端）
│   │   ├── constants.ts          # 游戏配置常量
│   │   ├── types.ts              # TypeScript 类型定义
│   │   └── utils.ts              # 工具函数
│   │
│   ├── store/                    # Zustand 状态管理
│   │   ├── use-checkin.ts        # 打卡状态
│   │   ├── use-exit-modal.ts     # 退出弹窗状态
│   │   ├── use-hearts-modal.ts   # 红心弹窗状态
│   │   ├── use-practice-modal.ts # 练习弹窗状态
│   │   └── use-user-progress.ts  # 用户进度状态
│   │
│   └── middleware.ts             # Next.js 中间件（认证路由保护）
│
├── public/                       # 静态资源
│   ├── icons/                    # 自定义 PNG 图标
│   └── *.svg                     # 网页图标
│
├── screenshots/                  # 项目截图
│
├── scripts/                      # 工具脚本
│   ├── fix-all-answers.sql       # 题库答案修复
│   ├── fix-judge-answers.sql     # 判断题答案修复
│   └── screenshot.mjs            # 截图脚本
│
├── supabase/
│   ├── functions/
│   │   └── wechat-auth/          # 微信登录 Edge Function
│   │       ├── index.ts          # Function 代码
│   │       └── migration.sql     # wechat_users 表迁移
│   ├── otp_setup.sql             # OTP 配置
│   └── rls_policies.sql          # RLS 策略（旧版）
│
├── supabase-schema.sql           # 数据库 Schema（完整）
├── supabase-seed.sql             # 题库种子数据（约 600 题）
├── supabase-migration.sql        # 数据库迁移脚本
│
│
└── miniapp/                      # ============ 微信小程序端源码 ============
    ├── config/                   # Taro 配置
    │   ├── index.ts              # 公共配置
    │   ├── dev.ts                # 开发配置
    │   └── prod.ts               # 生产配置
    ├── scripts/
    │   └── prepare-icons.sh      # 图标准备脚本
    ├── src/
    │   ├── assets/
    │   │   ├── icons/            # 功能图标 PNG
    │   │   └── tab-icons/        # Tab 栏图标 PNG
    │   ├── components/
    │   │   └── modals/           # 弹窗组件（已创建但未完全集成）
    │   │       ├── AchievementModal.tsx/.scss
    │   │       ├── CheckinModal.tsx/.scss
    │   │       ├── DailyTaskModal.tsx/.scss
    │   │       ├── ExitModal.tsx/.scss
    │   │       ├── HeartsModal.tsx/.scss
    │   │       ├── Modal.tsx/.scss
    │   │       └── PracticeModal.tsx/.scss
    │   ├── lib/
    │   │   ├── actions.ts        # 数据库操作（与网页端 actions 对应）
    │   │   ├── auth.ts           # 微信登录认证
    │   │   ├── config.ts         # Supabase 配置
    │   │   ├── constants.ts      # 游戏配置常量
    │   │   ├── supabase.ts       # Supabase 客户端
    │   │   └── types.ts          # TypeScript 类型
    │   ├── pages/
    │   │   ├── index/            # 首页（学习页）— 已更新与网页端一致
    │   │   ├── exam/             # 模拟考试页
    │   │   │   └── result/       # 考试结果页
    │   │   ├── mistakes/         # 错题本页
    │   │   ├── profile/          # 个人中心页
    │   │   ├── login/            # 登录页
    │   │   ├── lesson/           # 答题页
    │   │   ├── favorites/        # 收藏夹页
    │   │   └── leaderboard/      # 排行榜页
    │   ├── store/
    │   │   ├── auth.ts           # 认证状态
    │   │   ├── modals.ts         # 弹窗状态
    │   │   └── user-progress.ts  # 用户进度状态
    │   ├── styles/
    │   │   ├── global.scss       # 全局样式
    │   │   └── variables.scss    # SCSS 变量
    │   ├── app.config.ts         # 小程序配置（路由、TabBar）
    │   ├── app.scss              # 小程序根样式
    │   └── app.tsx               # 小程序入口
    ├── .eslintrc.js
    ├── .gitignore
    ├── SETUP_GUIDE.md            # 小程序配置指南
    ├── babel.config.js           # Babel 配置
    ├── package.json              # 小程序依赖
    ├── project.config.json       # 微信开发者工具配置
    └── tsconfig.json
```

---

## 4. 已实现功能

### 4.1 网页端（已完成，已上线）

| 模块 | 状态 | 说明 |
|------|------|------|
| **M1 用户认证** | ✅ | 邮箱密码注册/登录、忘记密码/重置密码、OAuth 回调、微信登录（网页端） |
| **M2 学习模块（首页）** | ✅ | 题库名称卡片、排行榜预览、统计面板（总题目/已练习/错题/收藏）、总进度条、章节列表、每日任务 |
| **M3 答题模块** | ✅ | 三种题型支持、即时反馈、红心机制（5 颗）、XP 获得、收藏、退出确认弹窗、XP 飘出动画、上一题/下一题 |
| **M4 模拟考试模块** | ✅ | 50 题随机、限时 60 分钟、90 分及格、及格奖励 200 XP + 连胜 +1、考试结果页 |
| **M5 错题本模块** | ✅ | 自动收集错题、错题回血挑战（每答对 1 题恢复 1 红心）、回血结果页 |
| **M6 收藏夹模块** | ✅ | 收藏/取消收藏、收藏列表、批量练习收藏题目 |
| **M7 排行榜模块** | ✅ | 按 XP 降序、前 50 名、前三名金银铜样式、我的排名卡片 |
| **M8 成就系统** | ✅ | 100 个等级成就、解锁弹窗、个人页成就墙 |
| **M9 每日任务系统** | ✅ | 4 个任务、完成可领取 XP 奖励、进度实时追踪、完成任务弹窗 |
| **M10 个人中心模块** | ✅ | 用户信息、每日任务、成就墙、快捷入口、学习统计、退出登录 |

### 4.2 微信小程序端（开发中）

| 模块 | 状态 | 说明 |
|------|------|------|
| **微信登录** | ✅ | 通过 Supabase Edge Function 实现微信一键登录 |
| **学习首页** | ✅ | 已更新为与网页端一致的 UI（题库名称卡片、排行榜、统计数字、进度条、每日任务、章节列表） |
| **模拟考试页** | ✅ | 基础考试功能已完成 |
| **答题页** | ✅ | 答题逻辑已完成 |
| **考试结果页** | ✅ | 结果展示 |
| **错题本页** | ✅ | 错题列表和回血功能 |
| **收藏夹页** | ✅ | 收藏列表 |
| **排行榜页** | ✅ | 排行榜展示 |
| **个人中心页** | ✅ | 用户信息、成就、任务 |
| **底部 TabBar** | ✅ | 学习、考试、错题、我的 四个 Tab |
| **弹窗组件** | 🟡 | 已创建组件文件，但未完全集成到各页面 |

---

## 5. 开发中功能

### 5.1 小程序端

| 功能 | 当前进度 | 下一步 |
|------|---------|--------|
| 首页 UI 与网页端同步 | ✅ 已完成 | — |
| 弹窗组件集成 | 🟡 组件已创建 | 将 AchievementModal、CheckinModal 等集成到对应页面 |
| 微信登录流程完善 | 🟡 基本完成 | 需要确保 Edge Function 已部署且环境变量正确配置 |
| 页面间数据同步 | 🟡 部分完成 | 确认 Zustand store 在各页面间正确传递数据 |
| 图标资源 | ✅ 已准备 | 功能图标和 Tab 图标已放置在 `assets/icons/` 和 `assets/tab-icons/` |

### 5.2 最近修改记录

| 日期 | 修改内容 | 文件 |
|------|---------|------|
| 2026-05-07 | 小程序首页 index.tsx 更新为与网页端一致的 UI | `miniapp/src/pages/index/index.tsx` |
| 2026-05-07 | 小程序首页样式文件更新 | `miniapp/src/pages/index/index.scss` |
| 2026-05-07 | 修复 WXSS 编译错误（`*` 通配符不兼容） | `miniapp/src/styles/global.scss` |
| 2026-05-07 | 修复 React is not defined 错误 | `miniapp/babel.config.js`（添加 `runtime: 'automatic'`） |

---

## 6. 待开发功能

### 6.1 小程序端待完成

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P0 | 小程序端答题页与网页端体验对齐 | 网页端答题页有 Framer Motion 动画、上一题/下一题等，小程序端需简化实现 |
| P1 | 弹窗组件集成 | AchievementModal、CheckinModal、HeartsModal 等需集成到对应页面 |
| P2 | 微信小程序分享功能 | 支持分享题目/成绩到微信好友 |
| P3 | 订阅消息通知 | 每日任务提醒、连胜中断提醒 |
| P4 | 小程序端性能优化 | 页面预加载、图片懒加载 |

### 6.2 通用功能扩展

| 优先级 | 功能 | 说明 |
|--------|------|------|
| P2 | 多题库支持 | 目前只有一套浙江省能力验证题库 |
| P2 | 搜索功能 | 题库内搜索题目 |
| P3 | 离线模式 | 小程序端支持离线答题 |

---

## 7. 数据库设计

### 7.1 表结构

| 表名 | 说明 | 关键字段 |
|------|------|---------|
| `questions` | 题库表 | id, chapter, type, content, options(JSONB), correct_answer, explanation |
| `user_progress` | 用户进度 | user_id, hearts, xp, streak, max_exam_score, total_correct, chapter_correct(JSONB) |
| `user_actions` | 答题记录 | user_id, question_id, is_correct, is_mistake, is_favorite |
| `user_achievements` | 成就解锁 | user_id, achievement_key, unlocked_at |
| `user_daily_tasks` | 每日任务 | user_id, task_date, task_type, progress, target, completed, claimed |
| `wechat_users` | 微信用户映射 | openid, user_id |

### 7.2 数据库函数

| 函数名 | 说明 | 文件位置 |
|--------|------|---------|
| `get_leaderboard(p_limit)` | 获取排行榜（按 XP 降序） | `supabase-schema.sql` |
| `add_xp(p_user_id, p_amount)` | 安全地增加用户经验值 | `supabase-schema.sql` |

### 7.3 索引

```sql
idx_questions_chapter           -- questions(chapter)
idx_user_actions_user_id        -- user_actions(user_id)
idx_user_actions_mistake        -- user_actions(user_id, is_mistake) WHERE is_mistake = true
idx_user_actions_favorite       -- user_actions(user_id, is_favorite) WHERE is_favorite = true
idx_user_achievements_user_id   -- user_achievements(user_id)
idx_user_daily_tasks_user_date  -- user_daily_tasks(user_id, task_date)
```

### 7.4 行级安全策略 (RLS)

- `questions`: 所有人可读
- `user_progress`: 用户只能读写自己的数据
- `user_actions`: 用户只能读写自己的数据
- `user_achievements`: 用户只能读写自己的数据
- `user_daily_tasks`: 用户只能读写自己的数据
- `wechat_users`: Service role 全权限，用户可查看自己的记录

---

## 8. 认证系统

### 8.1 网页端认证流程

```
用户 → 网页端 (Next.js) → Supabase Auth
                           ↓
              邮箱/密码登录
              微信 OAuth 登录
                           ↓
              中间件 (middleware.ts) 保护路由
                           ↓
              客户端通过 createServerSupabaseClient / createClient 访问数据
```

- 中间件位置：`src/middleware.ts`
- 受保护路由：`/`, `/learn`, `/exam`, `/mistakes`, `/profile`, `/lesson`, `/admin`, `/leaderboard`, `/favorites`
- 认证路由：`/auth/login`, `/auth/register`, `/auth/reset-password`, `/auth/callback`

### 8.2 小程序端认证流程

```
小程序端 → Taro.login() → 微信 code → Supabase Edge Function (wechat-auth)
                                           ↓
                                  验证 code 获取 openid
                                           ↓
                                  创建/查找 Supabase 用户
                                           ↓
                                  返回 access_token + refresh_token
                                           ↓
                                  小程序端存入 Storage + Supabase 客户端
```

- Edge Function 代码：`supabase/functions/wechat-auth/index.ts`
- 小程序端认证逻辑：`miniapp/src/lib/auth.ts`
- 小程序 AppID：`wxd1e29c348a10b518`

### 8.3 网页端微信登录

- API Route：`src/app/api/auth/wechat/route.ts`
- 使用微信开放平台网页扫码登录（`snsapi_login`）

---

## 9. 网页端与小程序端代码对照

### 9.1 共享配置

| 配置项 | 网页端 | 小程序端 | 说明 |
|--------|--------|---------|------|
| 游戏常量 | `src/lib/constants.ts` | `miniapp/src/lib/constants.ts` | 完全一致（HEARTS_MAX=5, XP_PER_CORRECT=10 等） |
| 类型定义 | `src/lib/types.ts` | `miniapp/src/lib/types.ts` | 完全一致 |
| 成就定义 | `src/lib/constants.ts` (ACHIEVEMENTS) | `miniapp/src/lib/constants.ts` (ACHIEVEMENTS) | 100 个成就完全一致 |
| 每日任务定义 | `src/lib/constants.ts` (DAILY_TASKS) | `miniapp/src/lib/constants.ts` (DAILY_TASKS) | 4 个任务完全一致 |

### 9.2 数据库操作对照

| 功能 | 网页端 | 小程序端 |
|------|--------|---------|
| 数据访问方式 | Supabase 客户端（`createClient` / `createServerSupabaseClient`） | Supabase 客户端（`getSupabaseClient`） |
| 用户登录 | 通过 Supabase Auth | 通过微信 OAuth + Edge Function |
| 数据操作封装 | `src/lib/supabase/client-actions.ts` + `src/lib/supabase/actions.ts` | `miniapp/src/lib/actions.ts` |

### 9.3 页面路由对照

| 页面 | 网页端路由 | 小程序端路由 |
|------|-----------|-------------|
| 学习首页 | `/learn` | `pages/index/index` |
| 模拟考试 | `/exam` | `pages/exam/index` |
| 考试结果 | `/exam/result` | `pages/exam/result/index` |
| 错题本 | `/mistakes` | `pages/mistakes/index` |
| 收藏夹 | `/favorites` | `pages/favorites/index` |
| 排行榜 | `/leaderboard` | `pages/leaderboard/index` |
| 个人中心 | `/profile` | `pages/profile/index` |
| 答题页 | `/lesson` | `pages/lesson/index` |
| 登录 | `/auth/login` | `pages/login/index` |

### 9.4 弹窗组件对照

| 弹窗 | 网页端 | 小程序端 | 状态 |
|------|--------|---------|------|
| 成就解锁 | `src/components/modals/achievement-modal.tsx` | `miniapp/src/components/modals/AchievementModal.tsx` | 网页端已集成，小程序端待集成 |
| 打卡 | `src/components/modals/checkin-modal.tsx` | `miniapp/src/components/modals/CheckinModal.tsx` | 同上 |
| 每日任务 | `src/components/modals/daily-task-modal.tsx` | `miniapp/src/components/modals/DailyTaskModal.tsx` | 同上 |
| 退出确认 | `src/components/modals/exit-modal.tsx` | `miniapp/src/components/modals/ExitModal.tsx` | 同上 |
| 红心耗尽 | `src/components/modals/hearts-modal.tsx` | `miniapp/src/components/modals/HeartsModal.tsx` | 同上 |
| 练习 | `src/components/modals/practice-modal.tsx` | `miniapp/src/components/modals/PracticeModal.tsx` | 同上 |

---

## 10. 开发流程与命令

### 10.1 网页端

```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 构建
npm run build

# 生产运行
npm run start

# 代码检查
npm run lint
```

### 10.2 小程序端

```bash
# 进入小程序目录
cd miniapp

# 安装依赖
npm install

# 开发构建（监听模式）
npm run dev:weapp

# 生产构建
npm run build:weapp

# 代码检查
npm run lint

# 类型检查
npm run typecheck
```

### 10.3 小程序端微信开发者工具操作

1. 打开微信开发者工具
2. 导入项目目录：`/Users/zacheswdl/duolingo-shuati/miniapp`
3. AppID：`wxd1e29c348a10b518`
4. 在终端先运行 `npm run dev:weapp`，然后开发者工具中点击「编译」
5. 点击「预览」可生成小程序码进行真机测试

---

## 11. 已知问题与修复记录

### 11.1 已修复

| 日期 | 问题 | 原因 | 修复方案 | 涉及文件 |
|------|------|------|---------|---------|
| 2026-05-07 | WXSS 编译错误：`unexpected token *` | 小程序 WXSS 不支持 `*` 通配符选择器和 `::before/::after` 伪元素 | 将 `*` 替换为 `view, text, image` | `miniapp/src/styles/global.scss` |
| 2026-05-07 | `React is not defined` | Babel preset-react 未启用自动运行时 | 添加 `runtime: 'automatic'` 配置 | `miniapp/babel.config.js` |
| 2026-05-07 | 小程序首页 UI 与网页端不一致 | 小程序端使用旧版 UI | 重写 `index.tsx` 和 `index.scss`，同步网页端新 UI | `miniapp/src/pages/index/index.tsx`, `miniapp/src/pages/index/index.scss` |

### 11.2 需要注意的事项

| 事项 | 说明 |
|------|------|
| **小程序 WXSS 限制** | 不支持 `*` 通配符、`::before/::after` 伪元素、`@media` 有限支持、不支持 CSS `var()`（部分） |
| **小程序 Image 路径** | 小程序端 Image 组件的 `src` 路径需要特别注意，相对路径从页面文件出发 |
| **小程序组件标签** | 使用 `<View>`, `<Text>`, `<Image>`, `<ScrollView>` 等 Taro 组件，而非 HTML 标签 |
| **网页端动画** | 网页端使用 Framer Motion，小程序端不可用，需使用 Taro 自带动画或 CSS 动画替代 |
| **Supabase 连接** | 两端共用同一个 Supabase 项目，数据库操作完全一致 |

---

## 12. 环境变量清单

### 12.1 网页端（`.env.local`）

| 变量名 | 说明 | 来源 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SITE_URL` | 站点访问域名（用于 Supabase Auth 回调） | 实际部署域名 |
| `WECHAT_APPID` | 微信开放平台 AppID（网页端登录） | 微信开放平台 |
| `WECHAT_SECRET` | 微信开放平台 Secret | 微信开放平台 |
| `WECHAT_REDIRECT_URI` | 微信登录回调地址 | 实际部署域名 |

### 12.2 小程序端（`miniapp/.env`）

| 变量名 | 说明 | 来源 |
|--------|------|------|
| `TARO_APP_SUPABASE_URL` | Supabase 项目 URL | 同网页端 |
| `TARO_APP_SUPABASE_ANON_KEY` | Supabase 匿名密钥 | 同网页端 |

### 12.3 Supabase Edge Function 环境变量

| 变量名 | 说明 | 来源 |
|--------|------|------|
| `WECHAT_APPID` | 微信小程序 AppID | 微信公众平台 |
| `WECHAT_SECRET` | 微信小程序 Secret | 微信公众平台 |
| `PROJECT_URL` | Supabase 项目 URL | Supabase Dashboard |
| `SERVICE_ROLE_KEY` | Supabase 服务角色密钥 | Supabase Dashboard → Settings → API |

---

## 13. 外部依赖清单

### 13.1 必须的外部服务

| 服务 | 用途 | 备注 |
|------|------|------|
| **Supabase** | 数据库 + 认证 + Edge Functions | 项目核心依赖 |
| **微信公众平台** | 小程序登录 | AppID: `wxd1e29c348a10b518` |
| **微信开放平台** | 网页端微信登录 | 需配置回调域名 |
| **腾讯云 EdgeOne Pages** | 网页端部署 | 已配置 |

### 13.2 微信公众平台需配置的域名

| 域名类型 | 域名 |
|----------|------|
| request 合法域名 | `https://<project-id>.supabase.co` |
| request 合法域名 | `https://<project-id>.functions.supabase.co` |
| socket 合法域名 | `wss://<project-id>.supabase.co` |

---

## 14. 开发规范与约定

### 14.1 命名规范

- **文件名**：小写 + 连字符（kebab-case），如 `auth-actions.ts`
- **组件名**：PascalCase，如 `AchievementModal`
- **函数名**：camelCase，如 `getUserStats`
- **常量名**：UPPER_SNAKE_CASE，如 `HEARTS_MAX`
- **CSS 类名**：BEM 风格或 kebab-case，如 `.leaderboard-item`

### 14.2 代码约定

- 网页端使用 **无注释** 风格（AGENTS.md 规定：NEVER ADD ***ANY*** COMMENTS unless asked）
- 所有类型定义统一放在 `types.ts` 中
- 数据库操作统一通过 `actions.ts` / `client-actions.ts` 封装
- 状态管理使用 Zustand，每个 store 一个文件
- 网页端使用 Tailwind CSS（utility-first），小程序端使用 SCSS

### 14.3 Git 流程

- 每次完成代码修改后自动执行 `git add -A` → `git commit -m "<描述>"` → `git push origin main`
- 分支策略：`main` 为生产分支

### 14.4 网页端规则（AGENTS.md）

- 使用 Next.js App Router
- 样式使用 Tailwind CSS 4
- 使用 `@/` 路径别名指向 `src/` 目录
- 组件文件使用 `.tsx` 扩展名
- 服务端组件默认，客户端组件需要 `"use client"` 指令

### 14.5 小程序端规则

- 使用 Taro 4.2 框架
- 页面组件放在 `src/pages/` 下，每个页面一个文件夹
- 使用 `.config.ts` 文件定义页面配置
- 样式使用 SCSS
- 使用 Taro 内置组件（View, Text, Image, ScrollView 等）

---

## 15. 下一步开发建议

### 15.1 立即处理（P0）

1. **验证小程序端首页** — 在微信开发者工具中刷新预览，确认新 UI 正常显示
2. **小程序端弹窗组件集成** — 将 `miniapp/src/components/modals/` 下的弹窗组件集成到对应页面
3. **小程序端答题页体验优化** — 对齐网页端答题页的用户体验（即时反馈、动画效果等）

### 15.2 短期改进（P1）

1. **微信小程序端部署** — 上传代码到微信公众平台，提交审核
2. **小程序端性能优化** — 优化首屏加载速度，减少不必要的请求
3. **小程序端错误处理** — 完善网络请求失败、认证失效等异常情况的处理

### 15.3 中长期规划（P2+）

1. **多题库支持** — 支持导入和管理多套题库
2. **搜索功能** — 题库内全文搜索
3. **数据统计面板** — 更详细的学习数据分析
4. **社交功能** — 好友系统、学习小组等

---

## 附录 A：关键配置速查

### A.1 小程序微信登录完整流程

```
1. 小程序端：Taro.login() → 获取 code
2. 小程序端：Taro.request() → 调用 Supabase Edge Function (wechat-auth)
3. Edge Function：通过 code 调用微信 API 获取 openid
4. Edge Function：在 Supabase 中创建/查找用户，生成 access_token
5. Edge Function：返回 access_token + refresh_token
6. 小程序端：Taro.setStorageSync() 保存 token，调用 supabase.auth.setSession()
7. 小程序端：登录成功，进入首页
```

### A.2 网页端部署（EdgeOne Pages）

1. 推送代码到 GitHub：`git push origin main`
2. EdgeOne Pages 自动检测并构建
3. 构建命令：`npm run build`
4. 输出目录：`.next`
5. 环境变量需在 EdgeOne 控制台配置

### A.3 小程序端域名配置（必须完成）

在微信公众平台 → 开发管理 → 开发设置 → 服务器域名中添加：

- `https://<你的supabase项目id>.supabase.co`
- `https://<你的supabase项目id>.functions.supabase.co`
- `wss://<你的supabase项目id>.supabase.co`

---

## 附录 B：题库导入指南

题库通过 SQL 文件导入 Supabase：

1. `supabase-seed.sql` — 包含约 600 道浙江省能力验证考试题
2. 使用 Supabase Dashboard → SQL Editor 执行
3. 或使用 Supabase CLI：`supabase db push`

题库格式示例：
```sql
INSERT INTO questions (chapter, type, content, options, correct_answer, explanation)
VALUES (
  'chapter_single',
  'single',
  '题目内容...',
  '{"A": "选项A", "B": "选项B", "C": "选项C", "D": "选项D"}'::jsonb,
  'A',
  '解析内容...'
);
```

---

## 附录 C：开发环境准备清单

### Cursor 开发环境准备

1. **安装依赖**
   ```bash
   # 网页端
   npm install
   
   # 小程序端
   cd miniapp && npm install
   ```

2. **配置环境变量**
   - 复制 `.env.example` 到 `.env.local`
   - 填写 Supabase 配置和微信配置
   - 复制 `miniapp/.env.example` 到 `miniapp/.env`（如存在）

3. **验证数据库连接**
   - 确认 Supabase 项目可访问
   - 执行 `supabase link`（如使用 CLI）

4. **网页端启动验证**
   ```bash
   npm run dev
   # 访问 http://localhost:3000
   ```

5. **小程序端启动验证**
   ```bash
   cd miniapp && npm run dev:weapp
   # 打开微信开发者工具，导入 miniapp 目录
   ```

6. **小程序端域名白名单**
   - 在微信公众平台添加 Supabase 域名到服务器域名列表
