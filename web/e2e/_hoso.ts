// Nạp sẵn hồ sơ trên máy (localStorage) cho các test mảng Huyền học.
import type { Page } from "@playwright/test";

export const HO_SO_MAU = {
  v: 1, ho_ten: "Nguyễn Đức Luân", ngay: 17, thang: 5, nam: 1990, gio: "12:30", gioi_tinh: "nam", noi_sinh: "ha-noi",
  tao_luc: "2026-09-30T00:00:00Z",
};

export async function napHoSo(page: Page, hoSo: object = HO_SO_MAU) {
  await page.addInitScript((h) => localStorage.setItem("hbt.hoso.v1", h), JSON.stringify(hoSo));
}

export async function hoi(page: Page, cau: string) {
  await page.getByRole("textbox", { name: /Câu hỏi/ }).fill(cau);
  await page.getByRole("button", { name: "Gửi câu hỏi" }).click();
  return page.getByTestId("cau-tra-loi").last();
}
