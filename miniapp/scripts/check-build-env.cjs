#!/usr/bin/env node
const major = Number(process.versions.node.split('.')[0]);

if (!Number.isFinite(major) || major < 18 || major >= 23) {
  console.error('[miniapp] Node 版本不兼容。当前:', process.version);
  console.error('[miniapp] 请切换到 Node 18/20/22 后再执行 Taro 构建。');
  console.error('[miniapp] 否则可能导致 taro 在生成 dist/app.json 前崩溃。');
  process.exit(1);
}