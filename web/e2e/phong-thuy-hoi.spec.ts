import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

test("Hỏi gì xem nấy: chọn intent, bật/tắt Bạch thoại, mở Vì sao & trạng thái Đang hoàn thiện", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/phong-thuy");

  const box = page.getByTestId("hoi-gi-xem-nay");
  await expect(box).toBeVisible();
  await expect(page.getByTestId("hoi-gi-lazy-intake")).toBeVisible();

  await page.getByTestId("hoi-gi-intent-bo_cuc").click();
  await expect(page.getByTestId("hoi-gi-ket-qua")).toContainText("Veto");

  const viSao = page.getByTestId("hoi-gi-vi-sao");
  await viSao.locator("summary").click();
  await expect(viSao).toContainText("Táng Thư");

  await page.getByTestId("hoi-gi-bach-thoai").click();
  await expect(viSao).toContainText("dau_hieu_veto");

  await page.getByTestId("hoi-gi-intent-mo_quan").click();
  await expect(page.getByTestId("hoi-gi-ket-qua")).toContainText("đang hoàn thiện");
});

test("Hỏi gì xem nấy: mobile 375px & reduced-motion không tràn ngang", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 375, height: 812 });
  await napHoSo(page);
  await page.goto("/phong-thuy");

  const box = page.getByTestId("hoi-gi-xem-nay");
  await expect(box).toBeVisible();
  const rect = await box.boundingBox();
  expect(rect?.width ?? 999).toBeLessThanOrEqual(375);
});

test("Hỏi gì xem nấy: bản tiếng Anh /en/feng-shui", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/en/feng-shui");
  await expect(page.getByTestId("hoi-gi-xem-nay")).toContainText("What do you want to check about this home?");
  await page.getByTestId("hoi-gi-intent-mo_quan").click();
  await expect(page.getByTestId("hoi-gi-intent-mo_quan")).toContainText("In progress");
  await expect(page.getByTestId("hoi-gi-ket-qua")).toContainText("being finalized");
});
