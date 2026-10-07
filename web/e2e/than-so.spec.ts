// Luồng Phase 1 (docs/THIET-KE-UI.md §6.1): landing → nhập → nghi thức → hé lộ → hồ sơ → chiều sâu → hỏi.
// Ca đã chốt (docs/NHAT-KY-DU-AN.md): Nguyễn Đức Luân 24/10/1988 → DD33 / SM9 / LH6 / NC3.
import { test, expect } from "@playwright/test";
import { hoi, napHoSo } from "./_hoso";

const LUAN = { v: 1, ho_ten: "Nguyễn Đức Luân", ngay: 24, thang: 10, nam: 1988, tao_luc: "2026-09-30T00:00:00Z" };

test("landing → nhập 2 trường → hé lộ số đường đời và hồ sơ 4 số", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Con số nói gì");
  await page.getByLabel("Họ và tên đầy đủ").fill("Nguyễn Đức Luân");
  await page.getByLabel("Ngày", { exact: true }).fill("24");
  await page.getByLabel("Tháng", { exact: true }).fill("10");
  await page.getByLabel("Năm", { exact: true }).fill("1988");
  await page.getByRole("button", { name: "Xem con số của tôi" }).click();

  await expect(page).toHaveURL(/\/ban-than/);
  await expect(page.getByTestId("so-duong-doi")).toHaveText("33");
  await expect(page.getByText("Số cái — giữ nguyên, không rút gọn")).toBeVisible();

  for (const [vt, so] of [["duong_doi", "33"], ["su_menh", "9"], ["linh_hon", "6"], ["nhan_cach", "3"]] as const) {
    await expect(page.getByTestId(`the-${vt}`).getByTestId("gia-tri")).toHaveText(so);
  }
  // Ba lớp: Đã tính (vết cộng) · Diễn giải (mặt tối + nguồn) · Tự soi.
  const dd = page.getByTestId("the-duong_doi");
  await expect(dd).toContainText("Mặt tối:");
  await expect(dd).toContainText("Nguồn:");
  await dd.getByRole("tab", { name: "Đã tính" }).click();
  await expect(dd).toContainText("Tổng 33");
  await dd.getByRole("tab", { name: "Tự soi" }).click();
  await expect(dd).toContainText("Bạn muốn gì cho riêng mình");

  await expect(page.getByTestId("the-danh-tinh")).toContainText("Nguyễn Đức Luân");
  // Hồ sơ giữ lại khi quay về trang chủ.
  await page.goto("/");
  await expect(page.getByText("Chào lại")).toBeVisible();
});

test("chiều sâu: dải đời, biểu đồ ngày sinh, hỏi đáp", async ({ page }) => {
  await napHoSo(page, LUAN);
  await page.goto("/than-so");
  await expect(page.getByTestId("ten-chinh")).toHaveText("Nguyễn Đức Luân");
  await expect(page.getByTestId("ngay-sinh")).toContainText("Sinh 24/10/1988");
  await expect(page.getByRole("img", { name: "Dải đời đỉnh cao theo tuổi" })).toBeVisible();

  await page.getByRole("tab", { name: "Biểu đồ ngày sinh" }).click();
  const bd = page.getByTestId("bieu-do");
  await expect(bd.getByText("Mũi tên trống Tâm linh (Hoài nghi)")).toBeVisible();
  await expect(bd.getByText("Số vắng trong ngày sinh: 3, 5, 6, 7")).toBeVisible();

  await page.getByRole("button", { name: "Điểm mạnh cốt lõi của tôi là gì?" }).click();
  const ans = page.getByTestId("cau-tra-loi").last();
  await expect(ans).toContainText("Mặt tối cần để ý");
  await expect(ans).toContainText("Ghép trực tiếp từ kho tri thức có nguồn.");

  const hopDoi = await hoi(page, "Tôi và người yêu có hợp nhau không?");
  await expect(hopDoi.getByRole("link", { name: /Hợp đôi/ })).toBeVisible();
});

test("chưa có hồ sơ: trang Bản thân mời nhập", async ({ page }) => {
  await page.goto("/ban-than");
  await expect(page.getByText("Bắt đầu bằng tên và ngày sinh")).toBeVisible();
});

