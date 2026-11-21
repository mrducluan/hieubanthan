// E2E /ban-do-doi-ngu: chip "Bổ trợ ổn định" của Bản đồ đội ngũ + bộ 3 tab điều hành (Đội ngũ · Lịch 12 tháng · Mặt bằng).
import { expect, test } from "@playwright/test";
import { napHoSo } from "./_hoso";

// Rà soát 2026-11-20: engine trả muc_phoi_hop "bo_tro_tot", web từng lọc theo "bo_tro_on_dinh" → chip luôn 0 người.
test("Bản đồ đội ngũ mẫu: chip 'Bổ trợ ổn định' đếm đúng người và lọc ra danh sách", async ({ page }) => {
  await page.goto("/ban-do-doi-ngu");
  await page.getByRole("button", { name: /Xem thử đội ngũ mẫu/ }).click();
  const chip = page.getByRole("tab", { name: /^Bổ trợ ổn định \(\d+\)$/ });
  await expect(chip).toBeVisible({ timeout: 20_000 });
  const so = Number((await chip.textContent())?.match(/\((\d+)\)/)?.[1] ?? "0");
  expect(so).toBeGreaterThan(0);
  await chip.click();
  await expect(page.getByRole("button", { name: /Bổ trợ ổn định/ })).toHaveCount(so);
});

const CHU_DN = { v: 1, ho_ten: "Nguyễn Đức Luân", ngay: 15, thang: 8, nam: 1986, gioi_tinh: "nam" as const, tao_luc: "2026-09-30T00:00:00Z" };

test("3 tab /ban-do-doi-ngu: Lịch 12 tháng → Mặt bằng (kiêm hướng · không vong · không rõ năm xây · hồ sơ cửa hàng)", async ({ page }) => {
  await napHoSo(page, CHU_DN);
  await page.goto("/ban-do-doi-ngu");

  await expect(page.getByTestId("tab-ban-do-doi-ngu")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("tab-lich-12-thang")).toBeVisible();
  await expect(page.getByTestId("tab-mat-bang")).toBeVisible();

  // Tab 2: Lịch Quyết Định 12 Tháng
  await page.getByTestId("tab-lich-12-thang").click();
  await page.getByTestId("nut-xem-lich-12-thang").click();
  const kqLich = page.getByTestId("ket-qua-lich-12-thang");
  await expect(kqLich).toBeVisible({ timeout: 15000 });
  await expect(kqLich).toContainText("Tất cả 12 tháng");

  // Tab 3a: 200° + năm 2010 → kiêm hướng, bàn thế quái
  await page.getByTestId("tab-mat-bang").click();
  await expect(page.getByTestId("mat-bang-khai-truong")).toBeVisible();
  await page.locator("#mb-do").fill("200");
  await page.locator("#mb-nam-xay").fill("2010");
  await page.getByTestId("nut-kiem-tra-mat-bang").click();
  const kqMb = page.getByTestId("ket-qua-mat-bang");
  await expect(kqMb).toBeVisible({ timeout: 15000 });
  await expect(kqMb.getByTestId("canh-bao-kiem-huong")).toContainText("thế quái");
  await expect(kqMb).toContainText("Quầy thu ngân");
  await expect(kqMb).toContainText("Nên chú ý:");
  await expect(kqMb).toContainText("Vận 8");
  // "Vì sao nói vậy" gập sẵn, mở ra mới thấy căn cứ
  const khu = kqMb.getByTestId("khu-thu_ngan");
  await expect(khu.locator("details p")).toBeHidden();
  await khu.getByText("Vì sao nói vậy").click();
  await expect(khu.locator("details p")).toBeVisible();

  // Hồ sơ cửa hàng đã lưu trên máy
  const luu = await page.evaluate(() => window.localStorage.getItem("hbt.mat_bang.v1"));
  expect(JSON.parse(luu ?? "null")).toMatchObject({ v: 1, do_huong: 200, cach_nam: "chinh_xac", nam_xay: 2010 });

  // Tab 3b: 22.5° → không vong (đo lại)
  await page.locator("#mb-do").fill("22.5");
  await page.getByTestId("nut-kiem-tra-mat-bang").click();
  await expect(kqMb.getByTestId("canh-bao-kiem-huong")).toContainText("không vong", { timeout: 15000 });

  // Tab 3c: Không rõ năm xây → không gửi năm, không lập bàn, không hiện "Vận 9"
  await page.locator("#mb-do").fill("180");
  await page.getByTestId("checkbox-khong-ro-nam-xay").check();
  const yeuCau = page.waitForRequest((r) => r.url().includes("/api/doanh-chu/mat-bang") && r.method() === "POST");
  await page.getByTestId("nut-kiem-tra-mat-bang").click();
  const body = (await yeuCau).postDataJSON() as Record<string, unknown>;
  expect(body).not.toHaveProperty("nam_xay");
  await expect(kqMb.getByTestId("khong-ro-nam-xay")).toBeVisible({ timeout: 15000 });
  await expect(kqMb).not.toContainText("Vận 9");

  // Mở lại trang: hồ sơ cửa hàng được điền lại (không rõ năm xây vẫn tích)
  await page.reload();
  await page.getByTestId("tab-mat-bang").click();
  await expect(page.locator("#mb-do")).toHaveValue("180");
  await expect(page.getByTestId("checkbox-khong-ro-nam-xay")).toBeChecked();
});
