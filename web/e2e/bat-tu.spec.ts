// Bát tự (HH-3): trình duyệt → web → engine.
import { test, expect } from "@playwright/test";

test("có ngày giờ sinh: tứ trụ + dụng thần hai cách", async ({ page }) => {
  await page.goto("/bat-tu");
  await page.getByLabel("Câu hỏi Bát tự").fill("Dụng thần của tôi là gì?");
  await page.getByLabel("Ngày sinh").fill("1990-05-17");
  await page.getByLabel("Giờ sinh").fill("12:30");
  await page.getByRole("button", { name: "Hỏi" }).click();
  const kq = page.getByTestId("bt-ket-qua");
  await expect(kq).toContainText("Canh Ngọ · Tân Tỵ · Nhâm Ngọ · Bính Ngọ");
  await expect(kq).toContainText("không tự chọn");
});

test("câu hỏi chung về nhật chủ không cần ngày sinh", async ({ page }) => {
  await page.goto("/bat-tu");
  await page.getByLabel("Câu hỏi Bát tự").fill("Nhật chủ Giáp là người thế nào?");
  await page.getByRole("button", { name: "Hỏi" }).click();
  await expect(page.getByTestId("bt-ket-qua")).toContainText("cây đại thụ");
});
