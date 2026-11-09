// Ý3 + Ý6 (2026-11-09) — cụm trang "Sinh ở nước ngoài" (mục lục + từng nước, dữ kiện engine tính: múi giờ, mốc đổi giờ mùa
// hè, lệch giờ mặt trời, Nam bán cầu, lịch âm Việt – Trung) + gợi ý công tắc Trường phái trong form hồ sơ khi chọn thành phố
// Nam bán cầu / xa kinh tuyến múi giờ. Kiểm HTML máy chủ (H1, Trả lời nhanh, schema), sitemap, .md, 404, không chữ kỹ thuật.
import { test, expect } from "@playwright/test";
import { napDongY } from "./_hoso";

const CAM = /tzdata|zoneinfo|IANA|iztro|đại hung|xui xẻo|giải hạn|vật phẩm/i;

test("mục lục /sinh-o-nuoc-ngoai: H1, Trả lời nhanh, 12–15 nước, schema, sitemap + robots", async ({ page, request }) => {
  const r = await request.get("/sinh-o-nuoc-ngoai");
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toMatch(/<h1[^>]*>Sinh ở nước ngoài, lập lá số thế nào\?<\/h1>/);
  expect(html).toContain('"@type":"FAQPage"');
  expect(html).toContain('"@type":"BreadcrumbList"');
  await page.goto("/sinh-o-nuoc-ngoai");
  const n = await page.getByTestId("ds-nuoc").locator("li").count();
  expect(n).toBeGreaterThanOrEqual(12);
  expect(n).toBeLessThanOrEqual(15);
  await expect(page.getByTestId("nuoc-au")).toContainText("Nam bán cầu");
  await expect(page.getByTestId("nuoc-jp")).toContainText("không giờ mùa hè");
  expect(await page.locator("main").innerText()).not.toMatch(CAM);
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/sinh-o-nuoc-ngoai</loc>");
  expect(sm).toContain("/sinh-o-nuoc-ngoai/us</loc>");
  expect(sm).toContain("/sinh-o-nuoc-ngoai/au</loc>");
  const md = await request.get("/sinh-o-nuoc-ngoai.md");
  expect(md.status()).toBe(200);
  expect(await md.text()).toContain("# Sinh ở nước ngoài");
  expect(await (await request.get("/llms.txt")).text()).toContain("/sinh-o-nuoc-ngoai");
});

test("/sinh-o-nuoc-ngoai/au: Sydney UTC+10, mốc đổi giờ, Nam bán cầu → công tắc Mùa nơi sinh; Brisbane không giờ mùa hè", async ({ page, request }) => {
  const r = await request.get("/sinh-o-nuoc-ngoai/au");
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toMatch(/<h1[^>]*>Sinh ở Úc: lập lá số Tử vi, Bát tự thế nào cho đúng giờ\?<\/h1>/);
  expect(html).toContain('"@type":"FAQPage"');
  expect(html).toMatch(/<title>Sinh ở Úc/);
  await page.goto("/sinh-o-nuoc-ngoai/au");
  const bang = page.getByTestId("bang-thanh-pho");
  const syd = bang.locator("tr#tp-au-sydney");
  await expect(syd).toContainText("UTC+10");
  await expect(syd).toContainText("→ giờ chuẩn");
  await expect(syd).toContainText("Mùa nơi sinh");
  await expect(bang.locator("tr#tp-au-brisbane")).toContainText("không");
  const congTac = page.getByTestId("khoi-cong-tac");
  await expect(congTac).toContainText("Mùa nơi sinh");
  await expect(congTac.locator('a[href="/bat-tu#truong-phai-bat-tu"]')).toBeVisible();
  await expect(page.getByTestId("bang-lich-su").locator("tbody tr").first()).toBeVisible();
  await expect(page.getByTestId("lich-am-lech")).toContainText("Tết");
  await expect(page.getByTestId("nut-lap-la-so")).toHaveAttribute("href", "/bat-tu");
  expect(await page.locator("main").innerText()).not.toMatch(CAM);
  // .md cùng dữ kiện
  const md = await (await request.get("/sinh-o-nuoc-ngoai/au.md")).text();
  expect(md).toContain("| Sydney");
  expect(md).toContain("UTC+10");
});

test("/sinh-o-nuoc-ngoai/fr: Paris lệch giờ mặt trời −51 phút → công tắc Giờ mặt trời thực (cả Tử vi); /jp không có khối công tắc; 404 đúng", async ({ page, request }) => {
  await page.goto("/sinh-o-nuoc-ngoai/fr");
  await expect(page.getByTestId("bang-thanh-pho").locator("tr#tp-fr-paris")).toContainText("-51 phút");
  const congTac = page.getByTestId("khoi-cong-tac");
  await expect(congTac).toContainText("Giờ mặt trời thực");
  await expect(congTac.locator('a[href="/tu-vi#truong-phai"]')).toBeVisible();
  await page.goto("/sinh-o-nuoc-ngoai/jp");
  await expect(page.getByTestId("khoi-cong-tac")).toHaveCount(0);
  await expect(page.getByTestId("bang-thanh-pho").locator("tr#tp-jp-tokyo")).toContainText("UTC+9");
  expect((await request.get("/sinh-o-nuoc-ngoai/xx")).status()).toBe(404);
  expect((await request.get("/sinh-o-nuoc-ngoai/cn")).status()).toBe(404);
  expect((await request.get("/sinh-o-nuoc-ngoai/abc")).status()).toBe(404);
});

test("Ý6: form hồ sơ chọn Sydney → gợi ý hai cách xem + link; chọn Tokyo → chỉ link trang nước", async ({ page }) => {
  await napDongY(page);
  await page.goto("/bat-tu");
  const form = page.locator("form").filter({ has: page.locator("#noi-sinh") }).first();
  await form.locator("#noi-sinh").selectOption("nuoc_ngoai");
  const nuoc = form.locator("#nuoc-sinh");
  await expect(nuoc).toBeEnabled({ timeout: 15_000 });
  await nuoc.selectOption("au");
  await expect(form.locator('#thanh-pho-sinh option[value="au-sydney"]')).toHaveCount(1, { timeout: 15_000 });
  await form.locator("#thanh-pho-sinh").selectOption("au-sydney");
  const goiY = page.getByTestId("goi-y-cong-tac");
  await expect(goiY).toContainText("Sydney", { timeout: 15_000 });
  await expect(goiY).toContainText("mùa nơi sinh");
  await expect(goiY.locator('a[href="/bat-tu#truong-phai-bat-tu"]')).toBeVisible();
  await expect(goiY.locator('a[href="/sinh-o-nuoc-ngoai/au"]')).toBeVisible();
  // đo chỉ mã
  const suKien = await page.evaluate(() => (window as unknown as { __hbt_su_kien?: { ten?: string; su_kien?: string; props?: Record<string, unknown> }[] }).__hbt_su_kien ?? []);
  expect(JSON.stringify(suKien)).toContain("goi_y_cong_tac_hien");
  await nuoc.selectOption("jp");
  await form.locator("#thanh-pho-sinh").selectOption("jp-tokyo");
  await expect(page.getByTestId("goi-y-cong-tac")).toHaveCount(0);
  await expect(form.locator('a[href="/sinh-o-nuoc-ngoai/jp"]')).toBeVisible();
});
