import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { getFavorites, removeFavorite } from '@/lib/actions';
import type { Question } from '@/lib/types';
import './index.scss';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Question[]>([]);

  const loadFavorites = useCallback(async () => {
    Taro.showLoading({ title: '加载中...' });
    try {
      const data = await getFavorites();
      setFavorites(data);
    } catch (err) {
      Taro.showToast({ title: '加载失败', icon: 'error' });
    } finally {
      Taro.hideLoading();
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useDidShow(() => {
    loadFavorites();
  });

  const handleRemove = async (questionId: number) => {
    const res = await Taro.showModal({
      title: '取消收藏',
      content: '确定要取消收藏这道题吗？',
    });
    if (res.confirm) {
      try {
        await removeFavorite(questionId);
        Taro.showToast({ title: '已取消收藏', icon: 'success' });
        loadFavorites();
      } catch (err) {
        Taro.showToast({ title: '操作失败', icon: 'error' });
      }
    }
  };

  const handlePracticeAll = () => {
    if (favorites.length === 0) {
      Taro.showToast({ title: '暂无收藏', icon: 'none' });
      return;
    }
    const favoriteIds = favorites.map(q => q.id);
    Taro.setStorageSync('favorite_question_ids', favoriteIds);
    Taro.navigateTo({ url: '/pages/lesson/index?mode=favorites' });
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
    <View className='favorites-page'>
      <View className='container'>
        <Text className='favorite-count'>共 {favorites.length} 道收藏</Text>

        {favorites.length === 0 ? (
          <View className='empty-state'>
            <Text className='empty-icon'>—</Text>
            <Text className='empty-text'>暂无收藏题目</Text>
          </View>
        ) : (
          <ScrollView scrollY className='favorite-list'>
            {favorites.map(question => (
              <View key={question.id} className='favorite-item'>
                <View className='favorite-header'>
                  <View className='favorite-tags'>
                    <Text className={getTypeTagClass(question.type)}>
                      {getTypeLabel(question.type)}
                    </Text>
                  </View>
                  <Text
                    className='remove-btn'
                    onClick={() => handleRemove(question.id)}
                  >
                    取消收藏
                  </Text>
                </View>
                <Text className='favorite-content'>{question.content}</Text>
                <View className='favorite-answer'>
                  <Text className='answer-label'>正确答案</Text>
                  <Text className='answer-value'>{question.correct_answer}</Text>
                </View>
                {question.explanation && (
                  <View className='favorite-explanation'>
                    <Text className='explanation-label'>解析</Text>
                    <Text className='explanation-value'>{question.explanation}</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {favorites.length > 0 && (
        <View className='practice-all'>
          <View className='btn-primary' onClick={handlePracticeAll}>
            <Text>练习全部收藏</Text>
          </View>
        </View>
      )}
    </View>
  );
}
