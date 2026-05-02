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
      Taro.hideLoading();
      if (result.success) {
        setLoggedIn('');
        Taro.switchTab({ url: '/pages/index/index' });
      } else {
        Taro.showToast({ title: result.error || '登录失败', icon: 'none' });
      }
    } catch (err) {
      Taro.hideLoading();
      Taro.showToast({ title: '登录异常', icon: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className='login-page'>
      <Text className='login-logo'>🦉</Text>
      <Text className='login-title'>刷题练习</Text>
      <Text className='login-subtitle'>每天进步一点点，轻松通过考试！</Text>

      <View className='login-btn' onClick={handleLogin}>
        <Text className='wechat-icon'>💬</Text>
        <Text>微信一键登录</Text>
      </View>

      <View className='login-footer'>
        <Text className='footer-text'>登录即代表同意用户协议和隐私政策</Text>
      </View>
    </View>
  );
}
