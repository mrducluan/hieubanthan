// Kinh Dịch (HH-1): gieo tay để kết quả tất định; không cần hồ sơ.
import { test, expect } from "@playwright/test";
import { hoi } from "./_hoso";

test("gieo tay: quẻ Lý biến Đoài, vẽ hai quẻ, lời đọc Nghĩa Lý", async ({ page }) => {
  await page.goto("/kinh-dich");
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  await page.getByLabel("Sáu hào tự gieo").fill("7 7 8 7 7 9");
  const ans = await hoi(page, "Tôi có nên nhận lời làm quản lý không?");
  await expect(ans).toContainText("Quẻ bản: Lý");
  await expect(ans).toContainText("Quẻ biến (xu hướng chuyển tới): Đoài");
  await expect(ans.getByTestId("que")).toContainText("Phái đọc: Nghĩa Lý");
  await expect(ans).toContainText("Mặt tối cần tránh");
  await expect(ans).toContainText("Nói nôm na: như làm việc với sếp khó tính");   // KD-NN: lời đời thường kèm quẻ Lý
  await expect(ans).toContainText("Nói nôm na: Như cuối năm nhìn lại hành trình");  // …và kèm hào động (Thượng Cửu)
});

test("máy gieo: luôn có quẻ và câu trả lời Lục Hào", async ({ page }) => {
  await page.goto("/kinh-dich");
  const ans = await hoi(page, "Hợp đồng này có ký được không?");
  await expect(ans).toContainText("Quẻ bản:");
  await expect(ans.getByTestId("que")).toContainText("Phái đọc: Lục Hào");
  await expect(ans).toContainText("dụng thần Phụ Mẫu");
});

test("không hào động: lời chủ là quái từ, kèm Thoán truyện dịch nghĩa", async ({ page }) => {
  await page.goto("/kinh-dich");
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  await page.getByLabel("Sáu hào tự gieo").fill("7 7 7 7 7 7");
  const ans = await hoi(page, "Tôi có nên nhận lời làm quản lý không?");
  await expect(ans).toContainText("Quẻ bản: Càn");
  await expect(ans).toContainText("Thoán truyện giảng: Lớn thay đức đầu mối của Càn!");
});
