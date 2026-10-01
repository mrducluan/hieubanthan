// Tử vi (HH-2): hồ sơ trên máy → lá số 12 cung (iztro) → hỏi.
import { test, expect } from "@playwright/test";
import { HO_SO_MAU, hoi, napHoSo } from "./_hoso";

test("có hồ sơ đủ giờ sinh: vẽ lá số, chọn cung → chi tiết → hỏi", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  const laSo = page.getByRole("group", { name: /Lá số Tử vi/ });
  await expect(laSo).toContainText("Thổ Ngũ Cục");
  // Mặc định chọn cung Mệnh (không phải Lai nhân cung).
  await expect(laSo.getByRole("button", { pressed: true })).toHaveAccessibleName(/^Cung Mệnh/);
  await expect(laSo).toContainText("Tuần");
  await laSo.getByRole("button", { name: /^Cung Quan Lộc/ }).click();
  await expect(page.getByRole("heading", { name: /Cung Quan Lộc/ })).toBeVisible();
  await page.getByRole("button", { name: "Hỏi về cung này" }).click();
  const ans = page.getByTestId("cau-tra-loi").last();
  await expect(ans).toContainText("Cung xem: Quan Lộc");
  await expect(ans).toContainText("Trong lá số của bạn");
});

test("không có hồ sơ: vẫn hỏi được câu kiến thức chung", async ({ page }) => {
  await page.goto("/tu-vi");
  await expect(page.getByRole("button", { name: "Tạo hồ sơ" })).toBeVisible();
  const ans = await hoi(page, "Tham Lang ở cung Quan Lộc có ý nghĩa gì?");
  await expect(ans).toContainText("Tham Lang ở cung Quan Lộc");
});

test("hồ sơ cũ thiếu nơi sinh: hỏi bổ sung đúng lúc → sinh ở nước ngoài, giờ mùa hè", async ({ page }) => {
  const { noi_sinh: _bo, ...cu } = HO_SO_MAU;
  await napHoSo(page, cu);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Thêm giờ sinh, giới tính, nơi sinh" }).click();
  const noi = page.getByLabel("Nơi sinh");
  await expect(noi.locator("option", { hasText: "Hà Nội" })).toHaveCount(1);
  await noi.selectOption("nuoc_ngoai");
  await page.getByLabel(/giờ mùa hè/).check();
  await page.getByRole("button", { name: "Lưu và xem" }).click();
  const laSo = page.getByRole("group", { name: /Lá số Tử vi/ });
  await expect(laSo).toBeVisible();
  await expect(page.getByText(/giờ địa phương nơi sinh/)).toBeVisible();
  await expect(page.getByText(/Đã trừ 1 giờ mùa hè: giờ chuẩn địa phương 11:30/)).toBeVisible();
});

test("đổi giao diện giấy cổ, đổi năm xem → lớp lưu niên theo năm", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  const laSo = page.getByRole("group", { name: /Lá số Tử vi/ });
  await expect(laSo).toContainText("LƯU NIÊN");
  await page.getByRole("tab", { name: "Giấy cổ" }).click();
  await expect(page.locator("svg.la-so-giay")).toBeVisible();
  const nam = await page.getByRole("group", { name: "Năm xem hạn" }).locator("b").innerText();
  await page.getByRole("button", { name: "Năm sau" }).click();
  await expect(page.getByRole("group", { name: "Năm xem hạn" })).toContainText(String(Number(nam) + 1));
  await expect(laSo).toContainText(`Năm xem`);
  await page.reload();
  await expect(page.locator("svg.la-so-giay")).toBeVisible();   // nhớ giao diện trên máy
});

test("độ sáng sao: mặc định Nam phái, chuyển được sang phái Trung", async ({ page }) => {
  await napHoSo(page, { ...HO_SO_MAU, ngay: 19, thang: 3, nam: 1997, gio: "00:30" });
  await page.goto("/tu-vi");
  const laSo = page.getByRole("group", { name: /Lá số Tử vi/ });
  const menh = laSo.getByRole("button", { name: /^Cung Mệnh/ });
  await expect(menh).toHaveAccessibleName(/Tử Vi Bình/);              // lối Việt: Tử Vi tại Mão bình hoà
  await page.getByRole("tab", { name: "Phái Trung" }).click();
  await expect(menh).toHaveAccessibleName(/Tử Vi Vượng/);             // bảng iztro
});
