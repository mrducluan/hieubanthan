// SX-1 — "Sách xưa nói gì về lá số của bạn": engine chọn câu nguyên văn đã có trong kho tri thức ứng với lá số; web chỉ
// hiển thị. Lời Việt đứng trước, nguyên văn gập; hiện ngay cả khi "Lá số chi tiết" còn gập.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

test("Bát tự: khối sách xưa có câu về nhật chủ, mở được nguyên văn", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/bat-tu");
  const k = page.getByTestId("sach-xua");
  await expect(k.getByRole("heading", { name: "Sách xưa nói gì về lá số của bạn" })).toBeVisible();
  await expect(k).toContainText("Ngày sinh của bạn thuộc can Nhâm");
  await expect(k).toContainText("Sách ví Nhâm");
  await expect(page.getByTestId("tu-tru")).toHaveCount(0);                 // không cần mở lá số chi tiết
  await expect(k.getByTestId("sach-xua-han")).toHaveCount(0);
  await k.getByRole("button", { name: /Nguyên văn · Uyên Hải Tử Bình/ }).first().click();
  await expect(k.getByTestId("sach-xua-han")).toContainText("壬水");
  const n = await k.locator("ol > li").count();
  expect(n).toBeGreaterThanOrEqual(2);
  expect(n).toBeLessThanOrEqual(5);
});

test("Tử vi: khối sách xưa đứng sau cách cục", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  const k = page.getByTestId("sach-xua");
  await expect(k).toBeVisible();
  await expect(k).toContainText(/Lá số của bạn có cách|Cung .+ của bạn có sao/);
  await k.getByRole("button", { name: /Nguyên văn/ }).first().click();
  await expect(k.getByTestId("sach-xua-han")).toBeVisible();
});
