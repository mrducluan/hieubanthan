// Bát tự (HH-3): hồ sơ → tứ trụ + ngũ hành + dụng thần hai cách → hỏi.
import { test, expect } from "@playwright/test";
import { hoi, napHoSo } from "./_hoso";

test("tứ trụ từ hồ sơ + dụng thần hai cách", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/bat-tu");
  const tt = page.getByTestId("tu-tru");
  await expect(tt).toContainText("Nhâm");
  await expect(tt).toContainText("Dụng thần · Phù ức");
  await expect(tt).toContainText("Dụng thần · Điều hậu");
  const ans = await hoi(page, "Dụng thần của tôi là gì?");
  await expect(ans).toContainText("Canh Ngọ · Tân Tỵ · Nhâm Ngọ · Bính Ngọ");
  await expect(ans).toContainText("không tự chọn");
});

test("câu hỏi chung về nhật chủ không cần hồ sơ", async ({ page }) => {
  await page.goto("/bat-tu");
  const ans = await hoi(page, "Nhật chủ Giáp là người thế nào?");
  await expect(ans).toContainText("cây đại thụ");
});
