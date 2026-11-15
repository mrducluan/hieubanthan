// Chỉ tay (Thần Tướng Toàn Biên quyển 10): đồ hình tám cung bấm được, chọn vân → lời sách; thư viện render ở máy chủ.
import { expect, test } from "@playwright/test";

test("chỉ tay: đồ hình tám cung + chọn vân đọc sách xưa", async ({ page }) => {
  await page.goto("/chi-tay");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("chỉ tay");
  await expect(page.locator("[data-thanh-mang=nhantuong]:visible [aria-current]")).toContainText("Chỉ tay");
  const ly = page.locator("[data-testid=do-hinh-diem][data-id=ly]");
  await ly.focus();
  await expect(page.getByTestId("do-hinh-the")).toContainText("離");
  await page.locator("[data-testid=nut-van][data-ma=bai-tuong]").click();
  await page.locator("[data-testid=nut-van][data-ma=sac-duc]").click();
  await page.getByTestId("doc-van-tay").click();
  const kq = page.getByTestId("ket-qua-van-tay");
  await expect(kq).toContainText("拜相紋");
  // chưa có hồ sơ (không biết tuổi) → không hiện lời nhóm C
  await expect(kq).not.toContainText("色慾紋");
  await expect(kq).toContainText("đủ 18 tuổi");
});

test("chỉ tay: thư viện có trong HTML máy chủ, không tên nội bộ", async ({ request }) => {
  const html = await (await request.get("/chi-tay")).text();
  expect(html).toContain("拜相紋");
  expect(html).toContain("/anh/chi-tay/van/bai-tuong.webp");
  expect(html).not.toMatch(/SXQB|YLZ|sqlite|wikisource/i);
});
