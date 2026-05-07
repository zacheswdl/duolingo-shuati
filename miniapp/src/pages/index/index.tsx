import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getUserStats, getChapters, getLeaderboard, getDailyTasks, getUserProgress } from '@/lib/actions';
import { DAILY_TASKS } from '@/lib/constants';
import type { LeaderboardEntry, UserDailyTask } from '@/lib/types';
import bookIcon from '@/assets/icons/book.png';
import checkCircleIcon from '@/assets/icons/check-circle.png';
import crownIcon from '@/assets/icons/crown.png';
import fileXIcon from '@/assets/icons/file-x.png';
import flameIcon from '@/assets/icons/flame.png';
import giftIcon from '@/assets/icons/gift.png';
import medalIcon from '@/assets/icons/medal.png';
import penIcon from '@/assets/icons/pen.png';
import starIcon from '@/assets/icons/star.png';
import targetIcon from '@/assets/icons/target.png';
import trophyIcon from '@/assets/icons/trophy.png';
import xCircleIcon from '@/assets/icons/x-circle.png';
import './index.scss';

const iconMap: Record<string, string> = {
  BookOpen: bookIcon,
  PenTool: penIcon,
  Target: targetIcon,
  Trophy: trophyIcon,
  book: bookIcon,
};

const chapterNameMap: Record<string, string> = {
  chapter_judge: '判断题',
  chapter_multiple: '多选题',
  chapter_single: '单选题',
};

const getChapterDisplayName = (chapter: string): string => {
  return chapterNameMap[chapter] || chapter;
};

