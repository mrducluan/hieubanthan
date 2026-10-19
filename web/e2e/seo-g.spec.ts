// SEO-G — cụm trang thần số học theo câu người Việt hay tìm: cặp số hợp nhau, hợp nghề gì, trong tình yêu,
// năm cá nhân, nợ nghiệp. HTML máy chủ có H1 dạng câu hỏi, trả lời nhanh, hình minh hoạ, schema; có bản .md, sitemap.
import { test, expect } from "@playwright/test";

for (const [duong, h1] of [
  ["/hop-doi/cap-so/so-chu-dao-3-va-6", "Số chủ đạo 3 và 6 có hợp nhau không?"],
  ["/than-so/nghe-nghiep/so-7-hop-nghe-gi", "Số chủ đạo 7 hợp nghề gì?"],
  ["/than-so/tinh-yeu/so-2-trong-tinh-yeu", "Số chủ đạo 2 trong tình yêu"],
  ["/than-so/nam-ca-nhan/nam-ca-nhan-5", "Năm cá nhân số 5"],
  ["/than-so/no-nghiep/no-nghiep-13", "Nợ nghiệp 13 trong thần số học"],
  ["/than-so/so-kep/so-kep-23", "Số kép 23 thần số Chaldea"],
] as const) {
  test(`trang SEO-G: ${duong}`, async ({ request }) => {
    const r = await request.get(duong);
    expect(r.status()).toBe(200);
    const html = await r.text();
    expect(html).toMatch(new RegExp(`<h1[^>]*>${h1.replace(/[?]/g, "\\?")}`));
    expect(html).toContain("Trả lời nhanh");
    expect(html).toContain('data-testid="minh-hoa"');
    expect(html).toContain('"@type":"FAQPage"');
    expect((await request.get(`${duong}.md`)).status()).toBe(200);
  });
}

test("trang chủ đề, sitemap, cặp số chỉ có một chiều (a ≤ b)", async ({ request }) => {
  const cd = await (await request.get("/hop-doi/cap-so")).text();
  expect((cd.match(/href="\/hop-doi\/cap-so\/so-chu-dao-/g) ?? []).length).toBe(45);
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/than-so/nam-ca-nhan/nam-ca-nhan-9</loc>");
  expect(sm).toContain("/than-so/so-kep/so-kep-52</loc>");
  expect(sm).toContain("/xem-ngay-tot/thang-");
  expect((await request.get("/hop-doi/cap-so/so-chu-dao-6-va-3")).status()).toBe(404);
});
