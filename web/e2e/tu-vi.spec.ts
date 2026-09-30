// Tử vi (HH-2): hồ sơ trên máy → lá số 12 cung (iztro) → hỏi.
import { test, expect } from "@playwright/test";
import { hoi, napHoSo } from "./_hoso";

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
