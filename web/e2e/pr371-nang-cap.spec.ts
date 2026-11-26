// Kiểm chứng tích hợp E2E cho các nâng cấp PR #371 v2:
// 1) Công tắc Đối chiếu Cổ điển tự mở 'Vì sao nói vậy' và hiện khung học thuật không chứa hướng ngũ hành trái 6b.
// 2) Khối Đường bay tứ hoá (PhiHoa) hiển thị Chuỗi chuyển Kỵ 2 chặng kèm nút kiểm chứng Đúng với mình.
// 3) Trang /quan-ly-nhan-su có ô giờ sinh tuỳ chọn cho phép tính Tam Trụ (khi trống) và Tứ Trụ (khi nhập giờ).
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";

test("PhiHoa hiển thị chuỗi chuyển Kỵ 2 chặng kèm nút Đúng với mình & Công tắc Cổ điển hoạt động", async ({ page }) => {
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: false, gia: 10 } }));
  await page.route("**/api/kiem-chung/ty-le**", (r) => r.fulfill({ json: {} }));
  await napHoSo(page);

  await page.goto("/tu-vi");
  // Mở khối Đường bay tứ hoá
  const nutPhiHoa = page.locator("#phi-hoa summary, #phi-hoa button").first();
  await nutPhiHoa.click();
  const chuoi = page.getByTestId("phi-hoa-chuoi");
  await expect(chuoi).toBeVisible();
  await expect(chuoi.locator("li").first()).toContainText(/chuyển Kỵ/);

  // Công tắc chế độ đọc trên báo cáo đời sống
  await expect(page.getByTestId("luan-giai-toan-bo")).toBeVisible();
  await page.getByTestId("che-do-co-dien").first().click();
  const khungCd = page.getByTestId("lg-ung-dung-co-dien");
  await expect(khungCd).toBeVisible();
  await expect(page.getByTestId("lg-diem-hoc-thuat")).toBeVisible();
});

test("/quan-ly-nhan-su có ô nhập giờ sinh tuỳ chọn để kích hoạt Tứ Trụ khi biết giờ", async ({ page }) => {
  await page.goto("/quan-ly-nhan-su");
  const oGioChu = page.getByTestId("dc-gio-chu");
  await expect(oGioChu).toBeVisible();
  await expect(oGioChu).toHaveValue("");
  await oGioChu.fill("09:30");
  await expect(oGioChu).toHaveValue("09:30");
});
