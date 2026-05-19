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
    console.log("\n[P2-1] 친구 목록");
    await page.goto(`${BASE}/friends`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p2-01-friends");

    console.log("\n[P2-2] 친구 검색");
    await page.goto(`${BASE}/friends/search`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await page.locator('input[placeholder*="검색"]').fill("캠");
    await page.waitForTimeout(1000);
    await shot(page, "p2-02-friend-search");

    console.log("\n[P2-3] 친구 프로필 (id=92)");
    await page.goto(`${BASE}/friends/92`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p2-03-friend-profile");

    console.log("\n[P2-4] 그룹 탭");
    await page.goto(`${BASE}/friends`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.getByText("그룹", { exact: true }).first().click();
    await page.waitForTimeout(500);
    await shot(page, "p2-04-groups-tab");

    console.log("\n[P2-5] 그룹 상세 (id=901)");
    await page.goto(`${BASE}/friends/groups/901`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p2-05-group-detail");

    console.log("\n[P2-6] 그룹 생성");
    await page.goto(`${BASE}/friends/groups/new`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await shot(page, "p2-06-group-new");

    console.log("\n[P2-7] 마이 페이지");
    await page.goto(`${BASE}/my`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p2-07-my");

    console.log("\n[P2-8] 프로필 수정");
    await page.goto(`${BASE}/my/edit`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await shot(page, "p2-08-my-edit");

    console.log("\n[P2-9] 내 활동");
    await page.goto(`${BASE}/my/activity`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p2-09-my-activity");

    console.log("\n[P2-10] 내 알림");
    await page.goto(`${BASE}/my/notifications`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p2-10-my-notifications");

    console.log("\n[P2-11] 알림 토글 설정");
    await page.goto(`${BASE}/my/settings/notifications`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await shot(page, "p2-11-my-noti-settings");

    console.log("\n[P2-12] 검색 페이지");
    await page.goto(`${BASE}/search`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p2-12-search-home");
    await page.locator('input[placeholder*="검색"]').first().fill("라곰");
    await page.waitForTimeout(200);
    await page.keyboard.press("Enter");
    await page.waitForTimeout(1500);
    await shot(page, "p2-13-search-results");

    console.log("\n[P3-1] 식당 등록 폼");
    await page.goto(`${BASE}/restaurants/new`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await shot(page, "p3-01-restaurant-new");

    console.log("\n✅ P2/P3 시각 검증 완료");
  } catch (e) {
    console.log(`\n❌ 에러: ${e.message}`);
    await shot(page, "_p2p3-error");
  } finally {
    await browser.close();
  }
})();
