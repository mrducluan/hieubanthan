// Kinh Dịch (HH-1): trình duyệt → web → engine; gieo tay để kết quả tất định.
import { test, expect } from "@playwright/test";

test("hỏi quẻ gieo tay: ra quẻ Lý biến Đoài, có lời đọc Nghĩa Lý", async ({ page }) => {
  await page.goto("/kinh-dich");
  await page.getByLabel("Câu hỏi Kinh Dịch").fill("Tôi có nên nhận lời làm quản lý không?");
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  await page.getByLabel("Sáu hào tự gieo").fill("7 7 8 7 7 9");
  await page.getByRole("button", { name: "Hỏi quẻ" }).click();
  const kq = page.getByTestId("kd-ket-qua");
  await expect(kq).toContainText("Quẻ bản: Lý");
  await expect(kq).toContainText("Quẻ biến (xu hướng chuyển tới): Đoài");
  await expect(kq).toContainText("Phái đọc: Nghĩa Lý");
  await expect(kq).toContainText("Mặt tối cần tránh");
});

test("máy gieo: luôn có quẻ và câu trả lời", async ({ page }) => {
  await page.goto("/kinh-dich");
  await page.getByLabel("Câu hỏi Kinh Dịch").fill("Hợp đồng này có ký được không?");
  await page.getByRole("button", { name: "Hỏi quẻ" }).click();
  const kq = page.getByTestId("kd-ket-qua");
  await expect(kq).toContainText("Quẻ bản:");
  await expect(kq).toContainText("Phái đọc: Lục Hào");
  await expect(kq).toContainText("dụng thần Phụ Mẫu");
});
