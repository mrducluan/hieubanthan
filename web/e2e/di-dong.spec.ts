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

test("Tử vi: lá số mặc định vừa màn hình (gợi ý đặt TRÊN lá số), Phóng to để vuốt; chạm cung → chi tiết vào tầm mắt", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  const laSo = page.getByRole("group", { name: /Lá số Tử vi/ });
  await expect(laSo).toBeVisible();
  // Trục 1 (báo cáo UX mục 1): mặc định toàn cảnh — SVG nằm gọn trong 375px, không cắt chữ khung giữa.
  const svg = page.getByTestId("la-so-tu-vi").locator("svg").first();
  expect(await svg.evaluate((e) => e.getBoundingClientRect().right)).toBeLessThanOrEqual(375);
  const dk = page.getByTestId("la-so-dieu-khien");
  await expect(dk).toBeVisible();
  expect((await dk.boundingBox())!.y).toBeLessThan((await svg.boundingBox())!.y);     // gợi ý + nút nằm trên lá số
  const nut = dk.getByRole("button", { name: "Phóng to" });
  await expect(nut).toHaveAttribute("aria-pressed", "false");

  await laSo.getByRole("button", { name: /^Cung Quan Lộc/ }).tap();
  await expect(page.getByRole("heading", { name: /Cung Quan Lộc/ })).toBeInViewport();

  await dk.scrollIntoViewIfNeeded();
  await nut.tap();
  await expect(dk.getByRole("button", { name: "Thu vừa màn hình" })).toHaveAttribute("aria-pressed", "true");
  expect(await svg.evaluate((e) => e.getBoundingClientRect().width)).toBeGreaterThanOrEqual(700);
  await expect(dk).toContainText("Vuốt ngang");
  // Trang không tràn ngang: chỉ khung lá số cuộn.
  const tran = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(tran).toBeLessThanOrEqual(0);
  await dk.getByRole("button", { name: "Thu vừa màn hình" }).tap();
  expect(await svg.evaluate((e) => e.getBoundingClientRect().right)).toBeLessThanOrEqual(375);
});
