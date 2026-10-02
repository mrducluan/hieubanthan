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
  await expect(page.getByTestId("cach-cuc")).toBeVisible();          // KB-2: cách cục quanh Mệnh
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

test("luận giải toàn bộ theo chương (miễn phí thử nghiệm)", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Xem luận giải" }).click();
  const bc = page.getByTestId("luan-giai-toan-bo");
  await expect(bc).toContainText("Tổng quan bản mệnh");
  await expect(bc).toContainText("Vận hạn hiện tại");
  await expect(bc.getByRole("navigation", { name: "Mục lục" })).toBeVisible();
});

test("tải ảnh lá số: ra file PNG", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  await expect(page.getByRole("group", { name: /Lá số Tử vi/ })).toBeVisible();
  const [tai] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Tải ảnh" }).click()]);
  expect(tai.suggestedFilename()).toMatch(/^la-so-tu-vi-.+\.png$/);
  const duong = await tai.path();
  const { statSync } = await import("node:fs");
  expect(statSync(duong!).size).toBeGreaterThan(20_000);
});

test("luận giải có AI diễn đạt: hiện bản AI, chuyển được sang bản dữ liệu gốc", async ({ page }) => {
  await napHoSo(page);
  await page.route("**/api/tuvi/luan-giai", (r) => r.fulfill({ json: {
    mo_dun: "tuvi", ket: "Kết.", trang_thai: "nhap_ai", phi: { sao: 0, ly_do: "mien_phi_thu_nghiem" }, dien_dat: "tron",
    chuong: [
      { ma: "tong_quan", tieu_de: "Tổng quan bản mệnh", doan: ["Đoạn gốc tổng quan."], van_ai: "Bài AI viết lại.\n\nĐoạn thứ hai.", che_do: "llm" },
      { ma: "su_nghiep", tieu_de: "Sự nghiệp", doan: ["Đoạn gốc sự nghiệp."], che_do: "template_fallback" },
    ],
  } }));
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Xem luận giải" }).click();
  const bc = page.getByTestId("luan-giai-toan-bo");
  await expect(bc.getByTestId("dien-dat-ai")).toContainText("giữ bản gốc");
  await expect(bc).toContainText("Bài AI viết lại.");
  await expect(bc).not.toContainText("Đoạn gốc tổng quan.");
  await expect(bc).toContainText("Đoạn gốc sự nghiệp.");          // chương không đạt kiểm tra giữ bản gốc
  await bc.getByRole("button", { name: "Xem bản dữ liệu gốc" }).click();
  await expect(bc).toContainText("Đoạn gốc tổng quan.");
});

test("giá luận giải: công tắc thu Sao mặc định tắt → miễn phí, không đòi đăng nhập", async ({ page, request }) => {
  const r = await request.get("/api/luan-giai/phi");
  expect(await r.json()).toEqual({ thu: false, gia: 10 });
  await napHoSo(page);
  await page.goto("/tu-vi");
  await expect(page.getByTestId("gia-luan-giai")).toContainText("miễn phí");
  await page.getByRole("button", { name: "Xem luận giải" }).click();
  await expect(page.getByTestId("luan-giai-toan-bo")).toContainText("Tổng quan bản mệnh");
});
