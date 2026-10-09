// SEO-I — 48 trang "Hoá X ở cung Y": H1, trả lời nhanh, bảng 10 năm can, hình minh hoạ trong HTML máy chủ;
// link sang trang "sao ở cung"; trang cung trỏ 4 trang tứ hoá; có bản .md và sitemap.
import { test, expect } from "@playwright/test";

test("trang Hoá Kỵ ở cung Tài Bạch: nội dung máy chủ đầy đủ", async ({ request }) => {
  const r = await request.get("/kien-thuc/tu-hoa/hoa-ky-cung-tai-bach");
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toMatch(/<h1[^>]*>Hoá Kỵ ở cung Tài Bạch: ý nghĩa, năm sinh nào có<\/h1>/);
  expect(html).toContain("Năm Giáp: Thái Dương hoá Kỵ.");
  expect(html).toContain('href="/kien-thuc/sao-cung/thai-duong-cung-tai-bach"');
  expect(html).toContain('data-testid="minh-hoa"');
  expect(html).toContain('"@type":"FAQPage"');
  expect((await request.get("/kien-thuc/tu-hoa/hoa-ky-cung-tai-bach.md")).status()).toBe(200);
});

test("trang cung trỏ 4 trang tứ hoá; chủ đề 48 trang; sitemap; 404", async ({ request }) => {
  const cung = await (await request.get("/kien-thuc/cung-tu-vi/cung-tai-bach")).text();
  expect((cung.match(/href="\/kien-thuc\/tu-hoa\/hoa-[a-z]+-cung-tai-bach"/g) ?? []).length).toBeGreaterThanOrEqual(4);
  const cd = await (await request.get("/kien-thuc/tu-hoa")).text();
  expect((cd.match(/href="\/kien-thuc\/tu-hoa\/hoa-[a-z-]+"/g) ?? []).length).toBe(48);
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/kien-thuc/tu-hoa/hoa-loc-cung-menh</loc>");
  expect((await request.get("/kien-thuc/tu-hoa/hoa-xau-cung-menh")).status()).toBe(404);
});
