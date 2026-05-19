import { chromium } from "playwright";
import fs from "node:fs";

const SHOT_DIR = "/tmp/hifive-screenshots";
const BASE = "http://localhost:3000";
const TOKEN = fs.readFileSync("/tmp/_token.txt", "utf8").trim();

async function shot(page, name) {
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: false });
  console.log(`  📸 ${name}.png`);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 400, height: 800 },
    storageState: {
      cookies: [],
      origins: [
        {
          origin: BASE,
          localStorage: [{ name: "hifive_jwt", value: TOKEN }],
        },
      ],
    },
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log(`  ❌ pageerror: ${e.message.slice(0, 150)}`));

  try {
    console.log("\n[P1-A] 화면 11 — 커뮤니티 헤더 + FAB");
    await page.goto(`${BASE}/community`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p1-A-community-header-fab");

    console.log("\n[P1-B] 화면 24 — 알림 (오늘/어제/이전 + 모두 읽음)");
    await page.goto(`${BASE}/my/notifications`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p1-B-notifications");

    console.log("\n[P1-C] 화면 23 — 내 활동 스크랩 그리드 2열");
    await page.goto(`${BASE}/my/activity?tab=scraps`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p1-C-my-scraps-grid");

    console.log("\n[P0 추가] 친구 프로필 — 친구(92) 활동 보임");
    await page.goto(`${BASE}/friends/92`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await shot(page, "p1-D-friend-profile-activity");

    console.log("\n✅ P0+P1 추가 검증 완료");
  } catch (e) {
    console.log(`\n❌ 에러: ${e.message}`);
    await shot(page, "_p1-error");
  } finally {
    await browser.close();
  }
})();
