// GN — giải nghĩa thuật ngữ: gạch chân trong câu trả lời + khung giải nghĩa + trang Từ điển.
import { test, expect } from "@playwright/test";
import { hoi } from "./_hoso";

test("câu trả lời Tử vi gạch chân thuật ngữ, bấm ra lời giải nghĩa đời thường", async ({ page }) => {
  await page.goto("/tu-vi");
  const ans = await hoi(page, "Tham Lang ở cung Quan Lộc có ý nghĩa gì?");
  const nut = ans.locator('button[data-thuat-ngu="tham_lang"]');
  await expect(nut).toHaveCount(1);                       // chỉ gạch lần xuất hiện đầu
  await nut.click();
  const tip = ans.getByRole("tooltip");
  await expect(tip).toContainText("Tham Lang");
  await expect(tip.getByRole("link", { name: "Xem trong Từ điển" })).toHaveAttribute("href", "/tu-dien#tham_lang");
  await page.keyboard.press("Escape");
  await expect(tip).toHaveCount(0);
  const gn = ans.getByTestId("giai-nghia");
  await gn.locator("summary").click();
  await expect(gn).toContainText("Quan Lộc");
});

test("Bát tự: thuật ngữ Nhật chủ có giải nghĩa", async ({ page }) => {
  await page.goto("/bat-tu");
  const ans = await hoi(page, "Nhật chủ Giáp là người thế nào?");
  await expect(ans.locator('button[data-thuat-ngu="nhat_chu"]')).toBeVisible();
  await expect(ans.getByTestId("giai-nghia")).toContainText("Nhật chủ");
});

test("trang Từ điển: lọc theo chữ không dấu và theo mảng, neo #ma", async ({ page }) => {
  await page.goto("/tu-dien");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("textbox", { name: "Tìm thuật ngữ" }).fill("hoa ky");
  await expect(page.locator("#hoa_ky")).toBeVisible();
  await expect(page.locator("#tham_lang")).toBeHidden();
  await page.getByRole("textbox", { name: "Tìm thuật ngữ" }).fill("");
  await page.getByRole("radio", { name: "Kinh Dịch" }).click();
  await expect(page.locator("#tham_lang")).toBeHidden();
  await expect(page.locator("#nhat_chu")).toBeHidden();
  await page.goto("/tu-dien#nhat_chu");
  await expect(page.locator("#nhat_chu")).toBeInViewport();
});
