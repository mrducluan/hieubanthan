// SEO-H — 168 trang "sao X ở cung Y": H1 + trả lời nhanh + 12 vị trí (độ sáng, đồng cung, xung chiếu) + hình
// minh hoạ trong HTML máy chủ; trang sao / trang cung trỏ tới trang con; có bản .md và sitemap.
import { test, expect } from "@playwright/test";

test("trang sao ở cung: nội dung máy chủ đầy đủ", async ({ request }) => {
  const r = await request.get("/tu-vi/sao-o-cung/that-sat-cung-menh");
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toMatch(/<h1[^>]*>Thất Sát ở cung Mệnh: ý nghĩa, sáng hãm, sao đi cùng<\/h1>/);
  expect(html).toContain("Trả lời nhanh");
  expect(html).toContain("Thất Sát ở cung Mệnh theo từng vị trí");
  expect(html).toContain("Tý (Miếu)");                                   // độ sáng Nam phái theo chi
  expect(html).toContain('data-testid="minh-hoa"');
  expect(html).toContain('"@type":"FAQPage"');
  expect((await request.get("/tu-vi/sao-o-cung/that-sat-cung-menh.md")).status()).toBe(200);
});

test("trang sao và trang cung có danh sách trang con; chủ đề + sitemap", async ({ request }) => {
  const sao = await (await request.get("/tu-vi/chinh-tinh/sao-thai-am")).text();
  expect((sao.match(/href="\/tu-vi\/sao-o-cung\/thai-am-cung-/g) ?? []).length).toBeGreaterThanOrEqual(12);
  const cung = await (await request.get("/tu-vi/cung/cung-phu-the")).text();
  expect((cung.match(/href="\/tu-vi\/sao-o-cung\/[a-z-]+-cung-phu-the"/g) ?? []).length).toBeGreaterThanOrEqual(14);
  const cd = await (await request.get("/tu-vi/sao-o-cung")).text();
  expect((cd.match(/href="\/tu-vi\/sao-o-cung\/[a-z-]+"/g) ?? []).length).toBe(168);
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/tu-vi/sao-o-cung/tu-vi-cung-menh</loc>");
  expect((await request.get("/tu-vi/sao-o-cung/sao-khong-co-cung-menh")).status()).toBe(404);
});
