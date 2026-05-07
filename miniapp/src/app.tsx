import Taro, { useLaunch } from '@tarojs/taro';
import { silentLogin } from './lib/auth';
import { useAuthStore } from './store/auth';
import './app.scss';

function App(props) {
  const { setLoggedIn, setLoggedOut } = useAuthStore();

  useLaunch(() => {
    silentLogin().then((result) => {
      if (result.success && result.userId) {
        setLoggedIn(result.userId);
        return;
      }

      setLoggedOut();
      const pages = Taro.getCurrentPages();
      const currentRoute = pages[pages.length - 1]?.route;
      if (currentRoute !== 'pages/login/index') {
        Taro.reLaunch({ url: '/pages/login/index' });
      }
    });
  });

  return props.children;
}

export default App;
