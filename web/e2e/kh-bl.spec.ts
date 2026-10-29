// KH-BL (2026-10-29, docs/KE-HOACH-BACKLINK-VA-KHO-TRI-THUC.md) — P0 thực thể + trang Báo chí; đợt 1 kho tri thức:
// 30 nạp âm, 24 tiết khí, 12 con giáp năm 2027 (silo Bát tự, engine kb/trang_lich.py) + bảng giờ hoàng đạo.
import { test, expect } from "@playwright/test";

test("schema tổ chức có tên phụ hieuban.com và câu phân biệt; Giới thiệu có câu định nghĩa", async ({ request }) => {
  const html = await (await request.get("/gioi-thieu")).text();
  expect(html).toContain('data-testid="dinh-nghia-thuc-the"');
  expect(html).toContain('"alternateName":["Hiểu Bản Thân (hieuban.com)","hieuban.com","HieuBan"]');
  expect(html).toContain('"disambiguatingDescription"');
});

test("trang Báo chí: dữ kiện Tết từ engine, link bảng tra, có trong sitemap và chân trang", async ({ request }) => {
  const r = await request.get("/bao-chi");
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toMatch(/<h1[^>]*>Tư liệu báo chí/);
  expect(html).toContain('data-testid="du-kien-tet"');
  expect(html).toMatch(/href="\/tuoi-xong-dat\/20\d\d"/);
  expect(html).toContain('href="/bao-chi"');
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/bao-chi</loc>");
});

for (const [duong, h1, chu] of [
  ["/bat-tu/nap-am/thien-ha-thuy", "Thiên Hà Thủy là mệnh gì?", "06/02/2027"],
  ["/bat-tu/tiet-khi/lap-xuan", "Tiết Lập xuân (立春) là gì?", "08:46 ngày 04/02/2027"],
  ["/bat-tu/con-giap-nam/tuoi-mui-nam-2027", "Tuổi Mùi năm 2027 Đinh Mùi", "năm tuổi"],
  ["/bat-tu/con-giap-nam/tuoi-ti-nam-2027", "Tuổi Tỵ năm 2027 Đinh Mùi", "Tuổi Tỵ"],
] as const) {
  test(`trang kiến thức mới: ${duong}`, async ({ request }) => {
    const r = await request.get(duong);
    expect(r.status()).toBe(200);
    const html = await r.text();
    expect(html).toMatch(new RegExp(`<h1[^>]*>${h1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    expect(html).toContain("Trả lời nhanh");
    expect(html).toContain(chu);
    expect(html).toContain("<table");
    expect(html).toContain('data-testid="minh-hoa"');
    expect(html).toContain('"@type":"FAQPage"');
    expect((await request.get(`${duong}.md`)).status()).toBe(200);
  });
}

test("trang cụm mới, sitemap, slug lạ 404", async ({ request }) => {
  for (const [cum, n] of [["/bat-tu/nap-am", 30], ["/bat-tu/tiet-khi", 24], ["/bat-tu/con-giap-nam", 12]] as const) {
    const html = await (await request.get(cum)).text();
    const re = new RegExp(`href="${cum}/[a-z0-9-]+"`, "g");
    expect(new Set(html.match(re) ?? []).size).toBeGreaterThanOrEqual(n);
  }
  const sm = await (await request.get("/sitemap.xml")).text();
  for (const x of ["/bat-tu/nap-am/hai-trung-kim</loc>", "/bat-tu/tiet-khi/dong-chi</loc>", "/bat-tu/con-giap-nam/tuoi-hoi-nam-2027</loc>",
    "/xem-ngay-tot/gio-hoang-dao</loc>"]) expect(sm).toContain(x);
  expect((await request.get("/bat-tu/tiet-khi/khong-co")).status()).toBe(404);
});

test("giờ hoàng đạo: bảng 6 nhóm ngày, hôm nay, 12 thần, FAQ", async ({ request }) => {
  const r = await request.get("/xem-ngay-tot/gio-hoang-dao");
  expect(r.status()).toBe(200);
  const html = await r.text();
  expect(html).toMatch(/<h1[^>]*>Giờ hoàng đạo/);
  expect(html).toContain('data-testid="bang-gio-hoang-dao"');
  expect(html).toContain("Ngày Tý, Ngọ");
  expect(html).toContain('data-testid="gio-hom-nay"');
  expect(html).toContain("Thanh Long");
  expect(html).toContain('"@type":"FAQPage"');
});
