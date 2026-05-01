import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";
const LOGIN_EMAIL = process.env.SCREENSHOT_EMAIL || "";
const LOGIN_PASSWORD = process.env.SCREENSHOT_PASSWORD || "";

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

  if (LOGIN_EMAIL && LOGIN_PASSWORD) {
    console.log("🔐 正在登录...");
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle", timeout: 15000 });
    await page.waitForTimeout(500);

    await page.fill('input[name="email"]', LOGIN_EMAIL);
    await page.fill('input[name="password"]', LOGIN_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL("**/learn", { timeout: 15000 });
    await page.waitForTimeout(1000);
    console.log("✅ 登录成功");
  } else {
    console.log("⚠️ 未设置 SCREENSHOT_EMAIL/SCREENSHOT_PASSWORD，跳过登录");
  }

  for (const { path, name } of PAGES) {
    try {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: "networkidle", timeout: 15000 });
      await page.waitForTimeout(800);
      await page.screenshot({
        path: `screenshots/${name}.png`,
        fullPage: true,
      });
      console.log(`✅ 已截图: ${name}`);
    } catch (err) {
      console.error(`❌ 截图失败: ${name}`, err.message);
    }
  }

  try {
    await page.goto(`${BASE_URL}/lesson?chapter=chapter_single`, {
      waitUntil: "networkidle",
      timeout: 15000,
    });
    await page.waitForTimeout(1500);
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
