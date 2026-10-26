// Y5 — cụm "dấu hiệu nhà ở" /phong-thuy/dau-hieu/{slug}: 23 trang dựng từ KB (form Khảo sát nhà) + nội dung bổ sung SEO-M.
// HTML máy chủ có H1 dạng câu hỏi, trả lời nhanh, bảng việc theo chi phí, hình minh hoạ nền sáng, schema, bản .md, sitemap.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

for (const [duong, h1] of [
  ["/phong-thuy/dau-hieu/guong-doi-dien-giuong", "Gương đối diện giường có sao không?"],
  ["/phong-thuy/dau-hieu/nha-ve-sinh-o-giua-nha", "Nhà vệ sinh ở giữa nhà có sao không?"],
  ["/phong-thuy/dau-hieu/minh-duong", "Minh đường trong phong thuỷ: ý nghĩa và cách giữ"],
] as const) {
  test(`trang dấu hiệu: ${duong}`, async ({ request }) => {
    const r = await request.get(duong);
    expect(r.status()).toBe(200);
    const html = await r.text();
    expect(html).toMatch(new RegExp(`<h1[^>]*>${h1.replace(/[?]/g, "\\?")}`));
    expect(html).toContain("Trả lời nhanh");
    expect(html).toContain("Việc nên làm theo chi phí");
    expect(html).toContain("<table");
    expect(html).toContain('data-testid="minh-hoa"');
    expect(html).toContain("bg-[#f6f0e2]");                 // hình minh hoạ nền sáng
    expect(html).toContain("/og/y-chinh?loai=dau_hieu");
    expect(html).toContain('"@type":"FAQPage"');
    expect(html).toContain('href="/phong-thuy#khao-sat-nha"');
    expect((await request.get(`${duong}.md`)).status()).toBe(200);
  });
}

test("trang cụm, sitemap, slug lạ 404, ảnh tóm tắt nền sáng", async ({ request }) => {
  const cd = await (await request.get("/phong-thuy/dau-hieu")).text();
  expect((cd.match(/href="\/phong-thuy\/dau-hieu\/[a-z0-9-]+"/g) ?? []).length).toBeGreaterThanOrEqual(23);
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/phong-thuy/dau-hieu/giuong-ban-duoi-xa-ngang</loc>");
  expect((await request.get("/phong-thuy/dau-hieu/khong-co-trang")).status()).toBe(404);
  const anh = await request.get("/og/y-chinh?loai=dau_hieu&slug=guong-doi-dien-giuong");
  expect(anh.status()).toBe(200);
  expect(anh.headers()["content-type"]).toContain("image/png");
});

// Y4 — thẻ "Việc 0 đồng tuần này" ở Hôm nay: đọc dấu hiệu đã khai trong hồ sơ nhà trên máy; "Đã làm" → hàng đợi hỏi lại 30 ngày.
test("Hôm nay: Việc 0 đồng tuần này từ hồ sơ nhà, bấm Đã làm thì nhớ trên máy", async ({ page }) => {
  await napHoSo(page);
  await page.addInitScript(() => {
    localStorage.setItem("hbt.nha.v1", JSON.stringify({ v: 1, huong: "Nam", theo: "cua", thanh_vien: [],
      bo_cuc: { dau_hieu: ["guong_giuong", "xa_ngang"] }, cap_nhat_luc: new Date().toISOString() }));
  });
  await page.goto("/hom-nay");
  const the = page.getByTestId("viec-tuan");
  await expect(the).toContainText("Giường, bàn dưới xà ngang");        // còn dấu hiệu veto → ưu tiên veto
  await expect(the.getByRole("link", { name: "Vì sao nên làm →" })).toHaveAttribute("href", "/phong-thuy/dau-hieu/giuong-ban-duoi-xa-ngang");
  await the.getByTestId("viec-tuan-da-lam").click();
  await expect(the.getByTestId("viec-tuan-xong")).toBeVisible();
  const kc = await page.evaluate(() => localStorage.getItem("hbt.kc_sau.v1") ?? "");
  expect(kc).toContain("ds.phongthuy.viec_tuan.xa_ngang");
});

// 2026-10-26: hình minh hoạ trang kiến thức có dải link + mã QR về đúng trang (cả nền sáng lẫn nền Đêm sao).
for (const duong of ["/phong-thuy/dau-hieu/guong-doi-dien-giuong", "/than-so/y-nghia-so/so-7"]) {
  test(`hình minh hoạ có link + QR: ${duong}`, async ({ request }) => {
    const html = await (await request.get(duong)).text();
    const hinh = html.slice(html.indexOf('data-testid="minh-hoa"'), html.indexOf("</figure>", html.indexOf('data-testid="minh-hoa"')));
    expect(hinh).toContain('data-testid="minh-hoa-qr"');
    expect(hinh).toContain(`hieuban.com${duong}`);
    expect(hinh).toContain(`aria-label="Mã QR mở hieuban.com${duong}"`);
    expect(hinh).toContain(`href="${duong}"`);
  });
}

// Sau review: thẻ Việc tuần dùng đúng tập dấu hiệu của bài đọc — WC giữa nhà suy từ vị trí phòng (veto) được ưu tiên.
test("Hôm nay: Việc tuần tính cả dấu hiệu suy từ vị trí phòng (WC giữa nhà)", async ({ page }) => {
  await napHoSo(page);
  await page.addInitScript(() => {
    localStorage.setItem("hbt.nha.v1", JSON.stringify({ v: 1, huong: "Nam", theo: "cua", thanh_vien: [],
      bo_cuc: { vi_tri: { ve_sinh: "Trung cung" }, dau_hieu: ["guong_giuong"] }, cap_nhat_luc: new Date().toISOString() }));
  });
  await page.goto("/hom-nay");
  await expect(page.getByTestId("viec-tuan")).toContainText("Nhà vệ sinh ở giữa nhà");
});
