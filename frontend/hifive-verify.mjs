import { chromium } from "playwright";
import fs from "node:fs";

const SHOT_DIR = "/tmp/hifive-screenshots";
const BASE = "http://localhost:3000";
const TOKEN = fs.readFileSync("/tmp/_token.txt", "utf8").trim();

async function shot(page, name) {
  await page.screenshot({ path: `${SHOT_DIR}/${name}.png`, fullPage: false });
  console.log(`  📸 ${name}.png`);
}

async function logConsole(page, prefix) {
  page.on("pageerror", (e) => console.log(`  ❌ [${prefix}] pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") console.log(`  ⚠️ [${prefix}] console.error: ${m.text().slice(0, 200)}`);
  });
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
  await logConsole(page, "main");

  try {
    console.log("\n[1] 로그인 페이지");
    await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
    await shot(page, "01-login");

    console.log("\n[2] 홈/지도 (가천대 좌표)");
    await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
    await page.waitForTimeout(2500); // 카카오맵 렌더 대기
    await shot(page, "02-home");
    const restaurantCount = await page.evaluate(() =>
      fetch("http://localhost:8000/api/v1/restaurants?lat=37.4516&lng=127.1306&radius=2000&limit=200")
        .then((r) => r.json())
        .then((d) => d.length),
    );
    console.log(`  지도용 식당 ${restaurantCount}곳`);

    console.log("\n[3] 식당 상세 (라곰 id=115)");
    await page.goto(`${BASE}/restaurants/115`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "03-restaurant-info");
    // 메뉴 탭
    await page.getByText("메뉴", { exact: true }).first().click();
    await page.waitForTimeout(500);
    await shot(page, "04-restaurant-menu");
    // 평가리뷰 탭 (AI 평가 보임)
    await page.getByText("평가리뷰", { exact: true }).first().click();
    await page.waitForTimeout(1500); // ai-review 로드 대기
    await shot(page, "05-restaurant-reviews-ai");

    console.log("\n[6] 커뮤니티 목록");
    await page.goto(`${BASE}/community`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await shot(page, "06-community-list");

    console.log("\n[7] 글 상세 (id=101)");
    await page.goto(`${BASE}/community/101`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await shot(page, "07-post-detail");

    // 좋아요 클릭 (emoji로 버튼 찾기)
    const likeBtn = page.locator("button", { hasText: "🤍" }).first();
    const heartCount = await likeBtn.count();
    if (heartCount > 0) {
      await likeBtn.click();
      await page.waitForTimeout(800);
      await shot(page, "08-post-liked");
      console.log("  좋아요 클릭 → ❤️");
      // 되돌림
      const likedBtn = page.locator("button", { hasText: "❤️" }).first();
      if (await likedBtn.count() > 0) {
        await likedBtn.click();
        await page.waitForTimeout(500);
      }
    } else {
      console.log("  🤍 버튼 없음 (이미 ❤️ 상태 또는 시드 상태)");
      await shot(page, "08-post-detail-after-load");
    }

    console.log("\n[9] 댓글 모달");
    const cmtBtn = page.locator("button", { hasText: "💬" }).first();
    if (await cmtBtn.count() > 0) {
      await cmtBtn.click();
      await page.waitForTimeout(1500);
      await shot(page, "09-comments-modal");
      // 모달 닫기 (✕)
      const closeBtn = page.locator("button", { hasText: "✕" }).first();
      if (await closeBtn.count() > 0) await closeBtn.click();
      await page.waitForTimeout(300);
    } else {
      console.log("  💬 버튼 없음");
    }

    console.log("\n[10] 글 작성 분기 라우터");
    await page.goto(`${BASE}/community/write`, { waitUntil: "networkidle" });
    await shot(page, "10-write-router");

    console.log("\n[11] 블로그 글 작성 폼");
    await page.goto(`${BASE}/community/write/blog`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await shot(page, "11-write-blog-empty");
    // 식당 검색 모달 열기
    await page.getByText("식당을 선택하세요").click();
    await page.waitForTimeout(300);
    await page.locator('input[placeholder="식당 이름으로 검색"]').fill("라곰");
    await page.waitForTimeout(500); // debounce 200ms + 검색
    await shot(page, "12-write-restaurant-picker");

    console.log("\n[13] 간단 리뷰 작성 폼");
    await page.goto(`${BASE}/community/write/simple`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    await shot(page, "13-write-simple-empty");

    console.log("\n[14] 인증 콜백 페이지 (가짜 토큰으로 진입)");
    // 토큰이 이미 localStorage에 있어서 콜백은 /auth/me 호출 후 / 로 리다이렉트
    await page.goto(`${BASE}/auth/callback?token=${TOKEN}&is_new=false`, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(2000);
    console.log(`  콜백 후 URL: ${page.url()}`);
    await shot(page, "14-auth-callback");

    console.log("\n✅ 모든 시나리오 완료");
  } catch (e) {
    console.log(`\n❌ 에러: ${e.message}`);
    await shot(page, "_error");
  } finally {
    await browser.close();
  }
})();
