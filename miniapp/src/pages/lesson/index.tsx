import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import {
  getQuestions,
  recordAnswer,
  removeHeart,
  addHeart,
  addXp,
  toggleFavorite,
  checkAndUnlockAchievements,
  updateDailyTaskProgress,
} from '@/lib/actions';
import { HEARTS_MAX, XP_PER_CORRECT, EXAM_TIME_MINUTES } from '@/lib/constants';
import { useUserProgressStore } from '@/store/user-progress';
import HeartsModal from '@/components/modals/HeartsModal';
import ExitModal from '@/components/modals/ExitModal';
import type { Question } from '@/lib/types';
import './index.scss';

export default function LessonPage() {
  const router = useRouter();
  const mode = router.params.mode || 'chapter';
  const chapter = router.params.chapter ? decodeURIComponent(router.params.chapter) : '';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hearts, setHearts] = useState(HEARTS_MAX);
  const [showHeartsModal, setShowHeartsModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [_xpEarned, setXpEarned] = useState(0);
  const [_correctCount, setCorrectCount] = useState(0);

  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [examTimeLeft, setExamTimeLeft] = useState(EXAM_TIME_MINUTES * 60);
  const examTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { progress, updateHearts, updateXp } = useUserProgressStore();

  useEffect(() => {
    if (progress) {
      setHearts(progress.hearts);
    }
  }, [progress]);

  const loadQuestions = useCallback(async () => {
    Taro.showLoading({ title: '加载中...' });
    try {
      let qs: Question[] = [];
      if (mode === 'exam') {
        qs = Taro.getStorageSync('exam_questions') || [];
      } else if (mode === 'recovery') {
        const allQuestions: Question[] = await getQuestions();
        const recoveryIds: number[] = Taro.getStorageSync('recovery_question_ids') || [];
        qs = allQuestions.filter(q => recoveryIds.includes(q.id));
      } else if (mode === 'favorites') {
        const allQuestions: Question[] = await getQuestions();
        const favoriteIds: number[] = Taro.getStorageSync('favorite_question_ids') || [];
        qs = allQuestions.filter(q => favoriteIds.includes(q.id));
      } else {
        qs = await getQuestions(chapter || undefined);
      }

      if (qs.length === 0) {
        Taro.hideLoading();
        Taro.showToast({ title: '没有题目', icon: 'none' });
        setTimeout(() => Taro.navigateBack(), 1500);
        return;
      }

      const shuffled = mode === 'exam' ? qs : [...qs].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      Taro.hideLoading();
    } catch (err) {
      Taro.hideLoading();
      Taro.showToast({ title: '加载失败', icon: 'error' });
    }
  }, [mode, chapter]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    if (mode === 'exam' && questions.length > 0) {
      examTimerRef.current = setInterval(() => {
        setExamTimeLeft(prev => {
          if (prev <= 1) {
            if (examTimerRef.current) clearInterval(examTimerRef.current);
            handleExamSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (examTimerRef.current) clearInterval(examTimerRef.current);
      };
    }
  }, [mode, questions.length]);

  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'single': return '单选题';
      case 'multiple': return '多选题';
      case 'judge': return '判断题';
      default: return type;
    }
  };

  const getTypeTagClass = (type: string) => {
    switch (type) {
      case 'single': return 'tag tag-single';
      case 'multiple': return 'tag tag-multiple';
      case 'judge': return 'tag tag-judge';
      default: return 'tag';
    }
  };

  const handleOptionClick = (key: string) => {
    if (isAnswered && mode !== 'exam') return;

    if (mode === 'exam') {
      if (currentQuestion?.type === 'multiple') {
        setExamAnswers(prev => {
          const selected = prev[currentIndex] ? prev[currentIndex].split(',').filter(Boolean) : [];
          const next = selected.includes(key) ? selected.filter(item => item !== key) : [...selected, key];
          return { ...prev, [currentIndex]: next.sort().join(',') };
        });
        return;
      }

      setExamAnswers(prev => ({ ...prev, [currentIndex]: key }));
      return;
    }

    if (currentQuestion?.type === 'multiple') {
      setSelectedOptions(prev =>
        prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      );
    } else {
      setSelectedOptions([key]);
    }
  };

  const checkAnswer = async () => {
    if (selectedOptions.length === 0) {
      Taro.showToast({ title: '请选择答案', icon: 'none' });
      return;
    }

    const correctAnswer = currentQuestion.correct_answer;
    let correct = false;

    if (currentQuestion.type === 'multiple') {
      const selected = [...selectedOptions].sort().join(',');
      const correctArr = correctAnswer.split(',').map(s => s.trim()).sort().join(',');
      correct = selected === correctArr;
    } else {
      correct = selectedOptions[0] === correctAnswer;
    }

    setIsAnswered(true);
    setIsCorrect(correct);

    if (correct) {
      setCorrectCount(prev => prev + 1);
      setXpEarned(prev => prev + XP_PER_CORRECT);

      const xpResult = await addXp(XP_PER_CORRECT);
      if (xpResult.success) updateXp(xpResult.newXp);

      const addHeartResult = await addHeart();
      if ((addHeartResult as any).success) {
        setHearts((prev) => {
          const nextHearts = Math.min(prev + 1, HEARTS_MAX);
          updateHearts(nextHearts);
          return nextHearts;
        });
      }

      await recordAnswer(currentQuestion.id, true);
      await updateDailyTaskProgress('answer_20_questions', 1);
      await updateDailyTaskProgress('chapter_correct_50', 1);
      await checkAndUnlockAchievements();
      Taro.eventCenter.trigger('progress:changed');
    } else {
      await recordAnswer(currentQuestion.id, false);
      Taro.eventCenter.trigger('progress:changed');

      const result = await removeHeart();
      if ((result as any).error === 'hearts') {
        setShowHeartsModal(true);
      } else if (result.success) {
        setHearts((prev) => {
          const nextHearts = Math.max(prev - 1, 0);
          updateHearts(nextHearts);
          if (nextHearts <= 0) {
            setShowHeartsModal(true);
          }
          return nextHearts;
        });
      }
    }
  };

  const resetAnswerState = () => {
    setSelectedOptions([]);
    setIsAnswered(false);
    setIsCorrect(false);
    setIsFavorite(false);
  };

  const handleNext = () => {
    if (currentIndex >= questions.length - 1) {
      if (mode === 'chapter' || mode === 'recovery' || mode === 'favorites') {
        updateDailyTaskProgress('chapter_practice', 1).finally(() => {
          Taro.eventCenter.trigger('progress:changed');
        });
        Taro.showToast({ title: '练习完成！', icon: 'success' });
        setTimeout(() => Taro.navigateBack(), 1500);
      }
      return;
    }

    setCurrentIndex(prev => prev + 1);
    resetAnswerState();
  };

  const handlePrevious = () => {
    if (currentIndex <= 0) return;
    setCurrentIndex(prev => prev - 1);
    resetAnswerState();
  };

  const handleExamSubmit = () => {
    if (examTimerRef.current) clearInterval(examTimerRef.current);

    let correct = 0;
    questions.forEach((q, idx) => {
      const answer = examAnswers[idx];
      if (!answer) return;
      if (q.type === 'multiple') {
        const selected = answer.split(',').sort().join(',');
        const correctArr = q.correct_answer.split(',').map(s => s.trim()).sort().join(',');
        if (selected === correctArr) correct++;
      } else {
        if (answer === q.correct_answer) correct++;
      }
    });

    const score = Math.round((correct / questions.length) * 100);
    Taro.setStorageSync('exam_result', { score, correct, total: questions.length, xpEarned: correct * XP_PER_CORRECT });
    Taro.navigateTo({ url: '/pages/exam/result/index' });
  };

  const handleFavorite = async () => {
    if (!currentQuestion) return;
    try {
      const result = await toggleFavorite(currentQuestion.id);
      setIsFavorite(result.isFavorite);
      Taro.eventCenter.trigger('progress:changed');
      Taro.showToast({ title: result.isFavorite ? '已收藏' : '取消收藏', icon: 'none' });
    } catch (err) {
      Taro.showToast({ title: '操作失败', icon: 'error' });
    }
  };

  const handleBack = () => {
    if (mode === 'exam') {
      setShowExitModal(true);
    } else {
      setShowExitModal(true);
    }
  };

  const confirmExit = () => {
    setShowExitModal(false);
    setShowHeartsModal(false);
    if (mode === 'exam') {
      if (examTimerRef.current) clearInterval(examTimerRef.current);
    }
    Taro.navigateBack();
  };

  if (!currentQuestion) return null;

  const optionKeys = Object.keys(currentQuestion.options || {});

  const getOptionClass = (key: string) => {
    let cls = 'option-item';
    if (mode === 'exam') {
      const answer = examAnswers[currentIndex];
      if (answer?.split(',').filter(Boolean).includes(key)) cls += ' selected';
    } else {
      if (!isAnswered && selectedOptions.includes(key)) cls += ' selected';
      if (isAnswered) {
        const correctAnswer = currentQuestion.correct_answer;
        const isCorrectOption = currentQuestion.type === 'multiple'
          ? correctAnswer.split(',').map(s => s.trim()).includes(key)
          : key === correctAnswer;
        if (isCorrectOption) cls += ' correct';
        else if (selectedOptions.includes(key)) cls += ' wrong';
      }
    }
    return cls;
  };

  return (
    <View className='lesson-page'>
      <View className='lesson-header'>
        <View className='header-top'>
          <Text className='back-btn' onClick={handleBack}>✕</Text>
          <View className='header-info'>
            {mode !== 'exam' && (
              <View className='hearts-display'>
                <Text className='hearts-icon'>♥</Text>
                <Text className='hearts-count'>{hearts}</Text>
              </View>
            )}
            {mode === 'exam' && (
              <View className='timer-display'>
                <Text className='timer-icon'>计时</Text>
                <Text className={`timer-text ${examTimeLeft < 300 ? 'warning' : ''}`}>
                  {formatTime(examTimeLeft)}
                </Text>
              </View>
            )}
          </View>
          {mode !== 'exam' && (
            <Text className='favorite-btn' onClick={handleFavorite}>
              {isFavorite ? '♥' : '☆'}
            </Text>
          )}
        </View>
        <View className='progress-section'>
          <View className='progress-bar'>
            <View className='progress-fill' style={{ width: `${progressPercent}%` }} />
          </View>
        </View>
      </View>

      <View className='lesson-body'>
        <View className='question-section'>
          <Text className={`question-type-tag ${getTypeTagClass(currentQuestion.type)}`}>
            {getTypeLabel(currentQuestion.type)}
          </Text>
          <Text className='question-content'>{currentQuestion.content}</Text>
        </View>

        <View className='options-section'>
          {optionKeys.map(key => (
            <View
              key={key}
              className={getOptionClass(key)}
              onClick={() => handleOptionClick(key)}
            >
              <Text className='option-key'>{key}</Text>
              <Text className='option-text'>{currentQuestion.options[key]}</Text>
            </View>
          ))}
        </View>

        {mode !== 'exam' && isAnswered && (
          <View className={`feedback-section ${isCorrect ? 'correct' : 'wrong'}`}>
            <Text className='feedback-title'>{isCorrect ? '回答正确' : '回答错误'}</Text>
            {!isCorrect && (
              <Text className='feedback-explanation'>
                正确答案：{currentQuestion.correct_answer}
              </Text>
            )}
            {currentQuestion.explanation && (
              <Text className='feedback-explanation'>{currentQuestion.explanation}</Text>
            )}
          </View>
        )}
      </View>

      <View className='lesson-footer'>
        {mode === 'exam' && (
          <View className={`btn-secondary ${currentIndex === 0 ? 'disabled' : ''}`} onClick={handlePrevious}>
            <Text>上一题</Text>
          </View>
        )}
        {mode === 'exam' ? (
          currentIndex === questions.length - 1 ? (
            <View className='btn-primary' onClick={handleExamSubmit}>
              <Text>提交试卷</Text>
            </View>
          ) : (
            <View className='btn-primary' onClick={handleNext}>
              <Text>下一题</Text>
            </View>
          )
        ) : !isAnswered ? (
          <View className='btn-primary' onClick={checkAnswer}>
            <Text>确认答案</Text>
          </View>
        ) : (
          <View className='btn-primary' onClick={handleNext}>
            <Text>{currentIndex >= questions.length - 1 ? '完成练习' : '下一题'}</Text>
          </View>
        )}
      </View>

      <HeartsModal visible={showHeartsModal} hearts={hearts} onClose={confirmExit} />
      <ExitModal visible={showExitModal} onConfirm={confirmExit} onCancel={() => setShowExitModal(false)} />
    </View>
  );
}
