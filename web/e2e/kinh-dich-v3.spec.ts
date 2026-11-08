// KD-V3 (UI): bấm câu gợi ý → ĐIỀN vào ô (không gửi); gõ câu → engine tự nhận chủ đề + kiểu câu (dòng "Bạn đang hỏi về…",
// chip tự sáng), chip chọn tay thắng; câu người ấy chưa rõ giới → hỏi làm rõ NGAY dưới ô trước khi gieo; bài đọc có hộp
// "Phía …" và nhãn xu hướng hào làm chủ. Engine thật (gieo tay để tất định).
import { test, expect } from "@playwright/test";
import { hoi } from "./_hoso";

test("câu gợi ý điền vào ô, chưa gửi; gõ câu → chủ đề tự nhận; chip chọn tay thắng", async ({ page }) => {
  await page.goto("/kinh-dich");
  const o = page.getByRole("textbox", { name: /Câu hỏi/ });
  await page.getByLabel("Câu hỏi gợi ý").getByRole("button").first().click();
  await expect(o).toHaveValue("Tôi có nên nhận lời làm quản lý không?");
  await expect(page.getByTestId("cau-hoi-ban")).toHaveCount(0);                      // không tự gửi
  const tn = page.getByTestId("tu-nhan");
  await expect(tn).toContainText("Thăng tiến, phỏng vấn, đề bạt", { timeout: 15_000 });
  await expect(tn).toContainText("có nên");
  await expect(page.getByTestId("chip-chu-de").getByRole("button", { name: "Thăng tiến, phỏng vấn, đề bạt" })).toHaveAttribute("aria-pressed", "true");
  await o.fill("Con tôi năm nay thi đại học có đậu không?");
  await expect(tn).toContainText("Thi cử, học hành", { timeout: 15_000 });
  await expect(tn).toContainText("có thành không");
  await page.getByTestId("chip-chu-de").getByRole("button", { name: "Con cái" }).click();
  await expect(tn).toContainText("Con cái");
  await expect(tn).not.toContainText("tự nhận");
});

test("người ấy chưa rõ giới → hỏi làm rõ trước khi gieo; anh ấy → tự chọn, bài đọc có 'Phía người ấy' + xu hướng hào", async ({ page }) => {
  await page.goto("/kinh-dich");
  const o = page.getByRole("textbox", { name: /Câu hỏi/ });
  await o.fill("Người ấy có thật lòng với tôi không?");
  const lr = page.getByTestId("lam-ro-truoc");
  await expect(lr).toBeVisible({ timeout: 15_000 });
  await lr.getByRole("button", { name: "Người ấy là nam" }).click();
  await expect(page.getByTestId("tu-nhan")).toContainText("người ấy là nam");
  await page.getByLabel("Cách ra quẻ").selectOption("gieo_tay");
  await page.getByLabel("Sáu hào tự gieo").fill("7 8 9 8 7 8");
  const ans = await hoi(page, "Anh ấy có thật lòng với tôi không?");
  const dq = ans.getByTestId("doc-que");
  await expect(dq).toBeVisible();
  await expect(dq.getByTestId("xu-huong-hao")).toContainText("Lời hào làm chủ");
  await expect(dq.getByTestId("hop-noi-bat").filter({ hasText: "Phía người ấy" })).toHaveCount(1);
  await expect(ans).toContainText("người ấy");
});
