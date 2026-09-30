// UI-4: không có Supabase (CI) → tài khoản ẩn gọn, hồ sơ trên máy vẫn sửa/xoá được.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

test("tài khoản chưa bật: hiện hồ sơ trên máy, xoá khỏi máy được", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tai-khoan");
  await expect(page.getByTestId("ho-so-may")).toContainText("Nguyễn Đức Luân · 17/05/1990 · 12:30");
  await expect(page.getByTestId("tk-chua-bat")).toBeVisible();
  await page.getByRole("button", { name: "Xoá khỏi máy" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Xoá", exact: true }).click();
  await expect(page.getByTestId("ho-so-may")).toContainText("Tạo hồ sơ");
  expect(await page.evaluate(() => localStorage.getItem("hbt.hoso.v1"))).toBeNull();
});

test("đăng nhập khi chưa bật tài khoản: báo gọn, không lỗi", async ({ page }) => {
  await page.goto("/dang-nhap");
  await expect(page.getByRole("heading", { name: "Tài khoản đang được chuẩn bị" })).toBeVisible();
});
