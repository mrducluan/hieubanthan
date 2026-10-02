// Bát tự (HH-3): hồ sơ → tứ trụ + ngũ hành + dụng thần hai cách → hỏi.
import { test, expect } from "@playwright/test";
import { hoi, napHoSo } from "./_hoso";

test("tứ trụ từ hồ sơ + dụng thần hai cách", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/bat-tu");
  const tt = page.getByTestId("tu-tru");
  await expect(tt).toContainText("Nhâm");
  await expect(tt).toContainText("Dụng thần · Phù ức");
  await expect(tt).toContainText("Dụng thần · Điều hậu");
  // VZ-3: bảng tứ trụ đầy đủ + vòng địa chi + lưu niên
  const bang = page.getByRole("table", { name: "Bảng tứ trụ" });
  await expect(bang).toContainText("Lộ Bàng Thổ");           // nạp âm Canh Ngọ
  // Tiêu đề cột thẳng hàng với dữ liệu (lỗi cũ: ô "Mục" sr-only rơi khỏi lưới → lệch một cột)
  const giua = async (l: import("@playwright/test").Locator) => { const b = (await l.boundingBox())!; return b.x + b.width / 2; };
  expect(Math.abs(await giua(bang.getByRole("columnheader", { name: /Trụ năm/ })) - await giua(bang.getByText("Canh", { exact: true }).first()))).toBeLessThan(12);
  await expect(bang).toContainText("Thiên Ất Quý Nhân");
  await expect(tt).toContainText("Tự hình");                 // Ngọ–Ngọ
  await expect(page.getByTestId("dieu-hau-ctbg")).toContainText("Tỷ Kiên");
  const cc = page.getByTestId("cach-cuc-tbct");                                // KB-3b: Nhâm tháng Tỵ, Bính lộ giờ
  await expect(cc).toContainText("Thiên Tài cách");
  await expect(cc).toContainText("bản khí, đã lộ ra thiên can");
  await expect(cc).toContainText("Kỵ (phá cách do)");   // KB-3: Nhâm sinh tháng Tỵ → Nhâm đứng đầu
  await expect(page.getByTestId("luu-nien-bat-tu")).toContainText("12 lưu nguyệt");
  const ans = await hoi(page, "Dụng thần của tôi là gì?");
  await expect(ans).toContainText("Canh Ngọ · Tân Tỵ · Nhâm Ngọ · Bính Ngọ");
  await expect(ans).toContainText("không tự chọn");
});

test("câu hỏi chung về nhật chủ không cần hồ sơ", async ({ page }) => {
  await page.goto("/bat-tu");
  const ans = await hoi(page, "Nhật chủ Giáp là người thế nào?");
  await expect(ans).toContainText("cây đại thụ");
});

test("đổi năm xem → lưu niên đổi theo, giao diện giấy cổ", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/bat-tu");
  await expect(page.getByTestId("luu-nien-bat-tu")).toBeVisible();
  await page.getByRole("tab", { name: "Giấy cổ" }).click();
  await expect(page.locator(".la-so-giay")).toBeVisible();
  await page.getByRole("group", { name: "Năm xem" }).getByRole("button", { name: "Năm sau" }).click();
  const nam = await page.getByRole("group", { name: "Năm xem" }).locator("b").innerText();
  await expect(page.getByTestId("luu-nien-bat-tu")).toContainText(`Lưu niên ${nam}`);
});

test("luận giải toàn bộ Bát tự", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/bat-tu");
  await page.getByRole("button", { name: "Xem luận giải" }).click();
  const bc = page.getByTestId("luan-giai-toan-bo");
  for (const chuong of ["Nhật chủ và tính cách", "Ngũ hành, thân vượng nhược, dụng thần", "Sự nghiệp, tiền bạc qua thập thần", "Đại vận và năm nay"]) {
    await expect(bc).toContainText(chuong);
  }
});

test("tải ảnh tứ trụ: ra file PNG", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/bat-tu");
  await expect(page.getByTestId("tu-tru")).toBeVisible();
  const [tai] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Tải ảnh" }).click()]);
  expect(tai.suggestedFilename()).toBe("bat-tu-Canh-Ngo_Tan-Ty_Nham-Ngo_Binh-Ngo.png");
  const duong = await tai.path();
  const { statSync, copyFileSync } = await import("node:fs");
  expect(statSync(duong!).size).toBeGreaterThan(50_000);
  if (process.env.LUU_ANH) copyFileSync(duong!, process.env.LUU_ANH);
});