export default function IndexPage() {
  const [stats, setStats] = useState({ totalQuestions: 0, practiced: 0, mistakes: 0, favorites: 0 });
  const [chapters, setChapters] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [dailyTasks, setDailyTasks] = useState<UserDailyTask[]>([]);
  const [userProgress, setUserProgress] = useState<{ hearts: number; xp: number; streak: number } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [showAllLeaderboard, setShowAllLeaderboard] = useState(false);

  const loadData = useCallback(async () => {
    Taro.showLoading({ title: '加载中...' });
    try {
      const [statsData, chaptersData, leaderboardData, tasksData, progressData] = await Promise.all([
        getUserStats(),
        getChapters(),
        getLeaderboard(50),
        getDailyTasks(),
        getUserProgress(),
      ]);
      setStats(statsData);
      setChapters(chaptersData as string[]);
      setLeaderboard(leaderboardData);
      setDailyTasks(tasksData);
      if (progressData) {
        setUserProgress({ hearts: progressData.hearts, xp: progressData.xp, streak: progressData.streak });
        setCurrentUserId(progressData.user_id);
      }
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
    ? Math.min((stats.practiced / stats.totalQuestions) * 100, 100)
    : 0;

  const handleChapterClick = (chapter: string) => {
    Taro.navigateTo({ url: `/pages/lesson/index?chapter=${encodeURIComponent(chapter)}` });
  };

  const handleViewAllLeaderboard = () => {
    Taro.navigateTo({ url: '/pages/leaderboard/index' });
  };

  const getTaskDef = (taskType: string) => {
    return DAILY_TASKS.find(t => t.type === taskType);
  };

  const getTaskGuide = (taskType: string) => {
    const guides: Record<string, { requirement: string; howTo: string }> = {
      exam_pass: {
        requirement: '要求：模拟考试达到90分及以上',
        howTo: '方式：进入"模拟考试"完成一次考试',
      },
      chapter_practice: {
        requirement: '要求：完成1次章节练习',
        howTo: '方式：进入"章节练习"并完成一轮题目',
      },
      chapter_correct_50: {
        requirement: '要求：今日累计答对100题',
        howTo: '方式：持续刷题，当日答对题目自动累计',
      },
      answer_20_questions: {
        requirement: '要求：今日任意刷题20道',
        howTo: '方式：章节练习/考试任意模式累计作答',
      },
    };
    return guides[taskType] || {
      requirement: '要求：完成任务进度条目标',
      howTo: '方式：按任务提示继续练习',
    };
  };

  const getMyRank = () => {
    const entry = leaderboard.find((e) => e.user_id === currentUserId);
    return entry?.rank || '?';
  };

  return (
    <ScrollView scrollY className='index-page'>
      <View className='container'>
        <View className='header-card'>
          <View className='header-content'>
            <View className='header-icon'>
              <Image src={bookIcon} className='icon-img' mode='aspectFit' />
            </View>
            <View className='header-text'>
              <Text className='header-title'>学习是你自己该偷着去做的自私行为</Text>
              <Text className='header-subtitle'>2026.5.1内测 欢迎大家提出宝贵的改进建议</Text>
            </View>
          </View>
        </View>

        <View className='card leaderboard-card'>
          <View className='section-header'>
            <View className='section-title-wrapper'>
              <Image src={trophyIcon} className='section-icon' mode='aspectFit' />
              <Text className='section-title'>排行榜</Text>
            </View>
            <Text className='view-all-link' onClick={handleViewAllLeaderboard}>
              查看完整排行 ›
            </Text>
          </View>

          <View className='my-rank-card'>
            <View className='my-rank-header'>
              <View className='my-rank-label'>
                <Image src={trophyIcon} className='rank-icon' mode='aspectFit' />
                <Text className='my-rank-text'>我的排名</Text>
              </View>
              <Text className='my-rank-value'>#{getMyRank()}</Text>
            </View>
            <View className='my-rank-stats'>
              <View className='stat-badge xp-badge'>
                <Image src={starIcon} className='badge-icon' mode='aspectFit' />
                <Text className='badge-text'>{userProgress?.xp.toLocaleString() || 0} XP</Text>
              </View>
              <View className='stat-badge streak-badge'>
                <Image src={flameIcon} className='badge-icon' mode='aspectFit' />
                <Text className='badge-text'>连续{userProgress?.streak || 0}天</Text>
              </View>
            </View>
          </View>

          <View className='leaderboard-list'>
            {(showAllLeaderboard ? leaderboard : leaderboard.slice(0, 5)).map((entry) => {
              const isMe = entry.user_id === currentUserId;
              return (
                <View
                  key={entry.user_id}
                  className={`leaderboard-item ${isMe ? 'is-me' : ''} ${entry.rank <= 3 ? `rank-${entry.rank}` : ''}`}
                >
                  <View className='rank-cell'>
                    {entry.rank === 1 ? (
                      <Image src={crownIcon} className='rank-icon' mode='aspectFit' />
                    ) : entry.rank <= 3 ? (
                      <Image src={medalIcon} className='rank-icon' mode='aspectFit' />
                    ) : (
                      <Text className='rank-number'>#{entry.rank}</Text>
                    )}
                  </View>
                  <View className='avatar-cell'>
                    <Text className='avatar-text'>{String.fromCharCode(65 + (entry.rank - 1) % 26)}</Text>
                  </View>
                  <View className='name-cell'>
                    <Text className={`name-text ${isMe ? 'is-me' : ''}`}>
                      {entry.display_name || `用户${entry.user_id.slice(0, 6)}`}
                      {isMe && <Text className='me-tag'>(我)</Text>}
                    </Text>
                  </View>
                  <View className='xp-cell'>
                    <Image src={starIcon} className='xp-icon' mode='aspectFit' />
                    <Text className='xp-text'>{entry.xp.toLocaleString()}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {leaderboard.length > 5 && (
            <Text className='toggle-leaderboard' onClick={() => setShowAllLeaderboard(!showAllLeaderboard)}>
              {showAllLeaderboard ? '收起' : `展开全部 ${leaderboard.length} 名`}
            </Text>
          )}
        </View>

        <View className='stats-grid'>
          <View className='stat-card'>
            <Image src={fileXIcon} className='stat-icon' mode='aspectFit' />
            <Text className='stat-value'>{stats.totalQuestions}</Text>
            <Text className='stat-label'>总题目</Text>
          </View>
          <View className='stat-card'>
            <Image src={checkCircleIcon} className='stat-icon' mode='aspectFit' />
            <Text className='stat-value'>{stats.practiced}</Text>
            <Text className='stat-label'>已练习</Text>
          </View>
          <View className='stat-card'>
            <Image src={xCircleIcon} className='stat-icon' mode='aspectFit' />
            <Text className='stat-value'>{stats.mistakes}</Text>
            <Text className='stat-label'>错题</Text>
          </View>
          <View className='stat-card'>
            <Image src={starIcon} className='stat-icon' mode='aspectFit' />
            <Text className='stat-value'>{stats.favorites}</Text>
            <Text className='stat-label'>收藏</Text>
          </View>
        </View>

        <View className='card progress-card'>
          <View className='progress-header'>
            <Text className='progress-title'>总进度</Text>
            <Text className='progress-percent'>{Math.round(progressPercent)}%</Text>
          </View>
          <View className='progress-bar'>
            <View className='progress-fill' style={{ width: `${progressPercent}%` }} />
          </View>
        </View>

        <View className='card daily-tasks-card'>
          <View className='section-header'>
            <View className='section-title-wrapper'>
              <Image src={giftIcon} className='section-icon' mode='aspectFit' />
              <Text className='section-title'>今日任务</Text>
            </View>
            <Text className='task-count'>
              {dailyTasks.filter((t) => t.completed).length}/{dailyTasks.length}
            </Text>
          </View>
          <View className='task-list'>
            {dailyTasks.map((task) => {
              const def = getTaskDef(task.task_type);
              const progressPercent = task.target > 0 ? Math.round((task.progress / task.target) * 100) : 0;
              const taskGuide = getTaskGuide(task.task_type);
              return (
                <View key={task.id} className='task-item'>
                  <View className={`task-icon-wrapper ${task.completed ? 'completed' : ''}`}>
                    {task.completed ? (
                      <Image src={checkCircleIcon} className='task-icon' mode='aspectFit' />
                    ) : (
                      <Image src={iconMap[def?.icon || 'book'] || bookIcon} className='task-icon' mode='aspectFit' />
                    )}
                  </View>
                  <View className='task-content'>
                    <View className='task-header'>
                      <Text className={`task-name ${task.completed ? 'completed' : ''}`}>
                        {def?.name || task.task_type}
                      </Text>
                      <Text className='task-progress-text'>{task.progress}/{task.target}</Text>
                    </View>
                    <View className='task-progress-bar'>
                      <View className={`task-progress-fill ${task.completed ? 'completed' : ''}`} style={{ width: `${progressPercent}%` }} />
                    </View>
                    <Text className='task-guide'>{taskGuide.requirement}</Text>
                    <Text className='task-guide'>{taskGuide.howTo}</Text>
                    {task.claimed && (
                      <Text className='task-claimed'>已领取奖励 ✅</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View className='chapter-section'>
          <View className='section-header'>
            <View className='section-title-wrapper'>
              <Image src={bookIcon} className='section-icon' mode='aspectFit' />
              <Text className='section-title'>章节练习</Text>
            </View>
          </View>
          <View className='chapter-list'>
            {chapters.map((chapter, index) => (
              <View
                key={chapter}
                className='chapter-item'
                onClick={() => handleChapterClick(chapter)}
              >
                <View className='chapter-number'>{index + 1}</View>
                <View className='chapter-info'>
                  <Text className='chapter-name'>{getChapterDisplayName(chapter)}</Text>
                  <Text className='chapter-hint'>点击开始练习</Text>
                </View>
                <Image src={bookIcon} className='chapter-arrow' mode='aspectFit' />
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}