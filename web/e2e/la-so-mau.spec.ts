// MAU6 — lá số minh hoạ đọc từng bước: mục lục → một lá → 7 bước, thuật ngữ bấm được, CTA lập lá số của mình.
import { test, expect } from "@playwright/test";

test("mục lục 6 lá → lá Mệnh vô chính diệu: lá số SVG, 7 bước, thuật ngữ, CTA", async ({ page }) => {
  await page.goto("/tu-vi/la-so-mau");
  await expect(page.getByTestId("ds-la-so-mau").getByRole("link")).toHaveCount(6);
  await page.getByRole("link", { name: /Mệnh vô chính diệu/ }).click();
  await expect(page).toHaveURL(/\/tu-vi\/la-so-mau\/menh-vo-chinh-dieu$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Mệnh vô chính diệu");
  await expect(page.getByTestId("la-so-mau").getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();
  const buoc = page.getByTestId("buoc-doc").locator(":scope > li");
  await expect(buoc).toHaveCount(7);
  await expect(buoc.nth(1)).toContainText("vô chính diệu");
  await expect(buoc.nth(3)).toContainText("Minh châu xuất hải");
  const nut = buoc.nth(0).locator("button[data-thuat-ngu]").first();
  await nut.click();
  await expect(buoc.nth(0).getByRole("tooltip")).toBeVisible();
  await page.getByTestId("cta-la-so").getByRole("link", { name: "Xem lá số của bạn" }).click();
  await expect(page).toHaveURL(/\/tu-vi$/);
});

test("slug lạ → 404; sitemap có lá số mẫu", async ({ page, request }) => {
  const r = await page.goto("/tu-vi/la-so-mau/khong-co");
  expect(r?.status()).toBe(404);
  const sm = await (await request.get("/sitemap.xml")).text();
  expect(sm).toContain("/tu-vi/la-so-mau/tu-phu-dong-cung");
});
