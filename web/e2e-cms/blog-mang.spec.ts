// UI-BLOG — /blog nhóm bài theo mảng Huyền học: thanh chủ đề (link thật + số bài), "Đọc theo chủ đề", trang chuyên đề
// /blog/mang/{slug} (CollectionPage, breadcrumb, sitemap), slug lạ → 404. CMS giả có 2 bài: thần số + "chung".
import { test, expect } from "@playwright/test";

test("/blog có thanh chủ đề + lưới Đọc theo chủ đề, mỗi ô dẫn tới trang chuyên đề", async ({ page }) => {
  await page.goto("/blog");
  const thanh = page.getByTestId("thanh-mang-blog");
  await expect(thanh.getByRole("link", { name: /Thần số học/ })).toHaveAttribute("href", "/blog/mang/than-so-hoc");
  await expect(thanh.getByRole("link", { name: /Hiểu bản thân/ })).toHaveAttribute("href", "/blog/mang/hieu-ban-than");
  const ke = page.getByTestId("ke-mang");
  await expect(ke).toHaveCount(2);
  // Mỗi bài chỉ MỘT link trên trang: bài đã ở khối mới nhất không lặp trong ô chủ đề.
  await expect(page.locator('a[href="/blog/than-so-hoc-la-gi"]')).toHaveCount(1);
  await expect(page.locator('[data-testid="ke-mang"][data-mang="than_so"]').getByRole("link", { name: /Chuyên đề Thần số học/ })).toBeVisible();
  // Không trang nào có hai H1; bài nổi bật đứng đầu.
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.getByTestId("bai-noi-bat")).toHaveCount(1);
});

test("trang chuyên đề: H1, breadcrumb JSON-LD, chỉ bài của mảng; slug lạ 404; sitemap có trang", async ({ page, request }) => {
  await page.goto("/blog/mang/than-so-hoc");
  await expect(page.locator("h1")).toHaveText("Blog Thần số học");
  await expect(page.getByTestId("luoi-bai").getByRole("link")).toHaveCount(1);
  const ld = (await page.locator('script[type="application/ld+json"]').allTextContents()).join("");
  expect(ld).toContain("CollectionPage");
  expect(ld).toContain("BreadcrumbList");
  expect((await request.get("/blog/mang/khong-co")).status()).toBe(404);
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/blog/mang/than-so-hoc");
});
