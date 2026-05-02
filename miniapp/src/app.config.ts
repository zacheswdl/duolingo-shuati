export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/exam/index',
    'pages/mistakes/index',
    'pages/profile/index',
    'pages/login/index',
    'pages/lesson/index',
    'pages/exam/result/index',
    'pages/favorites/index',
    'pages/leaderboard/index',
  ],
  tabBar: {
    color: '#999999',
    selectedColor: '#58CC02',
    borderStyle: 'white',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '学习',
        iconPath: 'assets/tab-icons/learn.png',
        selectedIconPath: 'assets/tab-icons/learn-active.png',
      },
      {
        pagePath: 'pages/exam/index',
        text: '考试',
        iconPath: 'assets/tab-icons/exam.png',
        selectedIconPath: 'assets/tab-icons/exam-active.png',
      },
      {
        pagePath: 'pages/mistakes/index',
        text: '错题',
        iconPath: 'assets/tab-icons/mistakes.png',
        selectedIconPath: 'assets/tab-icons/mistakes-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: 'assets/tab-icons/profile.png',
        selectedIconPath: 'assets/tab-icons/profile-active.png',
      },
    ],
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '刷题练习',
    navigationBarTextStyle: 'black',
  },
});
