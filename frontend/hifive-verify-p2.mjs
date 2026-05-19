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
  page.on("pageerror", (e) => console.log(`  ❌ ${e.message.slice(0, 150)}`));

  try {
    console.log("[P2-1] 마이 (Lv/포인트)");
    await page.goto(`${BASE}/my`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p2v2-1-my-level-points");

    console.log("[P2-2] 친구 (검색 + 색상 점)");
    await page.goto(`${BASE}/friends`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p2v2-2-friends-search-color");

    console.log("[P2-3] 프로필 수정 (아이디/이메일)");
    await page.goto(`${BASE}/my/edit`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await shot(page, "p2v2-3-my-edit-readonly");

    console.log("[P2-4] 그룹 상세 탭 분리");
    await page.goto(`${BASE}/friends/groups/901`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p2v2-4-group-tabs-map");
    // 글 탭
    await page.getByText("📝 글", { exact: true }).first().click();
    await page.waitForTimeout(500);
    await shot(page, "p2v2-5-group-tabs-posts");
    // 멤버 탭
    await page.getByText("👥 멤버", { exact: true }).first().click();
    await page.waitForTimeout(500);
    await shot(page, "p2v2-6-group-tabs-members");

    console.log("[P2-5] 글 상세 +친구/스크랩 버튼");
    await page.goto(`${BASE}/community/101`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p2v2-7-post-friend-scrap");

    console.log("[P2-6] 식당 리뷰 사진");
    await page.goto(`${BASE}/restaurants/115`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.getByText("평가리뷰", { exact: true }).first().click();
    await page.waitForTimeout(1000);
    await shot(page, "p2v2-8-reviews-images");

    console.log("[P2-7] 해시태그 결과 페이지");
    await page.goto(`${BASE}/hashtags/${encodeURIComponent("카페")}`, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(1500);
    await shot(page, "p2v2-9-hashtag-page");
    await page.getByText(/블로그 글/).first().click();
    await page.waitForTimeout(500);
    await shot(page, "p2v2-10-hashtag-posts-tab");

    console.log("[P2-8] 설정");
    await page.goto(`${BASE}/my/settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await shot(page, "p2v2-11-settings");

    console.log("\n✅ P2 시각 검증 완료");
  } catch (e) {
    console.log(`\n❌ ${e.message}`);
    await shot(page, "_p2-error");
  } finally {
    await browser.close();
  }
})();
