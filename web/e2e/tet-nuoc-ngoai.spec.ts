// QTE-1 tuần 2 — "Tết ở nước ngoài": mục lục + trang từng nước (Mỹ, Nhật, Úc, Canada), giờ giao thừa Việt Nam quy ra giờ
// địa phương do engine tính, sitemap có trang, nước lạ 404.
import { test, expect } from "@playwright/test";

test("mục lục có 4 nước, trang Mỹ có trả lời nhanh + bảng giờ + hỏi đáp + breadcrumb", async ({ page }) => {
  await page.goto("/tet-o-nuoc-ngoai");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByTestId("ds-tet-nuoc").getByRole("link")).toHaveCount(4);
  await page.getByTestId("ds-tet-nuoc").getByRole("link", { name: /ở Mỹ/ }).click();
  await expect(page).toHaveURL(/\/tet-o-nuoc-ngoai\/my$/);
  await expect(page.locator("h1")).toContainText("ở Mỹ");
  await expect(page.getByTestId("tra-loi-nhanh")).toContainText(/Tết Nguyên đán \d{4}/);
  const bang = page.getByTestId("bang-gio-giao-thua");
  await expect(bang.getByRole("row")).toHaveCount(9);          // tiêu đề + 8 múi giờ của Mỹ trong danh mục
  await expect(bang).toContainText("California");
  const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("");
  expect(ld).toContain("BreadcrumbList");
  expect(ld).toContain("FAQPage");
});

test("nước lạ 404; sitemap có các trang Tết ở nước ngoài", async ({ request }) => {
  expect((await request.get("/tet-o-nuoc-ngoai/phap")).status()).toBe(404);
  const sm = await (await request.get("/sitemap.xml")).text();
  for (const s of ["", "/my", "/nhat-ban", "/uc", "/canada"]) expect(sm).toContain(`/tet-o-nuoc-ngoai${s}<`);
});