test("form hồ sơ chặn ngày sinh tương lai và họ tên không có chữ", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Họ và tên đầy đủ").fill("123 456");
  await page.getByLabel("Ngày", { exact: true }).fill("1");
  await page.getByLabel("Tháng", { exact: true }).fill("1");
  await page.getByLabel("Năm", { exact: true }).fill("1990");
  await page.getByRole("button", { name: "Xem con số của tôi" }).click();
  await expect(page.getByText("Nhập họ tên đầy đủ")).toBeVisible();
  await page.getByLabel("Họ và tên đầy đủ").fill("Trần An");
  await page.getByLabel("Năm", { exact: true }).fill("2099");
  await page.getByRole("button", { name: "Xem con số của tôi" }).click();
  await expect(page.getByText("Ngày sinh chưa đúng")).toBeVisible();
  await expect(page).not.toHaveURL(/ban-than/);
});

test("engine lỗi: báo rõ + thử lại được; trang lạ ra 404 tiếng Việt", async ({ page }) => {
  await napHoSo(page, LUAN);
  let hong = true;
  await page.route("**/api/thanso/luan-giai", (r) => (hong ? r.fulfill({ status: 502, contentType: "application/json", body: '{"error":"Chưa tính được lúc này."}' }) : r.fallback()));
  await page.goto("/than-so");
  await expect(page.getByRole("alert").filter({ hasText: "Chưa tính được" })).toBeVisible();
  hong = false;
  await page.getByRole("button", { name: "Thử lại" }).click();
  await expect(page.getByTestId("ten-chinh")).toBeVisible();
  await page.goto("/khong-co-trang-nay");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("không có trên bản đồ sao");
});

test("nhập ngày ÂM lịch: xem trước dương lịch, bài đọc tính theo ngày dương", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Họ và tên đầy đủ").fill("Nguyễn Đức Luân");
  await page.getByRole("radio", { name: "Âm lịch" }).click();
  await page.getByLabel("Ngày", { exact: true }).fill("14");
  await page.getByLabel("Tháng", { exact: true }).fill("9");
  await page.getByLabel("Năm", { exact: true }).fill("1988");
  await expect(page.getByTestId("doi-lich")).toContainText("Dương lịch: 24/10/1988 · năm Mậu Thìn");
  await page.getByRole("button", { name: "Xem con số của tôi" }).click();
  await expect(page.getByTestId("so-duong-doi")).toHaveText("33");
  const h = await page.evaluate(() => JSON.parse(localStorage.getItem("hbt.hoso.v1") ?? "{}"));
  expect([h.ngay, h.thang, h.nam, h.lich_nhap, h.am?.ngay, h.am?.thang]).toEqual([24, 10, 1988, "am", 14, 9]);
});

test("nhập dương lịch: hiện ngày âm để đối chiếu giấy tờ", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Ngày", { exact: true }).fill("24");
  await page.getByLabel("Tháng", { exact: true }).fill("10");
  await page.getByLabel("Năm", { exact: true }).fill("1988");
  await expect(page.getByTestId("doi-lich")).toContainText("Âm lịch: 14/9/1988 (Mậu Thìn) · ngày");
});

test("nhập ÂM lịch: ngày 30 của tháng thiếu bị chặn; năm có tháng nhuận được nhắc", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "Âm lịch" }).click();
  await page.getByLabel("Ngày", { exact: true }).fill("30");
  await page.getByLabel("Tháng", { exact: true }).fill("01");
  await page.getByLabel("Năm", { exact: true }).fill("2024");
  await expect(page.getByTestId("doi-lich")).toContainText("chỉ có 29 ngày");
  await page.getByLabel("Ngày", { exact: true }).fill("15");
  await page.getByLabel("Tháng", { exact: true }).fill("06");
  await page.getByLabel("Năm", { exact: true }).fill("2025");
  await expect(page.getByTestId("nhac-nhuan")).toContainText("hai tháng 6");
  await page.getByLabel("Tháng nhuận").check();
  await expect(page.getByTestId("nhac-nhuan")).toHaveCount(0);
  await expect(page.getByTestId("doi-lich")).toContainText("Dương lịch:");
});

test("TV-LICH: ngày lịch Việt ≠ lịch Trung Quốc → hồ sơ nhắc lá số tử vi có thể khác", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Ngày", { exact: true }).fill("30");
  await page.getByLabel("Tháng", { exact: true }).fill("1");
  await page.getByLabel("Năm", { exact: true }).fill("1985");
  await expect(page.getByTestId("doi-lich")).toContainText("theo lịch Việt Nam");
  await expect(page.getByTestId("nhac-lich-trung")).toContainText("theo lịch Trung Quốc là");
  await page.getByLabel("Ngày", { exact: true }).fill("17");
  await page.getByLabel("Tháng", { exact: true }).fill("5");
  await page.getByLabel("Năm", { exact: true }).fill("1990");
  await expect(page.getByTestId("doi-lich")).toContainText("Âm lịch:");
  await expect(page.getByTestId("nhac-lich-trung")).toHaveCount(0);
});
