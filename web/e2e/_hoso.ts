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
