// QTE-1 tuần 3–4 — khung tiếng Anh /en: <html lang>, đầu/chân trang tiếng Anh, BaZi calculator chạy với nơi sinh nước ngoài
// (múi giờ + giờ mùa hè tự tính), hreflang hai chiều với trang Việt, 10 trang Day Master, sitemap.
import { test, expect } from "@playwright/test";

test("/en có lang=en + khung tiếng Anh; trang Việt vẫn lang=vi", async ({ request }) => {
  const en = await (await request.get("/en")).text();
  expect(en).toMatch(/<html lang="en"/);
  expect(en).toContain("Skip to content");
  expect(en).not.toContain("Bỏ qua điều hướng");
  const vi = await (await request.get("/bat-tu")).text();
  expect(vi).toMatch(/<html lang="vi"/);
});

test("hreflang hai chiều: /bat-tu ↔ /en/bazi-calculator, x-default về bản Việt", async ({ request }) => {
  for (const d of ["/bat-tu", "/en/bazi-calculator"]) {
    const html = await (await request.get(d)).text();
    expect(html, d).toMatch(/<link rel="alternate" hrefLang="en" href="[^"]*\/en\/bazi-calculator"/);
    expect(html, d).toMatch(/<link rel="alternate" hrefLang="vi-VN" href="[^"]*\/bat-tu"/);
    expect(html, d).toMatch(/<link rel="alternate" hrefLang="x-default" href="[^"]*\/bat-tu"/);
  }
  // trang không có bản dịch: không gắn hreflang lẻ
  expect(await (await request.get("/hop-doi")).text()).not.toMatch(/hrefLang="en"/);
});

test("BaZi calculator: sinh ở Los Angeles 15/07/1990 10:00 → bốn trụ, Day Master Xin Metal, cảnh báo giờ mùa hè", async ({ page }) => {
  await page.goto("/en/bazi-calculator");
  await expect(page.getByLabel("Country of birth")).toBeEnabled();   // đã hydrate + tải danh mục nước
  await page.getByLabel("Date of birth").fill("1990-07-15");
  await page.getByLabel(/Time of birth/).fill("10:00");
  await page.getByLabel(/Sex at birth/).selectOption("nam");
  await page.getByLabel("Country of birth").selectOption("us");
  await page.getByLabel("State / city").selectOption({ label: "California (Los Angeles, Orange County, San Jose, San Francisco, San Diego)" });
  await page.getByRole("button", { name: "Show my Four Pillars" }).click();
  const kq = page.getByTestId("ket-qua-bazi-en");
  await expect(kq.getByRole("table", { name: "Four Pillars" })).toContainText("辛");
  await expect(kq).toContainText("Xin Metal");
  await expect(kq).toContainText("Daylight saving time was in effect");
  await kq.getByRole("link", { name: /Read more about the Xin Metal Day Master/ }).click();
  await expect(page).toHaveURL(/\/en\/bazi\/day-master\/xin-metal$/);
  await expect(page.locator("h1")).toContainText("Xin Metal Day Master");
});

test("Day Master: mục lục 10 trang, slug lạ 404, sitemap có trang /en", async ({ page, request }) => {
  await page.goto("/en/bazi/day-master");
  await expect(page.getByTestId("ds-day-master").getByRole("link")).toHaveCount(10);
  expect((await request.get("/en/bazi/day-master/khong-co")).status()).toBe(404);
  const sm = await (await request.get("/sitemap.xml")).text();
  for (const d of ["/en<", "/en/bazi-calculator<", "/en/bazi/day-master/jia-wood<", "/en/privacy<"]) expect(sm).toContain(d);
});

test("Zi Wei chart: Los Angeles 15/07/1990 10:00 → Life Palace Qi Sha, link sang trang sao; hreflang /tu-vi ↔ /en/zi-wei-dou-shu-chart", async ({ page, request }) => {
  await page.goto("/en/zi-wei-dou-shu-chart");
  await expect(page.getByLabel("Country of birth")).toBeEnabled();
  await page.getByLabel("Date of birth").fill("1990-07-15");
  await page.getByLabel(/Time of birth/).fill("10:00");
  await page.getByLabel(/Sex at birth/).selectOption("nam");
  await page.getByLabel("Country of birth").selectOption("us");
  await page.getByLabel("State / city").selectOption({ label: "California (Los Angeles, Orange County, San Jose, San Francisco, San Diego)" });
  await page.getByRole("button", { name: "Show my Zi Wei chart" }).click();
  const kq = page.getByTestId("ket-qua-ziwei-en");
  await expect(kq).toContainText("Earth 5 Bureau");
  await expect(kq.getByRole("heading", { name: /Qi Sha/ })).toBeVisible();
  await kq.getByRole("link", { name: /Read more about Qi Sha/ }).click();
  await expect(page).toHaveURL(/\/en\/zi-wei\/stars\/qi-sha$/);
  const html = await (await request.get("/tu-vi")).text();
  expect(html).toMatch(/<link rel="alternate" hrefLang="en" href="[^"]*\/en\/zi-wei-dou-shu-chart"/);
  const sao = await (await request.get("/tu-vi/chinh-tinh/sao-that-sat")).text();
  expect(sao).toMatch(/hrefLang="en" href="[^"]*\/en\/zi-wei\/stars\/qi-sha"/);
});
