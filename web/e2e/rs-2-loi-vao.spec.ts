import { expect, test } from "@playwright/test";

// RS-2 (2026-11-20): trang khó tìm có lối vào ở chỗ dễ thấy.
test("Nhân tướng: đầu trang có lối vào Chỉ tay và Đồ hình", async ({ page }) => {
  await page.goto("/nhan-tuong");
  const nav = page.getByTestId("nt-loi-vao");
  await expect(nav.getByRole("link", { name: /chỉ tay/i })).toHaveAttribute("href", "/chi-tay");
  await expect(nav.getByRole("link", { name: /Đồ hình/ })).toHaveAttribute("href", "/nhan-tuong/do-hinh");
});

test("Huyền học: khối 'Khi muốn đọc sâu hơn' dẫn tới Gói xem", async ({ page }) => {
  await page.goto("/huyen-hoc");
  const khoi = page.getByTestId("khoi-sau-hon");
  await expect(khoi.getByRole("link", { name: /Các gói xem/ })).toHaveAttribute("href", "/goi-xem");
});

test("Chân trang có 'Các gói xem'", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("footer").getByRole("link", { name: "Các gói xem" })).toHaveAttribute("href", "/goi-xem");
});
