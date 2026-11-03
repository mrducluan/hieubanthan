// AUD-1 (kiểm toán SEO/GEO 2026-11): trang kiến thức đặt "Trả lời nhanh" ngay dưới tiêu đề — TRƯỚC hình minh hoạ + dải QR —
// và khối lặp mọi trang (dải QR, khung tác giả) mang data-nosnippet để đoạn trích Google / câu AI trích là câu trả lời,
// không phải "Quét để mở bài này" hay tiểu sử chủ biên.
import { test, expect } from "@playwright/test";

for (const duong of ["/tu-vi/sao-o-cung/tu-vi-cung-menh", "/kinh-dich/que/que-1-can", "/than-so/y-nghia-so/so-7"]) {
  test(`trả lời nhanh trước hình, khối lặp không trích: ${duong}`, async ({ request }) => {
    const r = await request.get(duong);
    expect(r.status()).toBe(200);
    const html = await r.text();
    const tln = html.indexOf('aria-label="Trả lời nhanh"');
    const hinh = html.indexOf('data-testid="minh-hoa"');
    expect(tln).toBeGreaterThan(0);
    if (hinh > 0) expect(tln).toBeLessThan(hinh);
    expect(html).toMatch(/data-testid="minh-hoa-qr" data-nosnippet=""/);
    expect(html).toMatch(/data-dong-tac-gia="[^"]*" data-nosnippet=""/);
  });
}
