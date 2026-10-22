// SEO-F → SEO-K — 46 trang "tuổi X hợp hướng nào" (nam + nữ một trang) + mục lục + bản .md + sitemap; bản một giới tính 308.
import { test, expect } from "@playwright/test";

test("trang tuổi 1990: HTML máy chủ có H1, nam Khảm + nữ Cấn, hướng tốt, mốc đầu năm, schema, link cùng tuổi", async ({ request, page }) => {
  const html = await (await request.get("/phong-thuy/huong-hop-tuoi/tuoi-1990")).text();
  expect((html.match(/<h1[\s>]/g) ?? []).length).toBe(1);
  expect(html).toContain("Tuổi Canh Ngọ 1990 hợp hướng nào? Nam mệnh Khảm, nữ mệnh Cấn");
  for (const loai of ['"@type":"Article"', '"@type":"FAQPage"', '"@type":"BreadcrumbList"', '"@type":"ImageObject"']) expect(html).toContain(loai);
  expect(html).toMatch(/og:image" content="[^"]*mang=phong-thuy/);                    // ảnh đại diện có la bàn
  expect(html).toContain('href="/bat-tu/menh-theo-nam/sinh-nam-1990-menh-gi"');          // cùng tuổi: mệnh theo năm
  expect(html).toMatch(/href="\/xem-tuoi-lam-nha\/\d{4}\/tuoi-1990"/);                    // cùng tuổi: làm nhà
  await page.goto("/phong-thuy/huong-hop-tuoi/tuoi-1990");
  const tr = page.getByTestId("tuoi-huong");
  await expect(tr).toContainText("Nam sinh năm 1990: mệnh Khảm");
  await expect(tr).toContainText("Nữ sinh năm 1990: mệnh Cấn");
  await expect(tr).toContainText("Đông Nam · Sinh Khí");
  await expect(tr).toContainText("04/02/1990");                  // Lập xuân
  await expect(tr).toContainText("27/01/1990");                  // Tết lịch Việt
});

test("mục lục 46 trang, bản .md, sitemap, 308 bản cũ, 404 năm ngoài phạm vi", async ({ request, page }) => {
  await page.goto("/phong-thuy/huong-hop-tuoi");
  await expect(page.getByTestId("huong-hop-tuoi").locator('a[href^="/phong-thuy/huong-hop-tuoi/tuoi-"]')).toHaveCount(46);
  const md = await request.get("/phong-thuy/huong-hop-tuoi/tuoi-1985.md");
  expect(md.status()).toBe(200);
  const mdChu = await md.text();
  expect(mdChu).toContain("Tết (lịch Trung Quốc): 1985-02-20");
  expect(mdChu).toContain("## Nam sinh năm 1985");
  expect(mdChu).toContain("## Nữ sinh năm 1985");
  expect((await request.get("/phong-thuy/huong-hop-tuoi.md")).status()).toBe(200);
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/phong-thuy/huong-hop-tuoi/tuoi-2005</loc>");
  expect(sm).not.toMatch(/huong-hop-tuoi\/tuoi-\d{4}-(nam|nu)</);
  const cu = await request.get("/phong-thuy/huong-hop-tuoi/tuoi-1990-nu", { maxRedirects: 0 });
  expect(cu.status()).toBe(308);
  expect(new URL(cu.headers()["location"]!, "http://x").pathname).toBe("/phong-thuy/huong-hop-tuoi/tuoi-1990");
  expect((await request.get("/phong-thuy/huong-hop-tuoi/tuoi-1800")).status()).toBe(404);
  expect((await request.get("/phong-thuy/huong-hop-tuoi/tuoi-1959")).status()).toBe(404);
});
