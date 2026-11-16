// QTE — bản tiếng Anh /en: khung (lang=en, không menu Việt), trang kiến thức (Life Path, lá bài), sitemap-en, hreflang; bản Việt
// không đổi. EN-ALL GĐ 7: Numerology + Tarot là rewrite của /than-so, /tarot (một cây component) — luồng công cụ kiểm ở
// e2e/en-numerology.spec.ts, e2e/en-tarot.spec.ts.
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

test("trang kiến thức tiếng Anh: Life Path 7, lá The Tower, 404 đúng", async ({ page, request }) => {
  const lp = (await (await request.get("/en/numerology/life-path/7")).text()).replace(/<!-- -->/g, "");
  expect(lp).toMatch(/<h1[^>]*>Number 7/);
  expect(lp).toMatch(/<title>Number 7[^<]*<\/title>/);   // tiêu đề tuyệt đối, không mang mẫu "· Hiểu Bản Thân"
  await page.goto("/en/numerology/life-path/7");
  expect(await page.locator("main").innerText()).not.toMatch(VI);
  const la = (await (await request.get("/en/tarot/cards/the-tower")).text()).replace(/<!-- -->/g, "");
  expect(la).toMatch(/<h1[^>]*>The Tower/);
  expect((await request.get("/en/tarot/cards/khong-co")).status()).toBe(404);
  expect((await request.get("/en/numerology/life-path/10")).status()).toBe(404);
  const ds = await (await request.get("/en/tarot/cards")).text();
  expect(new Set(ds.match(/href="\/en\/tarot\/cards\/[a-z0-9-]+"/g) ?? []).size).toBe(78);
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
