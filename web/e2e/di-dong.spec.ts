// Điện thoại 375px: không trang nào tràn ngang; lá số Tử vi chạm cung → chi tiết hiện trong tầm mắt.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

test.use({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });

for (const duong of ["/", "/than-so", "/tu-vi", "/bat-tu", "/phong-thuy", "/kinh-dich", "/kham-pha", "/chinh-sach-rieng-tu", "/gioi-thieu"]) {
  test(`không tràn ngang: ${duong}`, async ({ page }) => {
    await napHoSo(page);
    await page.goto(duong);
    await page.waitForLoadState("networkidle");
    const tran = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(tran).toBeLessThanOrEqual(0);
  });
}

test("Tử vi: chạm cung → chi tiết cuộn vào tầm mắt; Toàn cảnh thu lá số vừa màn hình", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  const laSo = page.getByRole("group", { name: /Lá số Tử vi/ });
  await expect(laSo).toBeVisible();
  await laSo.getByRole("button", { name: /^Cung Quan Lộc/ }).tap();
  await expect(page.getByRole("heading", { name: /Cung Quan Lộc/ })).toBeInViewport();

  await page.getByRole("button", { name: "Toàn cảnh" }).tap();
  const rong = await page.getByTestId("la-so-tu-vi").locator("svg").first().evaluate((e) => e.getBoundingClientRect().right);
  expect(rong).toBeLessThanOrEqual(375);
  await expect(page.getByRole("button", { name: "Phóng to" })).toHaveAttribute("aria-pressed", "true");
});
