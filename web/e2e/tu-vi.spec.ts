// Tử vi (HH-2): trình duyệt → web → engine (iztro cục bộ).
import { test, expect } from "@playwright/test";

test("có lá số: đọc cung Quan Lộc, có cờ nguồn iztro", async ({ page }) => {
  await page.goto("/tu-vi");
  await page.getByLabel("Câu hỏi Tử vi").fill("Cung Quan Lộc của tôi nói gì về sự nghiệp?");
  await page.getByLabel("Ngày sinh").fill("1990-05-17");
  await page.getByLabel("Giờ sinh").fill("12:30");
  await page.getByRole("button", { name: "Hỏi" }).click();
  const kq = page.getByTestId("tv-ket-qua");
  await expect(kq).toContainText("Cung xem: Quan Lộc");
  await expect(kq).toContainText("Trong lá số của bạn");
  await expect(kq).toContainText("iztro");
});

test("câu hỏi chung không cần ngày sinh", async ({ page }) => {
  await page.goto("/tu-vi");
  await page.getByLabel("Câu hỏi Tử vi").fill("Tham Lang ở cung Quan Lộc có ý nghĩa gì?");
  await page.getByRole("button", { name: "Hỏi" }).click();
  await expect(page.getByTestId("tv-ket-qua")).toContainText("Tham Lang ở cung Quan Lộc");
});
