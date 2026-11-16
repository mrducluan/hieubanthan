// GIA-99 — trang /goi-xem (bảng giá + gói xem theo nhu cầu) và các hàm thuần của thang giá chim mồi.
import { expect, test } from "@playwright/test";
import { GOI_XEM, baCachTra, mocHoiVien } from "../lib/goi-xem";
import { CAI_DAT, giaTriHieuLuc } from "../lib/cau-hinh";
import { giaMoiLanXem, goiNangCap, tietKiemPhanTram } from "../lib/thanh-toan/nap-dau";
import { soBanCanMoi } from "../lib/loi-sao";
import { GOI_MAC_DINH } from "../lib/thanh-toan/cong";
import { mucSoTrang } from "../lib/so-trang";

const GOI = GOI_MAC_DINH.map((g) => ({ ...g }));
const g = (ma: string) => GOI.find((x) => x.ma === ma)!;

test("thang giá GIA-99: mặc định 99 Sao / 49 Sao / 5 Sao, giá riêng 0 = theo giá chung", () => {
  const md = (k: string) => giaTriHieuLuc(CAI_DAT.find((c) => c.khoa === k)!, {});
  expect(md("luan_giai.gia_sao")).toBe(99);
  expect(md("luan_giai.gia_sao.thanso")).toBe(49);
  expect(md("sao.hoi.gia")).toBe(5);
  for (const m of ["tuvi", "battu", "thoi_gian", "chan_dung"]) expect(md(`luan_giai.gia_sao.${m}`)).toBe(0);
  // Khoá SQL cũng đọc (hội viên, chuyên gia, thưởng mời) GIỮ mặc định cũ trong mã — giá mới đặt bằng cau_hinh
  // (supabase/bang-gia/2026-11_gia_99.sql) để web và SQL không bao giờ lệch nhau.
  expect(md("sao.hoi_vien.gia_vnd")).toBe(399000);
  expect(md("sao.chuyen_gia.gia_vnd")).toBe(199000);
  expect(md("sao.thuong.moi_ban")).toBe(20);
});

test("chim mồi là số thật: gói Hai không có ưu đãi, gói Ba rẻ hơn 17 %, đơn giá không tăng theo cỡ gói", () => {
  expect(GOI.map((x) => x.ma)).toEqual(["le_1", "doi_2", "ba_3", "ca_nha"]);
  expect(GOI.filter((x) => x.nhan).map((x) => x.ma)).toEqual(["ba_3"]);
  expect(tietKiemPhanTram(g("le_1"), GOI)).toBe(0);
  expect(tietKiemPhanTram(g("doi_2"), GOI)).toBe(0);          // 0,5 % — không khoe
  expect(tietKiemPhanTram(g("ba_3"), GOI)).toBe(17);
  expect(tietKiemPhanTram(g("ca_nha"), GOI)).toBe(20);
  const donGia = GOI.map((x) => x.gia_vnd / x.sao);
  for (let i = 1; i < donGia.length; i++) expect(donGia[i]!).toBeLessThanOrEqual(donGia[i - 1]!);
  expect(giaMoiLanXem(g("ba_3"), 99)).toBe(83000);
  expect(giaMoiLanXem(g("le_1"), 99)).toBe(99000);
  expect(giaMoiLanXem({ ...g("le_1"), sao: 50 }, 99)).toBeNull();
  // Hộp nạp: đang chọn gói lẻ / gói Hai → gợi ý đổi sang gói Ba với phần chênh thật; đang ở gói Ba / Cả nhà → không gợi ý.
  expect(goiNangCap(GOI, "le_1", 99)).toMatchObject({ goi: { ma: "ba_3" }, themVnd: 150000, baoCao: 3, moiLan: 83000 });
  expect(goiNangCap(GOI, "doi_2", 99)).toMatchObject({ goi: { ma: "ba_3" }, themVnd: 50000 });
  expect(goiNangCap(GOI, "ba_3", 99)).toBeNull();
  expect(goiNangCap(GOI, "ca_nha", 99)).toBeNull();
});

test("ba cách trả + mốc hội viên + lối miễn phí", () => {
  const { le, dich } = baCachTra(GOI, 99);
  expect(le).toMatchObject({ goi: { ma: "le_1" }, baoCao: 1 });
  expect(dich).toMatchObject({ goi: { ma: "ba_3" }, baoCao: 3, moiLan: 83000 });
  expect(mocHoiVien(599000, 99, GOI)).toBe(7);      // 6 báo cáo lẻ = 594.000 ₫ < 599.000 ₫ → từ báo cáo thứ 7
  expect(mocHoiVien(0, 99, GOI)).toBeNull();
  expect(soBanCanMoi(99 - 10, 33)).toBe(3);         // 10 chào mừng + 3 bạn × 33 = 109 ≥ 99
  expect(soBanCanMoi(49 - 10, 33)).toBe(2);
});

test("danh mục gói xem: mỗi gói trỏ trang có thật trong site, lời không doạ, không hứa", () => {
  expect(GOI_XEM.length).toBeGreaterThanOrEqual(8);
  expect(new Set(GOI_XEM.map((x) => x.ma)).size).toBe(GOI_XEM.length);
  for (const x of GOI_XEM) {
    expect(x.duong.startsWith("/")).toBe(true);
    expect(mucSoTrang(x.duong.split("#")[0]!), x.duong).toBeTruthy();
    const chu = [x.ten, x.hoi, ...x.nhan, x.can, x.nut].join(" ").toLowerCase();
    for (const cam of ["hạn nặng", "tai hoạ", "đại hạn", "chắc chắn", "cam kết", "chính xác 100", "duy nhất hôm nay", "chỉ còn"]) expect(chu).not.toContain(cam);
  }
  expect(GOI_XEM.filter((x) => x.maGia).map((x) => x.maGia)).toEqual(["thoi_gian", "tuvi", "battu", "thanso", "chan_dung"]);
});

test("/goi-xem: chưa thu Sao → mọi gói ghi miễn phí, KHÔNG bày giá, không bảng ba cách trả; có FAQ + JSON-LD + trong sitemap", async ({ page, request }) => {
  await page.goto("/goi-xem");
  await expect(page.locator("h1")).toHaveText("Gói xem luận giải: chọn theo điều bạn đang cần biết");
  await expect(page.getByTestId("goi-xem-mien-phi")).toBeVisible();
  await expect(page.getByTestId("ds-goi-xem").locator("li.glass")).toHaveCount(GOI_XEM.length);
  await expect(page.getByTestId("goi-xem-tu_vi").getByTestId("gia-goi-xem")).toHaveText("Đang miễn phí");
  await expect(page.getByTestId("goi-xem-nha").getByTestId("gia-goi-xem")).toHaveText("Miễn phí");
  await expect(page.getByTestId("goi-xem-tu_vi").getByRole("link")).toHaveAttribute("href", "/tu-vi");
  await expect(page.getByTestId("ba-cach-tra")).toHaveCount(0);
  await expect(page.getByTestId("loi-mien-phi")).toHaveCount(0);
  await expect(page.getByTestId("ds-goi-xem")).not.toContainText("Sao");
  const than = (await page.locator("main").innerText()).toLowerCase();
  for (const cam of ["giá gốc", "chỉ còn", "hôm nay duy nhất", "sắp hết"]) expect(than).not.toContain(cam);
  expect(await page.locator('script[type="application/ld+json"]').allTextContents()).toEqual(expect.arrayContaining([expect.stringContaining("FAQPage")]));
  await expect(page.locator('meta[name="robots"]')).not.toHaveAttribute("content", /noindex/);
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/goi-xem</loc>");
});
