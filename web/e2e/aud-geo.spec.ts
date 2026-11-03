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

// AUD-Q5: câu "tập quán, không phải tiên đoán" ở trang năm, sinh con, sao hạn theo năm KHÔNG còn data-nosnippet.
for (const duong of ["/nam/2027", "/nam/2027/sinh-con", "/xem-sao-han/2027"]) {
  test(`câu tập quán được trích: ${duong}`, async ({ request }) => {
    const html = await (await request.get(duong)).text();
    const m = html.match(/<[a-z]+[^>]*data-testid="luu-y-tap-quan"[^>]*>/);
    expect(m, "có câu tập quán").not.toBeNull();
    expect(m![0]).not.toContain("data-nosnippet");
  });
}

// AUD-Q3: trang "ngày tốt {việc} tháng" có 0 ngày tốt → noindex + không có trong sitemap (mua xe tháng 1/2027: 0 ngày).
test("việc-tháng 0 ngày tốt: noindex, không vào sitemap", async ({ request }) => {
  const rong = await (await request.get("/xem-ngay-tot/mua-xe-thang-1-2027")).text();
  expect(rong).toMatch(/<meta name="robots" content="noindex/);
  const co = await (await request.get("/xem-ngay-tot/cuoi-hoi-thang-12-2026")).text();
  expect(co).not.toMatch(/<meta name="robots" content="noindex/);
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).not.toContain("/xem-ngay-tot/mua-xe-thang-1-2027<");
  expect(sm).toContain("/xem-ngay-tot/cuoi-hoi-thang-12-2026<");
});

// AUD-Q1: trang theo tuổi chỉ index MỘT năm — năm sắp tới (từ 11/2026: 2027; xông đất = Tết sắp tới). Năm đang qua noindex.
// (Mốc ngày thật: đúng tới khoảng 10/2027 — khi menu chuyển sang năm 2028 thì đổi năm trong test.)
test("trang tuổi: năm đang qua noindex, năm sắp tới index + có trong sitemap", async ({ request }) => {
  for (const d of ["/xem-tuoi-lam-nha/2026/tuoi-1990", "/nam/2026/tuoi-1990", "/tuoi-xong-dat/2026/tuoi-1990"]) {
    expect(await (await request.get(d)).text(), d).toMatch(/<meta name="robots" content="noindex/);
  }
  const sm = await (await request.get("/sitemap.xml")).text();
  for (const d of ["/xem-tuoi-lam-nha/2027/tuoi-1990", "/nam/2027/tuoi-1990", "/tuoi-xong-dat/2027/tuoi-1990"]) {
    expect(await (await request.get(d)).text(), d).not.toMatch(/<meta name="robots" content="noindex/);
    expect(sm, d).toContain(`${d}<`);
  }
  for (const d of ["/xem-tuoi-lam-nha/2026/tuoi-1990<", "/nam/2026/tuoi-1990<", "/tuoi-xong-dat/2026/tuoi-1990<"]) expect(sm).not.toContain(d);
});
