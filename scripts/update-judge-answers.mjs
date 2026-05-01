import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wpoiryrmtauvqhfibevq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indwb2lyeXJtdGF1dnFoZmliZXZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MjQ3MDAsImV4cCI6MjA2NTMwMDcwMH0.sb_publishable_hxJjiEubCRm42WCrzYtkXA_dGJVtBy6';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateJudgeQuestions() {
  console.log('开始更新判断题答案...\n');

  const updates = [
    {
      condition: '检验过程中车辆排放出现目视可见黑烟或蓝烟',
      newAnswer: 'B',
      description: '第466题'
    },
    {
      condition: '不透光烟度计每天检测前应进行零点和满量程检查',
      newAnswer: 'A',
      description: '第468题'
    },
    {
      condition: '加载减速检测过程一般应在2min内完成',
      newAnswer: 'A',
      description: '第469题'
    },
    {
      condition: '自由加速测量时，必须在1秒的时间内',
      newAnswer: 'B',
      description: '第478题'
    },
    {
      condition: '测功机在加载过程中发动机温度过高',
      newAnswer: 'B',
      description: '第479题'
    },
    {
      condition: '加载减速工况法功率扫描是油门踩到底待车速稳定后其车速最接近70km/h',
      newAnswer: 'B',
      description: '第480题'
    },
    {
      condition: 'GB3847-2018中要求，加载减速检测中，如果环境温度超过42°应终止检测',
      newAnswer: 'B',
      description: '第483题'
    },
    {
      condition: '2010年7月1日以后生产的轻型汽油车，如果OBD检查不合格时，也判定排放检验结果不合格',
      newAnswer: 'A',
      description: '第486题'
    },
    {
      condition: '2018年1月1日起出厂的罐式危险货物运输车辆，若罐体顶部无任何附属设备设施',
      newAnswer: 'A',
      description: '第502题'
    },
    {
      condition: 'GB38900规定，危险货物运输车及车长大于9m的其它客车应装用无内胎子午线轮胎',
      newAnswer: 'A',
      description: '第508题'
    },
    {
      condition: 'GB13392-2023标准专门用于运送易燃和易爆物品的道路运输危险货物车辆，应在驾驶室上方安装红色标志灯',
      newAnswer: 'A',
      description: '第511题'
    },
    {
      condition: '仓栅式载货车辆的载货部位的顶部应安装有与侧面栅栏可拆卸和调整的顶棚杆',
      newAnswer: 'A',
      description: '第515题'
    },
    {
      condition: '2013年1月1日起出厂的发动机后置的客车',
      newAnswer: 'A',
      description: '第519题'
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const update of updates) {
    try {
      const { data, error } = await supabase
        .from('questions')
        .update({ correct_answer: update.newAnswer })
        .like('content', `%${update.condition}%`)
        .eq('type', 'judge')
        .select();

      if (error) {
        console.error(`❌ ${update.description} 更新失败: ${error.message}`);
        errorCount++;
      } else {
        console.log(`✅ ${update.description} 更新成功，影响 ${data?.length || 0} 条记录`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ ${update.description} 更新异常: ${err}`);
      errorCount++;
    }
  }

  console.log(`\n更新完成！成功: ${successCount}, 失败: ${errorCount}`);
  
  if (successCount > 0) {
    console.log('\n正在验证更新结果...');
    await verifyUpdates();
  }
}

async function verifyUpdates() {
  const { data, error } = await supabase
    .from('questions')
    .select('id, content, correct_answer')
    .eq('type', 'judge')
    .limit(10);

  if (!error && data) {
    console.log('\n验证样本（前10条判断题）:');
    data.forEach(q => {
      console.log(`  ${q.id}: ${q.correct_answer}`);
    });
  }
}

updateJudgeQuestions().catch(console.error);
