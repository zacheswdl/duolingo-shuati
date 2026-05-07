import { useState } from 'react';
import { View, Text } from '@tarojs/components';
import Taro from '@tarojs/taro';
import { wxLogin } from '@/lib/auth';
import { useAuthStore } from '@/store/auth';
import './index.scss';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { setLoggedIn } = useAuthStore();

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    Taro.showLoading({ title: '登录中...' });
    try {
      const result = await wxLogin();
      if (result.success && result.userId) {
        setLoggedIn(result.userId);
        Taro.switchTab({ url: '/pages/index/index' });
      } else {
        Taro.showToast({ title: result.error || '登录失败', icon: 'none' });
      }
    } catch (err) {
      Taro.showToast({ title: '登录异常', icon: 'error' });
    } finally {
      Taro.hideLoading();
      setLoading(false);
    }
  };

  return (
    <View className='login-page'>
      <View className='cover-card'>
        <View className='cover-year'>
          <Text className='cover-year-text'>2026</Text>
        </View>
        <View className='cover-title'>
          <Text className='cover-title-text'>车检审子</Text>
        </View>
        <View className='cover-scene'>
          <View className='car-shape'>
            <View className='car-window car-window-left' />
            <View className='car-window car-window-right' />
            <View className='car-wheel car-wheel-left' />
            <View className='car-wheel car-wheel-right' />
          </View>
          <View className='person-shape'>
            <View className='person-head' />
            <View className='person-body' />
            <View className='person-paper' />
          </View>
          <View className='ground-line' />
        </View>
      </View>

      <View className='login-panel'>
        <Text className='login-title'>车检刷题练习</Text>
        <Text className='login-subtitle'>围绕 2026 年车检审子题库，每天刷一点，考试稳一点。</Text>

        <View className={`login-btn ${loading ? 'is-loading' : ''}`} onClick={handleLogin}>
          <Text className='wechat-icon'>微信</Text>
          <Text>{loading ? '登录中...' : '微信一键登录'}</Text>
        </View>

        <View className='login-tags'>
          <Text>章节练习</Text>
          <Text>模拟考试</Text>
          <Text>错题复盘</Text>
        </View>
      </View>

      <View className='login-footer'>
        <Text className='footer-text'>登录即代表同意用户协议和隐私政策</Text>
      </View>
    </View>
  );
}
