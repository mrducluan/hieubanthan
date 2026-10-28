// HD-CS — khung "Hỏi đáp chuyên sâu": câu trả lời trọn chiều ngang trên điện thoại + khối hình engine dựng (truc_quan).
import { expect, test } from "@playwright/test";
import { hoi, napHoSo } from "./_hoso";

test.describe("điện thoại 375px", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("Tử vi: tiêu đề mới, lời trả lời gần trọn chiều ngang, thang độ sáng bấm được", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/tu-vi");
    await expect(page.getByRole("heading", { name: "Hỏi đáp chuyên sâu" })).toBeVisible();
    await expect(page.getByText("Hỏi đáp cùng AI")).toHaveCount(0);
    const ans = await hoi(page, "Cung Mệnh của tôi nói gì về tính cách?");
    const hinh = ans.locator('figure[data-kieu="thang"]');
    await expect(hinh).toBeVisible();
    const rong = await ans.evaluate((el) => el.getBoundingClientRect().width);
    expect(rong).toBeGreaterThanOrEqual(330);          // trước đây ~255px (khung kính + avatar + bong bóng)
    await hinh.getByRole("button").first().click();
    await expect(hinh.locator("[aria-live] p")).toBeVisible();
    // Không tràn ngang trang.
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  });

  test("Bát tự: cột năm hành", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/bat-tu");
    await expect(page.getByRole("heading", { name: "Hỏi đáp chuyên sâu" })).toBeVisible();
    const ans = await hoi(page, "Tôi thiếu hành gì?");
    const cot = ans.locator('figure[data-kieu="cot"]');
    await expect(cot).toBeVisible();
    await expect(cot.getByRole("button")).toHaveCount(5);
  });

  test("Phong thuỷ: la bàn tám hướng", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/phong-thuy");
    const ans = await hoi(page, "Hướng nhà hợp tuổi tôi?");
    const lb = ans.locator('figure[data-kieu="la_ban"]');
    await expect(lb).toBeVisible();
    await lb.getByRole("button", { name: /^Đông Nam:/ }).click();
    await expect(lb.locator("[aria-live] p")).toContainText("Hợp dùng cho");
  });
});
