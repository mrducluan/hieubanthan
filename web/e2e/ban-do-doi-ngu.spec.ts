// E2E cho bộ 3 tab điều hành trên /ban-do-doi-ngu: Đội ngũ · Lịch Quyết Định 12 Tháng · Mặt bằng & Khai trương.
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

const CHU_DN = { v: 1, ho_ten: "Nguyễn Đức Luân", ngay: 15, thang: 8, nam: 1986, gioi_tinh: "nam" as const, tao_luc: "2026-09-30T00:00:00Z" };

test("3 tab /ban-do-doi-ngu: Đội ngũ mặc định → Lịch 12 tháng → Mặt bằng & Kiêm hướng", async ({ page }) => {
  await napHoSo(page, CHU_DN);
  await page.goto("/ban-do-doi-ngu");

  // Tab 1 (mặc định): Bản đồ Đội ngũ hiển thị đủ 3 tab điều hành
  await expect(page.getByTestId("tab-ban-do-doi-ngu")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("tab-lich-12-thang")).toBeVisible();
  await expect(page.getByTestId("tab-mat-bang")).toBeVisible();

  // Tab 2: Lịch Quyết Định 12 Tháng
  await page.getByTestId("tab-lich-12-thang").click();
  await expect(page.getByTestId("lich-12-thang")).toBeVisible();
  await page.getByTestId("nut-lap-lich-12").click();
  const kqLich = page.getByTestId("ket-qua-lich-12");
  await expect(kqLich).toBeVisible({ timeout: 15000 });
  await expect(kqLich).toContainText("Tháng 1/");
  await expect(kqLich).toContainText("Tháng 12/");
  await expect(kqLich).toContainText("Nên chú ý:");

  // Tab 3: Mặt bằng & Khai trương (góc 22.5° giáp ranh + chọn Không rõ năm xây)
  await page.getByTestId("tab-mat-bang").click();
  await expect(page.getByTestId("mat-bang-khai-truong")).toBeVisible();
  await page.locator("#mb-do").fill("22.5");
  await page.getByTestId("checkbox-khong-ro-nam-xay").check();
  await page.getByTestId("nut-kiem-tra-mat-bang").click();
  const kqMb = page.getByTestId("ket-qua-mat-bang");
  await expect(kqMb).toBeVisible({ timeout: 15000 });
  await expect(kqMb.getByTestId("canh-bao-kiem-huong")).toBeVisible();
  await expect(kqMb).toContainText("Vận 9");
  await expect(kqMb).toContainText("Quầy thu ngân");
  await expect(kqMb).toContainText("Nên chú ý:");
});
