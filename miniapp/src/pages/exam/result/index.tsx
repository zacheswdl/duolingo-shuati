import { useState, useEffect } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { updateMaxExamScore, updateStreakFromClient, addXp } from '@/lib/actions';
import { PASS_SCORE, EXAM_PASS_BONUS_XP } from '@/lib/constants';
import './index.scss';

export default function ExamResultPage() {
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [total, setTotal] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [bonusXp, setBonusXp] = useState(0);
  const [streakUpdated, setStreakUpdated] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const result = Taro.getStorageSync('exam_result');
    if (result) {
      setScore(result.score);
      setCorrect(result.correct);
      setTotal(result.total);
      setXpEarned(result.xpEarned || 0);

      const passed = result.score >= PASS_SCORE;

      if (passed) {
        setShowConfetti(true);
        setBonusXp(EXAM_PASS_BONUS_XP);
        addXp(EXAM_PASS_BONUS_XP).catch(() => {});
        updateMaxExamScore(result.score).catch(() => {});
        updateStreakFromClient().then(res => {
          setStreakUpdated(res.success);
        }).catch(() => {});
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        updateMaxExamScore(result.score).catch(() => {});
      }
    }
  }, []);

  const passed = score >= PASS_SCORE;

  const handleBackHome = () => {
    Taro.switchTab({ url: '/pages/index/index' });
  };

  const handleRetry = () => {
    Taro.navigateBack();
  };

  return (
    <View className='result-page'>
      {showConfetti && (
        <View className='confetti'>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={i} className='confetti-piece' />
          ))}
        </View>
      )}

      <Text className='result-icon'>{passed ? '🎉' : '😔'}</Text>
      <Text className={`result-title ${passed ? 'passed' : 'failed'}`}>
        {passed ? '恭喜通过！' : '未通过'}
      </Text>
      <Text className='result-subtitle'>
        {passed ? '你太棒了，继续保持！' : '别灰心，再接再厉！'}
      </Text>

      <View className='score-card'>
        <Text className={`score-value ${passed ? '' : 'failed'}`}>{score}</Text>
        <Text className='score-label'>总分</Text>
      </View>

      <View className='stats-card'>
        <View className='stat-row'>
          <Text className='stat-label'>正确题数</Text>
          <Text className='stat-value'>{correct}/{total}</Text>
        </View>
        <View className='stat-row'>
          <Text className='stat-label'>答题经验</Text>
          <Text className='stat-value xp'>+{xpEarned} XP</Text>
        </View>
        {passed && (
          <View className='stat-row'>
            <Text className='stat-label'>通过奖励</Text>
            <Text className='stat-value bonus'>+{bonusXp} XP</Text>
          </View>
        )}
        {streakUpdated && (
          <View className='stat-row'>
            <Text className='stat-label'>连胜天数</Text>
            <Text className='stat-value xp'>🔥 已更新</Text>
          </View>
        )}
        <View className='stat-row'>
          <Text className='stat-label'>及格线</Text>
          <Text className='stat-value'>{PASS_SCORE} 分</Text>
        </View>
      </View>

      <View className='actions'>
        <View className='btn-primary' onClick={handleBackHome}>
          <Text>返回首页</Text>
        </View>
        {!passed && (
          <View className='btn-outline' onClick={handleRetry}>
            <Text>再试一次</Text>
          </View>
        )}
      </View>
    </View>
  );
}
