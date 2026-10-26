// SAO-V (0025) — mời bạn hướng A + hoa hồng nạp Sao một tầng, phía web. e2e không có Supabase: ví Sao / nhận thưởng
// không chạy được ở đây (chuỗi thật: web/e2e-that/moi-ban-hoa-hong-that.spec.ts; quy tắc SQL:
// supabase/kiem_thu/thu_sao_viral_0025.sql). Ở đây kiểm: câu chữ điều kiện (hàm thuần), mức công khai, không hứa
// thưởng khi tài khoản chưa bật, sự kiện share_created mang co_ma, trang Nạp Sao + pháp lý nói đúng điều đã chốt.
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { dongThuongMoi, loiHoaHong, MUC_MAC_DINH, type MucSao } from "../lib/muc-sao";
import { locThuocTinh } from "../lib/do-luong";
import { NGAY_HIEU_LUC } from "../lib/van-hanh";

const suKien = (page: Page) => page.evaluate(() => (window as unknown as { __hbt_su_kien?: Record<string, unknown>[] }).__hbt_su_kien ?? []);
const muc = (m: Partial<MucSao> & { hh?: Partial<MucSao["hoa_hong"]> } = {}): MucSao =>
  ({ ...MUC_MAC_DINH, ...m, hoa_hong: { ...MUC_MAC_DINH.hoa_hong, ...(m.hh ?? {}) } });

test("thuần: câu điều kiện dưới nút chia sẻ theo mức đang đặt; hoa hồng chỉ nói khi bật", () => {
  expect(dongThuongMoi(muc())).toBe("Bạn bè lưu hồ sơ vào tài khoản: cả hai nhận 20 Sao.");
  expect(dongThuongMoi(muc({ hh: { bat: true } })))
    .toBe("Bạn bè lưu hồ sơ vào tài khoản: cả hai nhận 20 Sao, bạn nhận thêm 20% khi bạn ấy nạp Sao lần đầu.");
  expect(dongThuongMoi(muc({ hh: { bat: true, so_don: 2 } })))
    .toBe("Bạn bè lưu hồ sơ vào tài khoản: cả hai nhận 20 Sao, bạn nhận thêm 20% số Sao 2 lần nạp đầu của bạn ấy.");
  expect(dongThuongMoi(muc({ moi_ban: 30, duoc_moi: 10 }))).toBe("Bạn bè lưu hồ sơ vào tài khoản: bạn nhận 30 Sao, bạn ấy nhận 10 Sao.");
  expect(dongThuongMoi(muc({ moi_ban: 0, duoc_moi: 15 }))).toBe("Bạn bè lưu hồ sơ vào tài khoản: bạn ấy nhận 15 Sao.");
  expect(dongThuongMoi(muc({ moi_ban: 0, duoc_moi: 0 }))).toBe("");                       // không có thưởng → không hứa gì
  expect(dongThuongMoi(muc({ moi_ban: 0, duoc_moi: 0, hh: { bat: true, phan_tram: 10, so_don: 3 } })))
    .toBe("Bạn bè mở link này rồi nạp Sao: bạn nhận 10% số Sao 3 lần nạp đầu của bạn ấy.");
  expect(dongThuongMoi(muc({ hh: { bat: true, phan_tram: 0 } }))).not.toContain("%");     // 0% = coi như tắt
  expect(loiHoaHong(MUC_MAC_DINH.hoa_hong)).toBe("");
  expect(loiHoaHong({ bat: true, phan_tram: 20, so_don: 1, thang: 12 }))
    .toBe("Bạn nhận 20% số Sao lần nạp đầu của mỗi bạn bè bạn mời, trong 12 tháng kể từ lúc bạn ấy nhận lời mời.");
  // Không câu nào nói "7 ngày" (hướng A bỏ điều kiện tài khoản mới), không doạ / đếm ngược.
  for (const c of [dongThuongMoi(muc({ hh: { bat: true } })), loiHoaHong({ bat: true, phan_tram: 20, so_don: 2, thang: 6 })]) {
    expect(c).not.toMatch(/7 ngày|sắp hết|nhanh lên|chỉ còn/i);
  }
});

