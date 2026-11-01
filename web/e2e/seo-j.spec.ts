// SEO-J — 76 trang "Sinh năm X mệnh gì" (1950–2025): H1, trả lời nhanh có can chi + nạp âm, mốc Tết/Lập xuân,
// tuổi hợp – xung, cung phi; link sang trang "tuổi X hợp hướng nào"; bản .md, sitemap, chủ đề.
import { test, expect } from "@playwright/test";

test("trang sinh năm 1990 mệnh gì: nội dung máy chủ đầy đủ", async ({ request }) => {
  const r = await request.get("/bat-tu/menh-theo-nam/sinh-nam-1990-menh-gi");
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toMatch(/<h1[^>]*>Sinh năm 1990 mệnh gì\? Tuổi Canh Ngọ, mệnh Lộ Bàng Thổ<\/h1>/);
  expect(html).toContain("27/01/1990");
  expect(html).toContain("Tam hợp: Dần, Ngọ, Tuất.");
  expect(html).toContain('href="/phong-thuy/huong-hop-tuoi/tuoi-1990"');      // SEO-K: trang tuổi gộp nam + nữ
  expect(html).toContain("Những năm đáng chú ý của tuổi Canh Ngọ 1990");
  expect(html).toContain('data-testid="minh-hoa"');
  expect(html).toContain('"@type":"FAQPage"');
  expect((await request.get("/bat-tu/menh-theo-nam/sinh-nam-1990-menh-gi.md")).status()).toBe(200);
});

test("chủ đề 76 trang, sitemap, 404 ngoài khoảng năm", async ({ request }) => {
  const cd = await (await request.get("/bat-tu/menh-theo-nam")).text();
  expect((cd.match(/href="\/bat-tu\/menh-theo-nam\/sinh-nam-\d{4}-menh-gi"/g) ?? []).length).toBe(78);   // NAM-1: thêm 2026, 2027
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/bat-tu/menh-theo-nam/sinh-nam-2000-menh-gi</loc>");
  expect((await request.get("/bat-tu/menh-theo-nam/sinh-nam-1900-menh-gi")).status()).toBe(404);
});
