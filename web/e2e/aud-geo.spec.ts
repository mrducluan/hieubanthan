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

// AUD-P0: llms.txt gọn (≤ 15 KB, bot trả lời không đọc hết bản dài), có mục mùa Tết, ví dụ trỏ trang đang index.
test("llms.txt gọn, có mùa Tết, mỗi cụm một dòng mục lục + ví dụ", async ({ request }) => {
  const t = await (await request.get("/llms.txt")).text();
  expect(Buffer.byteLength(t, "utf8")).toBeLessThanOrEqual(15_000);
  expect(t).toMatch(/## Mùa Tết — năm \d{4}/);
  expect(t).toMatch(/\/nam\/\d{4}\/tuoi-1990\)/);
  expect(t).toContain("/thoi-gian-toi");
  expect(t).toContain("/than-so/y-nghia-so/so-7)");
  expect((t.match(/\]\(https?:\/\/[^)]+\/tu-vi\/sao-o-cung\/[a-z-]+\)/g) ?? []).length).toBeLessThanOrEqual(3);
  expect(t).toContain("## Thư viện kiến thức");
});

// AUD-P1: trang theo tuổi bỏ dữ kiện chung của năm (bàn 9 cung, mùng 1 đầy đủ, lời giải thích sao) và có dữ kiện RIÊNG
// của tuổi: 10 năm tới làm nhà, các Tết tới xông đất, 10 năm tới theo tuổi.
test("trang tuổi: dữ kiện riêng của tuổi, phần chung của năm chỉ còn link", async ({ request }) => {
  const ln = await (await request.get("/xem-tuoi-lam-nha/2027/tuoi-1990")).text();
  expect((ln.match(/data-testid="muoi-nam"/g) ?? []).length).toBe(1);
  expect(ln).toContain('href="/xem-tuoi-lam-nha/2036/tuoi-1990"');            // dòng cuối của 10 năm
  expect(ln).not.toContain('data-testid="han-nam"');                           // không bàn 9 cung
  expect(ln).toContain('href="/xem-tuoi-lam-nha/2027"');                       // cách tính → bảng năm
  const xd = await (await request.get("/tuoi-xong-dat/2027/tuoi-1990")).text();
  expect(xd).toContain('data-testid="tet-toi"');
  expect(xd).toContain('href="/tuoi-xong-dat/2031/tuoi-1990"');
  const nt = await (await request.get("/nam/2027/tuoi-1990")).text();
  expect(nt).toContain('data-testid="nam-toi"');
  expect(nt).toContain('href="/nam/2037/tuoi-1990"');
  expect(nt).toMatch(/href="\/xem-sao-han\/2027#sao-tho-tu"/);                 // sao gọn → trang sao hạn năm
});

// Rà soát 2026-11-03: cặp số gõ ngược thứ tự → 308 về bản a ≤ b (trước 404).
test("cặp số ngược thứ tự 308 về bản đúng", async ({ request }) => {
  const r = await request.get("/hop-doi/cap-so/so-chu-dao-7-va-2", { maxRedirects: 0 });
  expect(r.status()).toBe(308);
  expect(new URL(r.headers()["location"]!, "http://x").pathname).toBe("/hop-doi/cap-so/so-chu-dao-2-va-7");
});

// Rà soát 2026-11-03: bảng sao hạn có neo từng tuổi; lời mời cuối trang kiến thức theo loại trang + không trích; llms URL bọc.
test("neo tuổi sao hạn, lời mời theo loại trang, llms URL không dính dấu câu", async ({ request }) => {
  expect(await (await request.get("/xem-sao-han/2027")).text()).toContain('id="tuoi-1990"');
  const sc = await (await request.get("/tu-vi/sao-o-cung/thai-duong-cung-phu-the")).text();
  expect(sc).toContain("Trên lá số của bạn, sao này nằm ở cung nào");
  expect(sc).toMatch(/data-nosnippet="">[^]*?Trên lá số của bạn/);
  const llms = await (await request.get("/llms.txt")).text();
  expect(llms).not.toMatch(/(^|[^`])https?:\/\/[^\s`]*\{/m);   // mẫu có {…} luôn nằm trong `…`
  expect(llms).not.toMatch(/[^(<`]https?:\/\/[^\s<>`()]+[;:]\s/);   // URL trần không dính ; :
});
