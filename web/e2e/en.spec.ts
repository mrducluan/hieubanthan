// QTE — bản tiếng Anh /en: khung riêng (lang=en, không menu Việt), Numerology (form → bài đọc tiếng Anh → hỏi đáp), Tarot (xáo máy →
// rút 3 lá → lật → bài đọc tiếng Anh), trang kiến thức (Life Path, lá bài), sitemap-en, hreflang; bản Việt không đổi.
import { test, expect } from "@playwright/test";

const VI = /[ăâđêôơưàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/i;

test("khung /en: lang=en, hreflang hai chiều, không chữ Việt trong nội dung chính", async ({ page, request }) => {
  const html = await (await request.get("/en")).text();
  expect(html).toContain('<html lang="en"');
  expect(html).toMatch(/hreflang="vi" href="http:\/\/localhost:3000\/?"/i);
  // không menu Huyền học của bản Việt (RSC của not-found gốc có chữ Việt nhưng không hiện — kiểm phần nhìn thấy bằng trình duyệt ở dưới)
  const vi = await (await request.get("/than-so")).text();
  expect(vi).toMatch(/hreflang="en" href="http:\/\/localhost:3000\/en\/numerology"/i);
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Know yourself");
  expect(await page.locator("header nav").innerText()).not.toContain("Huyền học");
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
  // EN-ALL GĐ 1: khung hỏi đáp CHUNG (KhungChat) với chữ khung tiếng Anh — không còn HoiEn riêng.
  await page.getByLabel("Suggested questions").getByRole("button").first().click();
  const luot = page.getByTestId("cau-tra-loi").first();
  await expect(luot).toBeVisible({ timeout: 15_000 });
  expect(await luot.innerText()).not.toMatch(VI);
  await expect(page.getByTestId("cau-hoi-ban").first()).toContainText("You asked");
  await page.getByRole("textbox", { name: "Your question", exact: true }).fill("What is my personal year about this year?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByTestId("cau-tra-loi").nth(1)).toContainText(/personal year/i, { timeout: 15_000 });
  await expect(page.getByTestId("hanh-dong-tra-loi")).toHaveCount(0);   // Lưu / thẻ chia sẻ chưa có ở bản Anh
  // xoá hồ sơ trên máy → về form
  page.once("dialog", (d) => { expect(d.message()).toContain("Vietnamese site"); void d.accept(); });   // hồ sơ dùng chung → hỏi lại
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
  const bc = page.getByTestId("luan-giai-toan-bo");
  await expect(bc).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("lg-chuong-tra_loi")).toBeVisible();
  const text = await bc.innerText();
  expect(text).not.toMatch(VI);
  expect(text).toMatch(/Leans|condition|Not yet|Stuck/);
  // hỏi về lá vừa rút
  await page.getByRole("textbox", { name: "Your question", exact: true }).fill("What does the advice card mean?");
  await page.getByRole("button", { name: "Send question" }).click();
  const luot = page.getByTestId("cau-tra-loi").first();
  await expect(luot).toBeVisible({ timeout: 15_000 });
  expect(await luot.innerText()).not.toMatch(VI);
});

test("trang kiến thức tiếng Anh: Life Path 7, lá The Tower, 404 đúng", async ({ page, request }) => {
  const lp = (await (await request.get("/en/numerology/life-path/7")).text()).replace(/<!-- -->/g, "");
  expect(lp).toMatch(/<h1[^>]*>Life Path 7/);
  expect(lp).toContain("Counter-question");
  expect(lp).toMatch(/<title>Life Path 7[^<]*<\/title>/);   // tiêu đề tuyệt đối, không mang mẫu "· Hiểu Bản Thân"
  await page.goto("/en/numerology/life-path/7");
  expect(await page.locator("main").innerText()).not.toMatch(VI);
  const la = (await (await request.get("/en/tarot/cards/the-tower")).text()).replace(/<!-- -->/g, "");
  expect(la).toMatch(/<h1[^>]*>The Tower/);
  expect(la).toContain("Pictorial Key");
  expect((await request.get("/en/tarot/cards/khong-co")).status()).toBe(404);
  expect((await request.get("/en/numerology/life-path/10")).status()).toBe(404);
  const ds = await (await request.get("/en/tarot/cards")).text();
  expect((ds.match(/data-testid="the-la-en"/g) ?? []).length).toBe(78);
});

// HTT-2 mục 8 (2026-11-09) — QC SEO/GEO bản /en: 404 tiếng Anh, OG tiếng Anh, breadcrumb JSON-LD, hreflang hai chiều tới trang
// TƯƠNG ĐƯƠNG (cùng lá / cùng số), sitemap-en có hreflang vi + x-default, llms.txt có mục English, biến thể thị trường (Ý7).
test("/en: 404 tiếng Anh cho URL lạ và lá không có; không chữ Việt trong phần nhìn thấy", async ({ page, request }) => {
  for (const u of ["/en/khong-co-trang", "/en/tarot/cards/khong-co", "/en/numerology/life-path/10"]) {
    const r = await request.get(u);
    expect(r.status(), u).toBe(404);
    await page.goto(u);
    await expect(page.getByTestId("khong-tim-thay-en")).toBeVisible();
    const main = (await page.locator("main").innerText()).replace(/Tiếng Việt/g, "");
    expect(main, u).not.toMatch(VI);
    expect(main).toContain("star map");
  }
});

test("/en: OG tiếng Anh, BreadcrumbList + Article có ngày, hreflang tới trang tương đương, sitemap-en + llms", async ({ request }) => {
  const la = (await (await request.get("/en/tarot/cards/the-fool")).text()).replace(/<!-- -->/g, "");
  expect(la).toMatch(/property="og:image" content="[^"]*\/og\?lang=en&amp;tieu_de=/);
  expect(la).toMatch(/hrefLang="vi" href="http:\/\/localhost:3000\/tarot\/la-bai\/chang-kho"/i);
  expect(la).toMatch(/hrefLang="x-default" href="http:\/\/localhost:3000\/tarot\/la-bai\/chang-kho"/i);
  expect(la).toContain('"@type":"BreadcrumbList"');
  expect(la).toMatch(/"@type":"Article"[^<]*"datePublished":"\d{4}-\d{2}-\d{2}"/);
  expect(la).toMatch(/<title>The Fool tarot card meaning[^<]{0,60}<\/title>/);
  expect((la.match(/<title>([^<]*)<\/title>/)?.[1] ?? "").length).toBeLessThanOrEqual(70);
  // bản Việt của cùng lá trỏ ngược lại bản Anh
  const vi = (await (await request.get("/tarot/la-bai/chang-kho")).text());
  expect(vi).toMatch(/hrefLang="en" href="http:\/\/localhost:3000\/en\/tarot\/cards\/the-fool"/i);
  const lp = (await (await request.get("/en/numerology/life-path/22")).text());
  expect(lp).toMatch(/hrefLang="vi" href="http:\/\/localhost:3000\/than-so\/y-nghia-so\/so-22"/i);
  expect(lp).toContain('"@type":"BreadcrumbList"');
  expect(lp).toContain('data-testid="doc-tiep-en"');
  const sm = await (await request.get("/sitemap-en.xml")).text();
  expect(sm).toMatch(/<loc>http:\/\/localhost:3000\/en\/tarot\/cards\/the-tower<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod><xhtml:link rel="alternate" hreflang="en"[^>]*\/><xhtml:link rel="alternate" hreflang="vi" href="http:\/\/localhost:3000\/tarot\/la-bai\/thap"\/><xhtml:link rel="alternate" hreflang="x-default"/);
  expect(sm).toMatch(/\/en\/numerology\/life-path\/22<\/loc><lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/);
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).toContain("## English (/en)");
  expect(llms).toContain("http://localhost:3000/en/tarot/cards");
  // trang vào: Organization tiếng Anh + FAQ + nội dung đủ dày
  const home = await (await request.get("/en")).text();
  expect(home).toContain('"slogan":"What your numbers say about you"');
  expect(home).toContain("How a reading is built");
  const og = await request.get("/og?lang=en&tieu_de=Life%20Path%207");
  expect(og.status()).toBe(200);
  expect(og.headers()["content-type"]).toContain("image/png");
});

test("Ý7: Accept-Language en-US → html lang en-US + bản phủ en-us; en-GB → en", async ({ request }) => {
  const us = await (await request.get("/en", { headers: { "accept-language": "en-US,en;q=0.9" } })).text();
  expect(us).toContain('<html lang="en-US"');
  const gb = await (await request.get("/en", { headers: { "accept-language": "en-GB,en;q=0.9" } })).text();
  expect(gb).toContain('<html lang="en"');
  // route API chuyển tiếp biến thể tới engine: bộ bài vẫn tiếng Anh, chỉ mẫu câu khác chính tả
  const r = await request.get("/api/tarot/bo-bai", { headers: { "x-ngon-ngu": "en-us" } });
  if (r.ok()) {
    const d = (await r.json()) as { la: Record<string, { ten: string }> };
    expect(d.la.dai_0?.ten).toBe("The Fool");
  }
});
