import { defineConfig } from '@tarojs/cli';
import devConfig from './dev';

export default defineConfig(async (merge) => {
  const baseConfig = {
    projectName: 'duolingo-shuati-mini',
    date: '2026-5-2',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot: 'dist',
    plugins: ['@tarojs/plugin-framework-react'],
    defineConstants: {},
    copy: { patterns: [], options: {} },
    framework: 'react',
    compiler: {
      type: 'webpack5',
      prebundle: { enable: false },
    },
    sass: {
      data: '@import "@/styles/variables.scss";',
    },
    mini: {
      postcss: {
        pxtransform: { enable: true, config: {} },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
      miniCssExtractPluginOption: {
        ignoreOrder: true,
      },
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      postcss: {
        autoprefixer: { enable: true, config: {} },
        cssModules: {
          enable: false,
          config: {
            namingPattern: 'module',
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
    },
    rn: { appName: 'taroDemo', postcss: {} },
  };

  if (process.env.NODE_ENV === 'development') {
    return merge({}, baseConfig, devConfig);
  }
  return baseConfig;
});
