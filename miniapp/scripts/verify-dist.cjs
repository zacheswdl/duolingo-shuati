#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const appJsonPath = path.resolve(__dirname, '..', 'dist', 'app.json');

if (!fs.existsSync(appJsonPath)) {
  console.error('[miniapp] 未找到 dist/app.json。');
  console.error('[miniapp] 请先在 miniapp 目录执行: npm run build:weapp');
  process.exit(1);
}

console.log('[miniapp] dist/app.json 已存在，可在微信开发者工具编译。');