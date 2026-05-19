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
    permissions: [], // 위치 권한 거부 시뮬레이션
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => console.log(`  ❌ ${e.message.slice(0, 150)}`));

  try {
    console.log("[P3-1] Skeleton — 커뮤니티 초기");
    await page.goto(`${BASE}/community`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400); // 짧게 대기하여 스켈레톤 노출 순간 캡처
    await shot(page, "p3-1-skeleton-community");
    await page.waitForTimeout(1500);

    console.log("[P3-3] 위치 권한 거부 안내");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    await shot(page, "p3-3-location-denied");

    console.log("[P3-4+5] 검색 결과 (필터 세분화 + 결과없음 CTA)");
    await page.goto(`${BASE}/search?q=라곰`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p3-4-search-filters");
    // 결과 없는 검색어
    await page.goto(`${BASE}/search?q=존재하지않는식당xyz123`, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(1500);
    await shot(page, "p3-5-search-empty-cta");

    console.log("[P3-6] 식당 등록 카카오 위치 검색");
    await page.goto(`${BASE}/restaurants/new`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "p3-6-restaurant-new-card");
    // 위치 카드 클릭하여 모달 오픈
    await page.getByText("카카오맵에서 위치 검색").first().click();
    await page.waitForTimeout(800);
    await shot(page, "p3-7-address-picker-opened");

    console.log("[P3-7] 블로그 작성 마크업 툴바");
    await page.goto(`${BASE}/community/write/blog`, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await shot(page, "p3-8-blog-toolbar");

    console.log("\n✅ P3 시각 검증 완료");
  } catch (e) {
    console.log(`\n❌ ${e.message}`);
    await shot(page, "_p3-error");
  } finally {
    await browser.close();
  }
})();
