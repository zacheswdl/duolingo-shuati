import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getLeaderboard, getUserProgress } from '@/lib/actions';
import { useAuthStore } from '@/store/auth';
import type { LeaderboardEntry, UserProgress } from '@/lib/types';
import './index.scss';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myProgress, setMyProgress] = useState<UserProgress | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const { userId } = useAuthStore();

  const loadData = useCallback(async () => {
    Taro.showLoading({ title: '加载中...' });
    try {
      const [lbData, progressData] = await Promise.all([
        getLeaderboard(50),
        getUserProgress(),
      ]);
      setLeaderboard(lbData);
      setMyProgress(progressData);

      const myEntry = lbData.find(entry => entry.user_id === userId);
      if (myEntry) {
        setMyRank(myEntry.rank);
      }
    } catch (err) {
      Taro.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      Taro.hideLoading();
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const topThree = leaderboard.slice(0, 3);
  const restList = leaderboard.slice(3);

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return '';
  };

  const getMedal = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return '';
  };

  const sortedTop = [...topThree].sort((a, b) => {
    if (a.rank === 1) return 0;
    if (b.rank === 1) return 0;
    return a.rank - b.rank;
  });

  const rank1 = sortedTop.find(e => e.rank === 1);
  const rank2 = sortedTop.find(e => e.rank === 2);
  const rank3 = sortedTop.find(e => e.rank === 3);

  return (
    <ScrollView scrollY className='leaderboard-page'>
      <View className='top-three'>
        {rank2 && (
          <View className='top-item rank-2'>
            <Text className='top-avatar'>🦉</Text>
            <Text className='top-name'>{rank2.display_name || '匿名'}</Text>
            <Text className='top-xp'>{rank2.xp} XP</Text>
            <Text className='top-medal'>🥈</Text>
          </View>
        )}
        {rank1 && (
          <View className='top-item rank-1'>
            <Text className='top-crown'>👑</Text>
            <Text className='top-avatar'>🦉</Text>
            <Text className='top-name'>{rank1.display_name || '匿名'}</Text>
            <Text className='top-xp'>{rank1.xp} XP</Text>
            <Text className='top-medal'>🥇</Text>
          </View>
        )}
        {rank3 && (
          <View className='top-item rank-3'>
            <Text className='top-avatar'>🦉</Text>
            <Text className='top-name'>{rank3.display_name || '匿名'}</Text>
            <Text className='top-xp'>{rank3.xp} XP</Text>
            <Text className='top-medal'>🥉</Text>
          </View>
        )}
      </View>

      {myRank && (
        <View className='my-rank-card'>
          <View className='my-rank-left'>
            <Text className='my-rank-label'>我的排名</Text>
            <Text className='my-rank-position'>#{myRank}</Text>
          </View>
          <Text className='my-rank-xp'>{myProgress?.xp || 0} XP</Text>
        </View>
      )}

      <View className='ranking-list'>
        {restList.map(entry => (
          <View key={entry.user_id} className='ranking-item'>
            <Text className={`rank-number ${getRankClass(entry.rank)}`}>
              {entry.rank}
            </Text>
            <Text className='rank-avatar'>🦉</Text>
            <View className='rank-info'>
              <Text className='rank-name'>{entry.display_name || '匿名用户'}</Text>
              <Text className='rank-streak'>🔥 {entry.streak} 天连胜</Text>
            </View>
            <Text className='rank-xp'>{entry.xp} XP</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
