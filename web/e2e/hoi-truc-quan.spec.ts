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

  test("Tử vi hướng C: bàn 12 cung, Xem trên lá số, Hỏi tiếp, Các câu đã hỏi", async ({ page }) => {
    await napHoSo(page);
    await page.goto("/tu-vi");
    const ans = await hoi(page, "Công việc của tôi có tốt không?");
    const ban = ans.locator('figure[data-kieu="cung"]');
    await expect(ban).toBeVisible();
    await expect(ban.locator('[data-vai="hoi"]')).toHaveCount(1);
    await expect(ban.locator('[data-vai="tam_hop"]')).toHaveCount(2);
    await expect(ban.locator('[data-vai="hoi"]')).toContainText("Quan Lộc");
    await ban.getByRole("button", { name: "Xem trên lá số" }).click();
    await expect(page.getByRole("heading", { name: /Cung Quan Lộc/ })).toBeVisible();
    const tiep = ans.getByTestId("hoi-tiep-chung");
    await expect(tiep.getByRole("button")).toHaveCount(3);
    await tiep.getByRole("button", { name: "Tiền bạc của tôi thế nào?" }).click();
    await expect(page.getByTestId("cau-tra-loi")).toHaveCount(2);
    const da = page.getByTestId("cau-da-hoi");
    await expect(da.getByRole("link")).toHaveCount(2);
    await expect(da).toContainText("Công việc của tôi có tốt không?");
    // Hỏi tiếp của câu thứ hai không gợi lại câu đã hỏi.
    const tiep2 = page.getByTestId("cau-tra-loi").nth(1).getByTestId("hoi-tiep-chung");
    await expect(tiep2.getByRole("button")).toHaveCount(2);
    await expect(tiep2).not.toContainText("Công việc của tôi có tốt không?");
  });
});
