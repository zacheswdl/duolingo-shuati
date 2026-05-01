# 任务清单 ✅ 全部完成

## 1. 数据库更新 ✅
- [x] 新增 user_achievements 表（成就系统）
- [x] 新增 user_daily_tasks 表（每日任务）
- [x] 新增 user_progress 增加 total_correct 字段（用于统计章节答对题数）
- [x] 更新 RLS 策略
- [x] 创建排行榜函数 get_leaderboard
- [x] 创建增加经验值函数 add_xp

## 2. 常量配置更新 ✅
- [x] 更新 EXAM_QUESTION_COUNT = 50
- [x] 更新 EXAM_TIME_MINUTES = 60
- [x] 更新 PASS_SCORE = 90
- [x] 新增成就相关常量（100个成就定义）
- [x] 新增每日任务相关常量（4个任务定义）

## 3. 成就系统 ✅
- [x] 定义100个成就名称（从"初出茅庐"到"满级大佬"）
- [x] 创建成就检查逻辑（checkAndUnlockAchievements）
- [x] 创建成就弹窗组件（AchievementModal）
- [x] 在个人页展示成就墙

## 4. 排行榜功能 ✅
- [x] 创建排行榜页面（/leaderboard）
- [x] 添加排行榜入口（bottom-nav + profile）

## 5. 模拟考试调整 ✅
- [x] 改为50题100分，每题2分
- [x] 及格线改为90分
- [x] 及格后获得200经验值和连续打卡奖励

## 6. 每日特别任务 ✅
- [x] 任务1：开启连胜（考试≥90分）
- [x] 任务2：完成1个章节练习
- [x] 任务3：任一个章节答对100道题
- [x] 任务4：任意刷题20道（50经验值奖励）
- [x] 任务完成弹框（DailyTaskModal）
- [x] 任务奖励100经验值

## 7. 迁移脚本 ✅
- [x] 创建 supabase-migration.sql（含补充缺失列、建表、函数、RLS策略）
