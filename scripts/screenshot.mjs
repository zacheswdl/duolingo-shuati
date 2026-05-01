import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

// 模拟 iPhone 14 Pro 尺寸 (390x844)
const MOBILE_VIEWPORT = { width: 390, height: 844 };

const PAGES = [
  { path: "/learn", name: "01-首页-学习" },
  { path: "/exam", name: "02-模拟考试" },
  { path: "/mistakes", name: "03-错题本" },
  { path: "/profile", name: "04-我的" },
];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: MOBILE_VIEWPORT,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: "zh-CN",
  });

  const page = await context.newPage();

  for (const { path, name } of PAGES) {
    try {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle", timeout: 15000 });
      // 等待一确保页面渲染完成
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `screenshots/${name}.png`,
        fullPage: true,
      });
      console.log(`✅ 已截图: ${name}`);
    } catch (err) {
      console.error(`❌ 截图失败: ${name}`, err.message);
    }
  }

  // 单独截图答题页面
  try {
    await page.goto(`${BASE_URL}/lesson?chapter=chapter_single`, {
      waitUntil: "networkidle",
      timeout: 15000,
    });
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: "screenshots/05-答题页面.png",
      fullPage: true,
    });
    console.log(`✅ 已截图: 05-答题页面`);
  } catch (err) {
    console.error(`❌ 截图失败: 05-答题页面`, err.message);
  }

  await browser.close();
  console.log("🎉 所有截图完成！");
}

main().catch(console.error);
