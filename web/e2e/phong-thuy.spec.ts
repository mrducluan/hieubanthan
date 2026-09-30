// Phong thuỷ (HH-4): trình duyệt → web → engine.
import { test, expect } from "@playwright/test";

test("hướng hợp tuổi từ ngày sinh", async ({ page }) => {
  await page.goto("/phong-thuy");
  await page.getByLabel("Câu hỏi Phong thuỷ").fill("Nhà hướng Tây Nam có hợp với tôi không?");
  await page.getByLabel("Ngày sinh").fill("1990-05-17");
  await page.getByRole("button", { name: "Hỏi" }).click();
  const kq = page.getByTestId("pt-ket-qua");
  await expect(kq).toContainText("Mệnh quái (cung phi) của bạn: Khảm");
  await expect(kq).toContainText("Tuyệt Mệnh");
});

test("bố trí dân gian ghi rõ nguồn", async ({ page }) => {
  await page.goto("/phong-thuy");
  await page.getByLabel("Câu hỏi Phong thuỷ").fill("Gương đối diện giường có sao không?");
  await page.getByRole("button", { name: "Hỏi" }).click();
  await expect(page.getByTestId("pt-ket-qua")).toContainText("quan niệm dân gian");
});
