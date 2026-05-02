import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { getExamQuestions } from '@/lib/actions';
import { EXAM_QUESTION_COUNT, EXAM_TIME_MINUTES, PASS_SCORE } from '@/lib/constants';
import './index.scss';

export default function ExamPage() {
  const handleStartExam = async () => {
    Taro.showLoading({ title: '准备考试...' });
    try {
      const questions = await getExamQuestions(EXAM_QUESTION_COUNT);
      Taro.setStorageSync('exam_questions', questions);
      Taro.setStorageSync('exam_start_time', Date.now());
      Taro.hideLoading();
      Taro.navigateTo({ url: '/pages/lesson/index?mode=exam' });
    } catch (err) {
      Taro.hideLoading();
      Taro.showToast({ title: '获取试题失败', icon: 'error' });
    }
  };

  return (
    <View className='exam-page'>
      <View className='container'>
        <View className='exam-header'>
          <Text className='exam-icon'>📝</Text>
          <Text className='exam-title'>模拟考试</Text>
          <Text className='exam-subtitle'>检验你的学习成果</Text>
        </View>

        <View className='card rules-card'>
          <Text className='section-title'>考试规则</Text>
          <View className='rule-list'>
            <View className='rule-item'>
              <View className='rule-icon'>📋</View>
              <View className='rule-content'>
                <Text className='rule-label'>题目数量</Text>
                <Text className='rule-value'>{EXAM_QUESTION_COUNT} 题</Text>
              </View>
            </View>
            <View className='rule-item'>
              <View className='rule-icon'>💯</View>
              <View className='rule-content'>
                <Text className='rule-label'>满分</Text>
                <Text className='rule-value'>100 分</Text>
              </View>
            </View>
            <View className='rule-item'>
              <View className='rule-icon'>⏱️</View>
              <View className='rule-content'>
                <Text className='rule-label'>考试时间</Text>
                <Text className='rule-value'>{EXAM_TIME_MINUTES} 分钟</Text>
              </View>
            </View>
            <View className='rule-item'>
              <View className='rule-icon'>🏆</View>
              <View className='rule-content'>
                <Text className='rule-label'>及格分数</Text>
                <Text className='rule-value'>{PASS_SCORE} 分</Text>
              </View>
            </View>
          </View>
        </View>

        <View className='start-section'>
          <View className='btn-primary' onClick={handleStartExam}>
            <Text>开始考试</Text>
          </View>
        </View>

        <View className='card tips-card'>
          <Text className='section-title'>温馨提示</Text>
          <Text className='tip-text'>
            考试开始后计时器将自动运行，请在规定时间内完成所有题目。
            考试结束后将统一评分，达到{PASS_SCORE}分即可通过考试获得额外奖励！
          </Text>
        </View>
      </View>
    </View>
  );
}
