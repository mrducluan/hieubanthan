// Nạp sẵn hồ sơ trên máy (localStorage) cho các test mảng Huyền học.
// ĐY-1: hồ sơ chỉ tồn tại khi người dùng đã đồng ý gửi ngày giờ sinh đi tính (`hbt.dong_y_dl.v1`) → napHoSo đặt luôn bản
// đồng ý hiện hành, nếu không form sửa hồ sơ sẽ hỏi lại và xem trước đổi lịch không chạy. Spec cần trạng thái "chưa đồng
// ý" thì không gọi helper này (hoặc xoá khoá trong test).
import type { Page } from "@playwright/test";
import { KHOA_DONG_Y_DL, PHIEN_BAN_DONG_Y } from "../lib/dong-y-du-lieu";

export const HO_SO_MAU = {
  v: 1, ho_ten: "Nguyễn Đức Luân", ngay: 17, thang: 5, nam: 1990, gio: "12:30", gioi_tinh: "nam", noi_sinh: "ha-noi",
  tao_luc: "2026-09-30T00:00:00Z",
};

export const DONG_Y_MAU = { phien_ban: PHIEN_BAN_DONG_Y, luc: "2026-09-30T00:00:00Z" };

/** Đặt sẵn đồng ý xử lý dữ liệu (không có hồ sơ) — cho test gõ form lần đầu mà vẫn muốn xem trước đổi lịch. */
export async function napDongY(page: Page) {
  await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [KHOA_DONG_Y_DL, JSON.stringify(DONG_Y_MAU)] as const);
}

export async function napHoSo(page: Page, hoSo: object = HO_SO_MAU) {
  await napDongY(page);
  await page.addInitScript((h) => localStorage.setItem("hbt.hoso.v1", h), JSON.stringify(hoSo));
}

export async function hoi(page: Page, cau: string) {
  await page.getByRole("textbox", { name: /Câu hỏi/ }).fill(cau);
  await page.getByRole("button", { name: "Gửi câu hỏi" }).click();
  return page.getByTestId("cau-tra-loi").last();
}

/** NS-QT: gõ nơi sinh nước ngoài vào ô gợi ý (`#<id>-tim`) rồi chọn gợi ý có tên `ten`. `id` = "hs" (form hồ sơ chính)
 *  hoặc id của form phụ ("ht"…). Engine tìm trong GeoNames nên mã lưu là "gn-<geonameid>". */
export async function chonNoiSinh(page: Page, id: string, go: string, ten: string) {
  const o = page.locator(`#${id}-tim`);
  await o.fill(go);
  const muc = page.getByTestId(`${id}-goi-y`).getByRole("option").filter({ hasText: ten }).first();
  await muc.waitFor({ timeout: 20_000 });
  await muc.click();
  await page.getByTestId(`${id}-noi-da-chon`).waitFor({ timeout: 10_000 });
}

/** PT-NHA: đặt sẵn hồ sơ nhà trên máy (như người dùng đã chốt hướng ở "Đo hướng nhà" + điền thẻ "Nhà của tôi"). Chỉ đặt khi
 *  máy chưa có — tải lại trang trong test không ghi đè thay đổi người dùng vừa làm. */
export async function napNha(page: Page, nha: Record<string, unknown>) {
  const hs = { v: 1, theo: "cua", thanh_vien: [], cap_nhat_luc: "2026-11-20T00:00:00.000Z", ...nha };
  await page.addInitScript((h) => { if (!localStorage.getItem("hbt.nha.v1")) localStorage.setItem("hbt.nha.v1", h); }, JSON.stringify(hs));
}

/** PT-NHA: chốt hướng nhà qua ô "nhập độ" của khối Đo hướng nhà (engine trả hướng → hồ sơ nhà → thẻ "Nhà của tôi" hiện). */
export async function chotHuong(page: Page, doHuong: number, nhanO = "Độ đo được", nhanNut = "Xem") {
  const o = page.getByTestId("do-huong");
  await o.getByLabel(nhanO).fill(String(doHuong));
  await o.getByRole("button", { name: nhanNut, exact: true }).click();
  await page.getByTestId("the-nha-cua-toi").waitFor({ timeout: 20_000 });
}
