import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getUserProgress, getUserAchievements, getDailyTasks, claimDailyTaskReward } from '@/lib/actions';
import { DAILY_TASKS, ACHIEVEMENTS, DAILY_TASK_REWARD_XP, DAILY_TASK_REWARD_XP_QUESTIONS } from '@/lib/constants';
import { useAuthStore } from '@/store/auth';
import { useUserProgressStore } from '@/store/user-progress';
import { logout } from '@/lib/auth';
import DailyTaskModal from '@/components/modals/DailyTaskModal';
import type { UserProgress, UserAchievement, UserDailyTask } from '@/lib/types';
import './index.scss';

export default function ProfilePage() {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [achievements, setAchievements] = useState<UserAchievement[]>([]);
  const [dailyTasks, setDailyTasks] = useState<UserDailyTask[]>([]);
  const [claimedTask, setClaimedTask] = useState<{ taskName: string; xpReward: number } | null>(null);
  const { setLoggedOut } = useAuthStore();
  const { setProgress: setStoreProgress } = useUserProgressStore();

  const loadData = useCallback(async () => {
    Taro.showLoading({ title: '加载中...' });
    try {
      const [progressData, achievementsData, tasksData] = await Promise.all([
        getUserProgress(),
        getUserAchievements(),
        getDailyTasks(),
      ]);
      setProgress(progressData);
      if (progressData) setStoreProgress(progressData);
      setAchievements(achievementsData);
      setDailyTasks(tasksData);
    } catch (err) {
      Taro.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      Taro.hideLoading();
    }
  }, [setStoreProgress]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const unlockedKeys = new Set(achievements.map(a => a.achievement_key));

  const handleClaimTask = async (taskId: number, taskType: string) => {
    try {
      const result = await claimDailyTaskReward(taskId);
      if ((result as any).error) {
        Taro.showToast({ title: '无法领取', icon: 'none' });
        return;
      }
      const rewardXp = taskType === 'answer_20_questions' ? DAILY_TASK_REWARD_XP_QUESTIONS : DAILY_TASK_REWARD_XP;
      const taskName = getTaskDef(taskType)?.name || taskType;
      setClaimedTask({ taskName, xpReward: rewardXp });
      loadData();
    } catch (err) {
      Taro.showToast({ title: '领取失败', icon: 'error' });
    }
  };

  const handleLogout = async () => {
    const res = await Taro.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
    });
    if (res.confirm) {
      await logout();
      setLoggedOut();
      Taro.reLaunch({ url: '/pages/login/index' });
    }
  };

  const getTaskDef = (taskType: string) => {
    return DAILY_TASKS.find(t => t.type === taskType);
  };

  return (
    <ScrollView scrollY className='profile-page'>
      <View className='container'>
        <View className='user-card'>
          <View className='avatar'>🦉</View>
          <View className='user-info'>
            <Text className='nickname'>学习者</Text>
            <View className='user-stats'>
              <View className='user-stat'>
                <Text className='stat-icon'>⚡</Text>
                <Text className='stat-val'>{progress?.xp || 0} XP</Text>
              </View>
              <View className='user-stat'>
                <Text className='stat-icon'>🔥</Text>
                <Text className='stat-val'>{progress?.streak || 0} 天</Text>
              </View>
              <View className='user-stat'>
                <Text className='stat-icon'>❤️</Text>
                <Text className='stat-val'>{progress?.hearts || 0}</Text>
              </View>
              <View className='user-stat'>
                <Text className='stat-icon'>✅</Text>
                <Text className='stat-val'>{progress?.total_correct || 0}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className='card daily-tasks-section'>
          <Text className='section-title'>每日任务</Text>
          <View className='task-list'>
            {dailyTasks.map(task => {
              const def = getTaskDef(task.task_type);
              const canClaim = task.completed && !task.claimed;
              return (
                <View key={task.id} className='task-item'>
                  <View className='task-info'>
                    <Text className='task-name'>{def?.name || task.task_type}</Text>
                    <Text className='task-desc'>{def?.description || ''}</Text>
                  </View>
                  <View className='task-action'>
                    {task.claimed ? (
                      <Text className='claim-btn disabled'>已领取</Text>
                    ) : (
                      <Text
                        className={`claim-btn ${canClaim ? '' : 'disabled'}`}
                        onClick={() => canClaim && handleClaimTask(task.id, task.task_type)}
                      >
                        {task.completed ? '领取' : `${task.progress}/${task.target}`}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View className='card achievement-section'>
          <Text className='section-title'>成就墙 ({achievements.length}/{ACHIEVEMENTS.length})</Text>
          <View className='achievement-grid'>
            {ACHIEVEMENTS.map(ach => {
              const unlocked = unlockedKeys.has(ach.key);
              return (
                <View key={ach.key} className={`achievement-item ${unlocked ? 'unlocked' : ''}`}>
                  <Text className='achievement-icon'>{unlocked ? '🏆' : '🔒'}</Text>
                  <Text className='achievement-name'>{ach.name}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className='card'>
          <Text className='section-title'>快捷入口</Text>
          <View className='quick-links'>
            <View className='link-item' onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
              <Text className='link-icon'>📖</Text>
              <Text className='link-text'>章节练习</Text>
            </View>
            <View className='link-item' onClick={() => Taro.switchTab({ url: '/pages/exam/index' })}>
              <Text className='link-icon'>📝</Text>
              <Text className='link-text'>模拟考试</Text>
            </View>
            <View className='link-item' onClick={() => Taro.navigateTo({ url: '/pages/leaderboard/index' })}>
              <Text className='link-icon'>🏅</Text>
              <Text className='link-text'>排行榜</Text>
            </View>
            <View className='link-item' onClick={() => Taro.switchTab({ url: '/pages/mistakes/index' })}>
              <Text className='link-icon'>❌</Text>
              <Text className='link-text'>错题本</Text>
            </View>
          </View>
        </View>

        <View className='logout-section'>
          <View className='btn-danger' onClick={handleLogout}>
            <Text>退出登录</Text>
          </View>
        </View>
      </View>
      <DailyTaskModal
        visible={!!claimedTask}
        taskName={claimedTask?.taskName || ''}
        xpReward={claimedTask?.xpReward || 0}
        onClose={() => setClaimedTask(null)}
      />
    </ScrollView>
  );
}
