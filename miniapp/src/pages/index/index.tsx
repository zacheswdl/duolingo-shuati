import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getUserStats, getChapters, getQuestions, getLeaderboard, getDailyTasks } from '@/lib/actions';
import { DAILY_TASKS } from '@/lib/constants';
import type { Question, LeaderboardEntry, UserDailyTask } from '@/lib/types';
import './index.scss';

export default function IndexPage() {
  const [stats, setStats] = useState({ totalQuestions: 0, practiced: 0, mistakes: 0, favorites: 0 });
  const [chapters, setChapters] = useState<string[]>([]);
  const [chapterQuestions, setChapterQuestions] = useState<Record<string, Question[]>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyTasks, setDailyTasks] = useState<UserDailyTask[]>([]);

  const loadData = useCallback(async () => {
    Taro.showLoading({ title: '加载中...' });
    try {
      const [statsData, chaptersData, leaderboardData, tasksData] = await Promise.all([
        getUserStats(),
        getChapters(),
        getLeaderboard(5),
        getDailyTasks(),
      ]);
      setStats(statsData);
      setChapters(chaptersData as string[]);
      setLeaderboard(leaderboardData);
      setDailyTasks(tasksData);

      const questionsMap: Record<string, Question[]> = {};
      for (const ch of (chaptersData as string[])) {
        const qs = await getQuestions(ch as string);
        questionsMap[ch as string] = qs;
      }
      setChapterQuestions(questionsMap);
    } catch (err) {
      Taro.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      Taro.hideLoading();
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const progressPercent = stats.totalQuestions > 0
    ? Math.round((stats.practiced / stats.totalQuestions) * 100)
    : 0;

  const getChapterTypeCount = (chapter: string) => {
    const qs = chapterQuestions[chapter] || [];
    const single = qs.filter(q => q.type === 'single').length;
    const multiple = qs.filter(q => q.type === 'multiple').length;
    const judge = qs.filter(q => q.type === 'judge').length;
    return { single, multiple, judge, total: qs.length };
  };

  const handleChapterClick = (chapter: string) => {
    Taro.navigateTo({ url: `/pages/lesson/index?chapter=${encodeURIComponent(chapter)}` });
  };

  const handleViewAllLeaderboard = () => {
    Taro.navigateTo({ url: '/pages/leaderboard/index' });
  };

  const getTaskDef = (taskType: string) => {
    return DAILY_TASKS.find(t => t.type === taskType);
  };

  return (
    <ScrollView scrollY className='index-page'>
      <View className='container'>
        <View className='card stats-panel'>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.totalQuestions}</Text>
            <Text className='stat-label'>总题数</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.practiced}</Text>
            <Text className='stat-label'>已练习</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.mistakes}</Text>
            <Text className='stat-label'>错题</Text>
          </View>
          <View className='stat-item'>
            <Text className='stat-value'>{stats.favorites}</Text>
            <Text className='stat-label'>收藏</Text>
          </View>
        </View>

        <View className='card progress-section'>
          <View className='progress-header'>
            <Text className='progress-text'>学习进度</Text>
            <Text className='progress-percent'>{progressPercent}%</Text>
          </View>
          <View className='progress-bar'>
            <View className='progress-fill' style={{ width: `${progressPercent}%` }} />
          </View>
        </View>

        <View className='chapter-section'>
          <Text className='section-title'>章节列表</Text>
          <View className='chapter-list'>
            {chapters.map(chapter => {
              const counts = getChapterTypeCount(chapter);
              return (
                <View
                  key={chapter}
                  className='chapter-item'
                  onClick={() => handleChapterClick(chapter)}
                >
                  <View className='chapter-info'>
                    <Text className='chapter-name'>{chapter}</Text>
                    <View className='chapter-meta'>
                      <Text className='meta-tag'>单选 {counts.single}</Text>
                      <Text className='meta-tag'>多选 {counts.multiple}</Text>
                      <Text className='meta-tag'>判断 {counts.judge}</Text>
                    </View>
                  </View>
                  <Text className='chapter-arrow'>›</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className='card leaderboard-preview'>
          <Text className='section-title'>排行榜</Text>
          <View className='leaderboard-list'>
            {leaderboard.map(item => (
              <View key={item.user_id} className='leaderboard-item'>
                <Text className={`rank ${item.rank <= 3 ? `rank-${item.rank}` : ''}`}>
                  {item.rank}
                </Text>
                <Text className='name'>{item.display_name || '匿名用户'}</Text>
                <Text className='xp'>{item.xp} XP</Text>
              </View>
            ))}
          </View>
          <View className='view-all' onClick={handleViewAllLeaderboard}>
            <Text>查看完整排行 ›</Text>
          </View>
        </View>

        <View className='card daily-tasks-section'>
          <Text className='section-title'>每日任务</Text>
          <View className='task-list'>
            {dailyTasks.map(task => {
              const def = getTaskDef(task.task_type);
              const progress = Math.min(task.progress, task.target);
              return (
                <View key={task.id} className='task-item'>
                  <View className='task-info'>
                    <Text className='task-name'>{def?.name || task.task_type}</Text>
                    <Text className='task-desc'>{def?.description || ''}</Text>
                  </View>
                  <View className='task-progress'>
                    {task.completed ? (
                      <Text className='task-completed'>✓ 已完成</Text>
                    ) : (
                      <Text className='task-progress-text'>{progress}/{task.target}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
