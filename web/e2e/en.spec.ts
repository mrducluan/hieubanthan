// QTE — bản tiếng Anh /en: khung riêng (lang=en, không menu Việt), Numerology (form → bài đọc tiếng Anh → hỏi đáp), Tarot (xáo máy →
// rút 3 lá → lật → bài đọc tiếng Anh), trang kiến thức (Life Path, lá bài), sitemap-en, hreflang; bản Việt không đổi.
import { test, expect } from "@playwright/test";

const VI = /[ăâđêôơưàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/i;

test("khung /en: lang=en, hreflang hai chiều, không chữ Việt trong nội dung chính", async ({ page, request }) => {
  const html = await (await request.get("/en")).text();
  expect(html).toContain('<html lang="en"');
  expect(html).toMatch(/hreflang="vi" href="http:\/\/localhost:3000\/?"/i);
  expect(html.replace(/<script[\s\S]*?<\/script>/g, "")).not.toContain("Huyền học");   // chữ RSC của not-found gốc nằm trong <script>, không hiện
  const vi = await (await request.get("/than-so")).text();
  expect(vi).toMatch(/hreflang="en" href="http:\/\/localhost:3000\/en\/numerology"/i);
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Know yourself");
  const main = await page.locator("main").innerText();
  expect(main.replace(/Tiếng Việt/g, "")).not.toMatch(VI);
  const sm = await (await request.get("/sitemap-en.xml")).text();
  expect(sm).toContain("/en/numerology/life-path/11");
  expect(sm).toContain("/en/tarot/cards/the-fool");
  expect((await (await request.get("/robots.txt")).text())).toContain("/sitemap-en.xml");
});

test("numerology: form → bài đọc tiếng Anh → tích thẻ → hỏi đáp tiếng Anh", async ({ page }) => {
  await page.goto("/en/numerology");
  await page.getByTestId("o-ten-en").fill("Mary Ann Lee");
  await page.getByTestId("o-ngay-en").fill("24");
  await page.getByTestId("o-thang-en").selectOption("10");
  await page.getByTestId("o-nam-en").fill("1988");
  await page.getByTestId("nut-xem-en").click();
  await expect(page.getByTestId("so-en-duong_doi")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("so-en-duong_doi")).toContainText("Life Path");
  await expect(page.getByTestId("chan-dung-en")).toBeVisible();
  const text = await page.locator("main").innerText();
  expect(text).not.toMatch(VI);
  expect(text).toContain("Personal years");
  // thẻ tự tích: đủ 4 nét → kết quả
  const o = page.getByTestId("so-en-duong_doi").locator('input[type="checkbox"]');
  for (let i = 0; i < 4; i++) await o.nth(i).check();
  await expect(page.getByTestId("so-en-duong_doi").getByTestId("ket-qua-tick")).toContainText("fits you");
  // hỏi đáp
  await page.getByTestId("goi-y-en").first().click();
  const luot = page.getByTestId("luot-hoi-en").first();
  await expect(luot).toBeVisible({ timeout: 15_000 });
  expect(await luot.innerText()).not.toMatch(VI);
  await page.getByTestId("o-hoi-en").fill("What is my personal year about this year?");
  await page.getByTestId("nut-hoi-en").click();
  await expect(page.getByTestId("luot-hoi-en").nth(1)).toContainText(/personal year/i, { timeout: 15_000 });
  // xoá hồ sơ trên máy → về form
  await page.getByTestId("nut-xoa-en").click();
  await expect(page.getByTestId("form-en")).toBeVisible();
});

test("tarot: câu hỏi tiếng Anh được hiểu → xáo máy → rút 3 lá → lật → bài đọc tiếng Anh mở bằng câu trả lời", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/en/tarot");
  await expect(page.getByTestId("buoc-hoi-en")).toBeVisible();
  await expect(page.getByTestId("la-ngay-en")).toBeVisible({ timeout: 15_000 });
  await page.getByTestId("o-cau-hoi-en").fill("Should I take the new job offer?");
  await expect(page.getByTestId("goi-y-cau-hoi-en")).toContainText(/should I/i, { timeout: 10_000 });
  await page.getByTestId("trai-bai-en-ba_la_loi_khuyen").click();
  await page.getByTestId("nut-bat-dau-en").click();
  await expect(page.getByTestId("xao-bai")).toContainText("Hold to shuffle");
  await page.getByTestId("nut-may-xao").click();
  const quat = page.getByTestId("quat-bai");
  await expect(quat).toBeVisible({ timeout: 15_000 });
  for (const k of [5, 40, 70]) await quat.locator(`[data-chi-so="${k}"]`).dispatchEvent("click");
  await expect(page.getByTestId("quat-bai")).toHaveCount(0);
  await page.getByTestId("nut-lat-het-en").click();
  await page.getByTestId("nut-doc-bai-en").click();
  const bc = page.getByTestId("bao-cao-en");
  await expect(bc).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("chuong-en-tra_loi")).toBeVisible();
  const text = await bc.innerText();
  expect(text).not.toMatch(VI);
  expect(text).toMatch(/Leans|condition|Not yet|Stuck/);
  // hỏi về lá vừa rút
  await page.getByTestId("o-hoi-en").fill("What does the advice card mean?");
  await page.getByTestId("nut-hoi-en").click();
  const luot = page.getByTestId("luot-hoi-en").first();
  await expect(luot).toBeVisible({ timeout: 15_000 });
  expect(await luot.innerText()).not.toMatch(VI);
});

test("trang kiến thức tiếng Anh: Life Path 7, lá The Tower, 404 đúng", async ({ request }) => {
  const lp = (await (await request.get("/en/numerology/life-path/7")).text()).replace(/<!-- -->/g, "");
  expect(lp).toMatch(/<h1[^>]*>Life Path 7/);
  expect(lp).toContain("Counter-question");
  expect(lp.replace(/<script[\s\S]*?<\/script>/g, "")).not.toMatch(VI);
  const la = (await (await request.get("/en/tarot/cards/the-tower")).text()).replace(/<!-- -->/g, "");
  expect(la).toMatch(/<h1[^>]*>The Tower/);
  expect(la).toContain("Pictorial Key");
  expect((await request.get("/en/tarot/cards/khong-co")).status()).toBe(404);
  expect((await request.get("/en/numerology/life-path/10")).status()).toBe(404);
  const ds = await (await request.get("/en/tarot/cards")).text();
  expect((ds.match(/data-testid="the-la-en"/g) ?? []).length).toBe(78);
});
