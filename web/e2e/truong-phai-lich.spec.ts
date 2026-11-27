// TP-1 — trường phái lịch (Dương Công kỵ): dòng "cách kia làm khác ngày này" ngay dưới thẻ ngày, bấm là đổi phái,
// thẻ ngày tính lại; lựa chọn nhớ trên máy; khung chọn đọc chữ + nguồn từ sổ engine; ngày hai phái như nhau thì im lặng.
import { test, expect } from "@playwright/test";

test("2/8/2027 (mùng 1 tháng 7 âm): mặc định không kiêng, có dòng sách Hiệp Kỷ ghi khác → bấm đổi, thẻ ngày kiêng", async ({ page }) => {
  await page.goto("/xem-ngay-tot/2027-08-02");
  const dong = page.getByTestId("diem-khac");
  await expect(dong).toContainText("Sách Hiệp Kỷ ghi ngày này là ngày Dương Công kỵ");
  await expect(page.getByTestId("ky-dan-gian")).toHaveCount(0);
  await expect(page.getByTestId("truong-phai-lich")).toBeVisible();
  const yeuCau = page.waitForRequest((r) => r.url().includes("/api/lich/ngay-tot") && r.headers()["x-duong-cong"] === "hiep_ky");
  await page.getByTestId("diem-khac-nut").click();
  await yeuCau;
  await expect(page.getByTestId("ky-dan-gian")).toContainText("Dương Công");
  await expect(page.getByTestId("diem-khac")).toContainText("Đang xem theo sách Hiệp Kỷ");
  expect(await page.evaluate(() => localStorage.getItem("hbt.lich.duong_cong"))).toBe("hiep_ky");
  // khung chọn: nguồn từ sổ engine (câu trích nguyên văn)
  await page.getByTestId("truong-phai-lich-mo").click();
  await page.getByTestId("phai-duong-cong").getByText("Theo sách Hiệp Kỷ").first().waitFor();
  await expect(page.getByTestId("nguon-phai-duong_cong")).toContainText("七月初一二十九");
  // tải lại: vẫn theo sách
  await page.reload();
  await expect(page.getByTestId("ky-dan-gian")).toContainText("Dương Công");
  // đổi về mặc định bằng dòng nhắc
  await page.getByTestId("diem-khac-nut").click();
  await expect(page.getByTestId("ky-dan-gian")).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("hbt.lich.duong_cong"))).toBeNull();
});

test("ngày hai phái như nhau: không có dòng nhắc, không có khung trường phái lịch", async ({ page }) => {
  await page.goto("/xem-ngay-tot/2027-08-20");
  await expect(page.getByTestId("the-ngay")).toBeVisible();
  await expect(page.getByTestId("diem-khac")).toHaveCount(0);
  await expect(page.getByTestId("truong-phai-lich")).toHaveCount(0);
});

test("sổ trường phái qua /api/truong-phai: đủ các môn, mỗi điểm một mặc định", async ({ request }) => {
  const j = await (await request.get("/api/truong-phai")).json();
  expect(j.mon).toEqual(expect.arrayContaining(["lich", "tuvi", "battu", "phongthuy", "thanso", "kymon"]));
  for (const d of j.diem) expect(d.lua_chon.filter((x: { mac_dinh: boolean }) => x.mac_dinh)).toHaveLength(1);
});
