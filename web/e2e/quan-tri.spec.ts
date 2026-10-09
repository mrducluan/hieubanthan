// QT-0: trang quản trị. CI không có Supabase → cổng báo "chưa bật", không lộ gì, không bao giờ được index.
import { test, expect } from "@playwright/test";

test("/quan-tri khi chưa bật tài khoản: báo gọn, noindex, không cache", async ({ page }) => {
  const res = await page.goto("/quan-tri");
  expect(res?.headers()["x-robots-tag"]).toBe("noindex, nofollow");
  expect(res?.headers()["cache-control"]).toContain("no-store");
  await expect(page.getByTestId("qt-bao-cong")).toHaveAttribute("data-trang", "chua_bat");
  await expect(page.getByRole("heading", { name: "Tài khoản chưa được bật" })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByTestId("qt-tong-quan")).toHaveCount(0);
});

test("/quan-tri/xac-thuc khi chưa bật tài khoản: cùng lời báo, không hiện bước MFA", async ({ page }) => {
  await page.goto("/quan-tri/xac-thuc");
  await expect(page.getByTestId("qt-bao-cong")).toHaveAttribute("data-trang", "chua_bat");
  await expect(page.getByTestId("qt-xac-thuc")).toHaveCount(0);
});

test("robots.txt chặn /quan-tri; trang khác không bị gắn noindex của quản trị", async ({ page, request }) => {
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /quan-tri");
  const res = await page.goto("/gioi-thieu");
  expect(res?.headers()["x-robots-tag"]).toBeUndefined();
});
