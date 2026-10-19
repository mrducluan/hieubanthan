// SEO-F — 92 trang "tuổi X hợp hướng nào" + mục lục + bản .md + sitemap.
import { test, expect } from "@playwright/test";

test("trang tuổi 1990 nam: HTML máy chủ có H1, mệnh Khảm, 4 hướng tốt, mốc đầu năm, schema", async ({ request, page }) => {
  const html = await (await request.get("/phong-thuy/huong-hop-tuoi/tuoi-1990-nam")).text();
  expect((html.match(/<h1[\s>]/g) ?? []).length).toBe(1);
  expect(html).toContain("Tuổi Canh Ngọ 1990 nam hợp hướng nào?");
  for (const loai of ['"@type":"Article"', '"@type":"FAQPage"', '"@type":"BreadcrumbList"']) expect(html).toContain(loai);
  await page.goto("/phong-thuy/huong-hop-tuoi/tuoi-1990-nam");
  const tr = page.getByTestId("tuoi-huong");
  await expect(tr).toContainText("mệnh quái Khảm");
  await expect(tr).toContainText("Đông Nam · Sinh Khí");
  await expect(tr).toContainText("04/02/1990");                  // Lập xuân
  await expect(tr).toContainText("27/01/1990");                  // Tết lịch Việt
  await tr.getByRole("link", { name: "Nữ 1990" }).click();
  await expect(page).toHaveURL(/tuoi-1990-nu$/);
  await expect(page.getByTestId("tuoi-huong")).toContainText("mệnh quái Cấn");
});

test("mục lục 92 trang, bản .md, sitemap, 404 năm ngoài phạm vi", async ({ request, page }) => {
  await page.goto("/phong-thuy/huong-hop-tuoi");
  await expect(page.getByTestId("huong-hop-tuoi").locator('a[href^="/phong-thuy/tuoi-"]')).toHaveCount(92);
  const md = await request.get("/phong-thuy/huong-hop-tuoi/tuoi-1985-nu.md");
  expect(md.status()).toBe(200);
  expect(await md.text()).toContain("Tết (lịch Trung Quốc): 1985-02-20");
  expect((await request.get("/phong-thuy/huong-hop-tuoi.md")).status()).toBe(200);
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/phong-thuy/huong-hop-tuoi/tuoi-2005-nu</loc>");
  expect((await request.get("/phong-thuy/huong-hop-tuoi/tuoi-1800-nam")).status()).toBe(404);
  expect((await request.get("/phong-thuy/huong-hop-tuoi/tuoi-1959-nam")).status()).toBe(404);
});
