import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getMistakes } from '@/lib/actions';
import type { UserAction, Question } from '@/lib/types';
import './index.scss';

export default function MistakesPage() {
  const [mistakes, setMistakes] = useState<UserAction[]>([]);

  const loadMistakes = useCallback(async () => {
    Taro.showLoading({ title: '加载中...' });
    try {
      const data = await getMistakes();
      setMistakes(data);
    } catch (err) {
      Taro.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      Taro.hideLoading();
    }
  }, []);

  useEffect(() => {
    loadMistakes();
  }, [loadMistakes]);

  const handleStartRecovery = () => {
    if (mistakes.length === 0) {
      Taro.showToast({ title: '暂无错题', icon: 'none' });
      return;
    }
    const questionIds = mistakes.map(m => (m as any).question_id).filter(Boolean);
    Taro.setStorageSync('recovery_question_ids', questionIds);
    Taro.navigateTo({ url: '/pages/lesson/index?mode=recovery' });
  };

  const getTypeTagClass = (type: string) => {
    switch (type) {
      case 'single': return 'tag tag-single';
      case 'multiple': return 'tag tag-multiple';
      case 'judge': return 'tag tag-judge';
      default: return 'tag';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'single': return '单选';
      case 'multiple': return '多选';
      case 'judge': return '判断';
      default: return type;
    }
  };

  return (
    <View className='mistakes-page'>
      <View className='container'>
        <Text className='mistake-count'>共 {mistakes.length} 道错题</Text>

        {mistakes.length === 0 ? (
          <View className='empty-state'>
            <Text className='empty-icon'>🎉</Text>
            <Text className='empty-text'>太棒了，没有错题！</Text>
          </View>
        ) : (
          <ScrollView scrollY className='mistake-list'>
            {mistakes.map(item => {
              const question = (item as any).questions as Question | undefined;
              if (!question) return null;
              return (
                <View key={item.id} className='mistake-item'>
                  <View className='mistake-header'>
                    <View className='mistake-tags'>
                      <Text className={getTypeTagClass(question.type)}>
                        {getTypeLabel(question.type)}
                      </Text>
                    </View>
                    <Text className='mistake-chapter'>{question.chapter}</Text>
                  </View>
                  <Text className='mistake-content'>{question.content}</Text>
                  <View className='mistake-answer'>
                    <Text className='answer-label'>正确答案</Text>
                    <Text className='answer-value'>{question.correct_answer}</Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {mistakes.length > 0 && (
        <View className='start-recovery'>
          <View className='btn-primary' onClick={handleStartRecovery}>
            <Text>开始错题练习</Text>
          </View>
        </View>
      )}
    </View>
  );
}
