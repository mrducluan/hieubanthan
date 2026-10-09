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

test("QT-1: /quan-tri/tri-thuc và API xuất bản khi chưa bật tài khoản — không đọc, không ghi được gì", async ({ page, request }) => {
  await page.goto("/quan-tri/tri-thuc");
  await expect(page.getByTestId("qt-bao-cong")).toHaveAttribute("data-trang", "chua_bat");
  await expect(page.getByTestId("qt-tri-thuc")).toHaveCount(0);
  await page.goto("/quan-tri/tri-thuc/tuvi_kb");
  await expect(page.getByTestId("qt-bien-tap")).toHaveCount(0);

  const body = { tep: "tuvi_kb.json", sha: "0".repeat(40), sua: [{ duong: ["a"], cu: "x", moi: "y" }] };
  expect((await request.post("/api/quan-tri/tri-thuc", { data: body })).status()).toBe(403);            // thiếu Origin
  const r = await request.post("/api/quan-tri/tri-thuc", { data: body, headers: { origin: "http://localhost:3000" } });
  expect(r.status()).toBe(401);
  expect(r.headers()["x-robots-tag"]).toBe("noindex, nofollow");
});
