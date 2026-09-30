// Tử vi (HH-2): hồ sơ trên máy → lá số 12 cung (iztro) → hỏi.
import { test, expect } from "@playwright/test";
import { HO_SO_MAU, hoi, napHoSo } from "./_hoso";

test("có hồ sơ đủ giờ sinh: vẽ lá số, bấm cung để hỏi", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  const laSo = page.getByRole("list", { name: "Lá số Tử vi 12 cung" });
  await expect(laSo).toContainText("Thổ Ngũ Cục");
  await laSo.getByRole("listitem", { name: /^Cung Quan Lộc/ }).click();
  const ans = page.getByTestId("cau-tra-loi").last();
  await expect(ans).toContainText("Cung xem: Quan Lộc");
  await expect(ans).toContainText("Trong lá số của bạn");
});

test("không có hồ sơ: vẫn hỏi được câu kiến thức chung", async ({ page }) => {
  await page.goto("/tu-vi");
  await expect(page.getByRole("button", { name: "Tạo hồ sơ" })).toBeVisible();
  const ans = await hoi(page, "Tham Lang ở cung Quan Lộc có ý nghĩa gì?");
  await expect(ans).toContainText("Tham Lang ở cung Quan Lộc");
});

test("hồ sơ cũ thiếu nơi sinh: hỏi bổ sung đúng lúc → sinh ở nước ngoài, giờ mùa hè", async ({ page }) => {
  const { noi_sinh: _bo, ...cu } = HO_SO_MAU;
  await napHoSo(page, cu);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Thêm giờ sinh, giới tính, nơi sinh" }).click();
  const noi = page.getByLabel("Nơi sinh");
  await expect(noi.locator("option", { hasText: "Hà Nội" })).toHaveCount(1);
  await noi.selectOption("nuoc_ngoai");
  await page.getByLabel(/giờ mùa hè/).check();
  await page.getByRole("button", { name: "Lưu và xem" }).click();
  const laSo = page.getByRole("list", { name: "Lá số Tử vi 12 cung" });
  await expect(laSo).toBeVisible();
  await expect(page.getByText(/giờ địa phương nơi sinh/)).toBeVisible();
  await expect(page.getByText(/Đã trừ 1 giờ mùa hè: giờ chuẩn địa phương 11:30/)).toBeVisible();
});
