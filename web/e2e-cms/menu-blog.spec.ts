// Menu con của "Blog" ở thanh đầu trang = chuyên mục đang có bài trên CMS (nhiều bài trước), mô tả = mô tả chuyên mục
// (cắt ~60 ký tự) + số bài; bấm vào tới /blog/chuyen-muc/{slug} và mục cha "Blog" sáng. Chạy với CMS giả.
import { test, expect } from "@playwright/test";

test("Blog có menu con theo chuyên mục, nhiều bài trước, link đúng trang chuyên mục", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const nut = page.getByRole("button", { name: "Mở menu Blog" });
  await nut.click();
  const bang = page.locator("#" + (await nut.getAttribute("aria-controls"))!);
  const muc = bang.getByRole("link");
  await expect(muc).toHaveCount(2);
  await expect(muc.nth(0)).toContainText("Thần số học");
  await expect(muc.nth(0)).toContainText("2 bài viết");
  await expect(muc.nth(0)).toContainText("…");
  await expect(muc.nth(1)).toContainText("Hướng dẫn");
  await expect(muc.nth(1)).toContainText("1 bài viết");
  await expect(muc.nth(0)).toHaveAttribute("href", "/blog/chuyen-muc/than-so-hoc");
  await muc.nth(1).click();
  await expect(page).toHaveURL(/\/blog\/chuyen-muc\/huong-dan$/);
  await expect(page.locator("header nav").getByRole("link", { name: "Blog", exact: true })).toHaveAttribute("aria-current", "page");
});