test("thuần: share_created giữ cờ co_ma (boolean), bỏ giá trị sai kiểu", () => {
  expect(locThuocTinh({ kind: "invite", co_ma: true })).toEqual({ kind: "invite", co_ma: true });
  expect(locThuocTinh({ kind: "invite", co_ma: false })).toEqual({ kind: "invite", co_ma: false });
  expect(locThuocTinh({ kind: "invite", co_ma: "1" })).toEqual({ kind: "invite" });
});

test("GET /api/sao/muc: mức công khai có hoa hồng (mặc định tắt), không có gì riêng của ai", async ({ request }) => {
  const r = await request.get("/api/sao/muc");
  expect(r.ok()).toBe(true);
  const j = await r.json();
  expect(j).toEqual({ moi_ban: 20, duoc_moi: 20, chao_mung: 10, tran: 20, hoa_hong: { bat: false, phan_tram: 20, so_don: 1, thang: 12 } });
});

test("tài khoản chưa bật: tạo link thẻ không hứa thưởng Sao; share_created có co_ma=false", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/chia-se");
  await page.getByRole("button", { name: "Tạo link thẻ" }).click();
  const link = await page.getByLabel("Link chia sẻ").inputValue();
  expect(link).not.toContain("gt=");
  await expect(page.getByTestId("dong-thuong-moi")).toHaveCount(0);
  expect(await suKien(page)).toContainEqual(expect.objectContaining({ su_kien: "share_created", kind: "card", co_ma: false }));
});

test("Nạp Sao: Sao mua không hết hạn + minh bạch lời mời (không trừ gì của người nạp)", async ({ page }) => {
  await page.goto("/nap-sao");
  await expect(page.getByTestId("sao-mua-khong-het-han")).toContainText("Sao mua không hết hạn.");
  await expect(page.getByTestId("sao-mua-khong-het-han")).toContainText("365 ngày");
  await expect(page.getByTestId("minh-bach-loi-moi"))
    .toContainText("Nếu bạn đến từ lời mời, người mời được thưởng Sao tặng — không trừ gì của bạn");
});

test("Điều khoản: mục Chương trình giới thiệu (một tầng, Sao không đổi tiền, thu hồi khi hoàn tiền, trần, gian lận) + ngày hiệu lực mới", async ({ page }) => {
  expect(NGAY_HIEU_LUC).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);   // ngày lấy từ code, không ghi cứng — đổi chính sách thì chỉ sửa lib/van-hanh.ts
  await page.goto("/dieu-khoan");
  const main = page.locator("main");
  await expect(main).toContainText(`Hiệu lực từ ${NGAY_HIEU_LUC}`);
  const khoi = main.locator("#gioi-thieu");
  await expect(khoi).toBeVisible();
  for (const chu of ["Một tầng", "Hoa hồng giới thiệu", "không trừ gì", "hoàn tiền thì hoa hồng của đơn đó được thu hồi",
    "không đổi ra tiền", "không chuyển", "Trần chống lạm dụng", "tạm dừng / chấm dứt chương trình", "Gian lận"]) {
    await expect(khoi).toContainText(chu);
  }
  await expect(main.locator("#sao")).toContainText("không bao giờ hết hạn");
  await expect(main.locator("#sao")).toContainText("365 ngày");
  await expect(main.getByRole("navigation", { name: "Mục lục" }).getByRole("link", { name: /Chương trình giới thiệu/ })).toBeVisible();
});

test("Chính sách quyền riêng tư: quan hệ mời, đơn nạp + hoa hồng, chuỗi ngày ghé, quà tặng chương", async ({ page }) => {
  await page.goto("/chinh-sach-rieng-tu");
  const du = page.locator("main #du-lieu");
  for (const chu of ["Quan hệ mời", "Đơn nạp Sao và hoa hồng giới thiệu", "không thấy bạn là ai, không thấy số tiền",
    "Chuỗi ngày ghé", "CHỈ ngày ghé cuối", "Quà tặng một chương"]) {
    await expect(du).toContainText(chu);
  }
  await expect(page.locator("main")).toContainText(`Hiệu lực từ ${NGAY_HIEU_LUC}`);
});
