-- 判断题答案修正SQL
-- 请在Supabase Dashboard -> SQL Editor中执行此脚本

-- 第466题：检验过程中车辆排放出现目视可见黑烟或蓝烟，判定外观检验不合格 -> 答案应为B(错误)
UPDATE public.questions 
SET correct_answer = 'B' 
WHERE content LIKE '%检验过程中车辆排放出现目视可见黑烟或蓝烟%' 
  AND correct_answer = 'A'
  AND type = 'judge';

-- 第468题：不透光烟度计每天检测前应进行零点和满量程检查 -> 答案应为A(正确)
UPDATE public.questions 
SET correct_answer = 'A' 
WHERE content LIKE '%不透光烟度计每天检测前应进行零点和满量程检查%' 
  AND correct_answer = 'B'
  AND type = 'judge';

-- 第469题：加载减速检测过程一般应在2min内完成，最长不能超过5min -> 答案应为A(正确)
UPDATE public.questions 
SET correct_answer = 'A' 
WHERE content LIKE '%加载减速检测过程一般应在2min内完成%' 
  AND correct_answer = 'B'
  AND type = 'judge';

-- 第478题：自由加速测量时必须保持油门2秒以上 -> 答案应为B(错误)
UPDATE public.questions 
SET correct_answer = 'B' 
WHERE content LIKE '%自由加速测量时，必须在1秒的时间内%' 
  AND correct_answer = 'A'
  AND type = 'judge';

-- 第479题：测功机需轴流风机强制散热 -> 答案应为B(错误)
UPDATE public.questions 
SET correct_answer = 'B' 
WHERE content LIKE '%测功机在加载过程中发动机温度过高%' 
  AND correct_answer = 'A'
  AND type = 'judge';

-- 第480题：加载减速功率扫描从70km/h开始 -> 答案应为B(错误)
UPDATE public.questions 
SET correct_answer = 'B' 
WHERE content LIKE '%加载减速工况法功率扫描是油门踩到底待车速稳定后其车速最接近70km/h%' 
  AND correct_answer = 'A'
  AND type = 'judge';

-- 第483题：环境温度超过42°应终止检测 -> 答案应为B(错误，应该是45°)
UPDATE public.questions 
SET correct_answer = 'B' 
WHERE content LIKE '%GB3847-2018中要求，加载减速检测中，如果环境温度超过42°应终止检测%' 
  AND correct_answer = 'A'
  AND type = 'judge';

-- 第486题：OBD检查不合格判定排放检验不合格 -> 答案应为A(正确)
UPDATE public.questions 
SET correct_answer = 'A' 
WHERE content LIKE '%2010年7月1日以后生产的轻型汽油车，如果OBD检查不合格时，也判定排放检验结果不合格%' 
  AND correct_answer = 'B'
  AND type = 'judge';

-- 第502题：罐式危险货物运输车辆应设置倾覆保护装置 -> 答案应为A(正确)
UPDATE public.questions 
SET correct_answer = 'A' 
WHERE content LIKE '%2018年1月1日起出厂的罐式危险货物运输车辆，若罐体顶部无任何附属设备设施%' 
  AND correct_answer = 'B'
  AND type = 'judge';

-- 第508题：危险货物运输车应装用无内胎子午线轮胎 -> 答案应为A(正确)
UPDATE public.questions 
SET correct_answer = 'A' 
WHERE content LIKE '%GB38900规定，危险货物运输车及车长大于9m的其它客车应装用无内胎子午线轮胎%' 
  AND correct_answer = 'B'
  AND type = 'judge';

-- 第511题：危险货物车辆应安装红色标志灯 -> 答案应为A(正确)
UPDATE public.questions 
SET correct_answer = 'A' 
WHERE content LIKE '%GB13392-2023标准专门用于运送易燃和易爆物品的道路运输危险货物车辆，应在驾驶室上方安装红色标志灯%' 
  AND correct_answer = 'B'
  AND type = 'judge';

-- 第515题：仓栅式货车应安装可拆卸顶棚杆 -> 答案应为A(正确)
UPDATE public.questions 
SET correct_answer = 'A' 
WHERE content LIKE '%仓栅式载货车辆的载货部位的顶部应安装有与侧面栅栏可拆卸和调整的顶棚杆%' 
  AND correct_answer = 'B'
  AND type = 'judge';

-- 第519题：发动机后置客车应装备自动灭火装置 -> 答案应为A(正确)
UPDATE public.questions 
SET correct_answer = 'A' 
WHERE content LIKE '%2013年1月1日起出厂的发动机后置的客车%' 
  AND correct_answer = 'B'
  AND type = 'judge';

-- 验证更新结果
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN correct_answer = 'A' THEN 1 ELSE 0 END) as correct_count,
  SUM(CASE WHEN correct_answer = 'B' THEN 1 ELSE 0 END) as wrong_count
FROM public.questions 
WHERE type = 'judge';
