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
  // Cự Môn Đắc tại Mệnh: lời đời thường theo sao × cung (thẻ cung), thuật ngữ trong "Vì sao nói vậy".
  const gn = page.getByTestId("giai-nghia-sao").first();
  await expect(gn).toContainText("phân tích việc gì cũng tới nơi");
  await expect(gn.getByRole("button", { name: /Vì sao nói vậy/ })).toBeVisible();
  await laSo.getByRole("button", { name: /^Cung Quan Lộc/ }).click();
  await expect(page.getByRole("heading", { name: /Cung Quan Lộc/ })).toBeVisible();
  await page.getByRole("button", { name: "Hỏi về cung này" }).click();
  const ans = page.getByTestId("cau-tra-loi").last();
  await expect(ans).toContainText("Cung xem: Quan Lộc");
  await expect(ans.getByRole("button", { name: /Vì sao nói vậy/ })).toBeVisible();   // căn cứ: cung, sao, độ sáng
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
  // LG-ĐS: engine trả bản "đời sống" (docs/LUAN-GIAI-DOI-SONG.md) — 13 chương (VH-1: + Vận hạn), có Điều quan trọng nhất + dòng thời gian.
  await expect(bc).toHaveAttribute("data-phien-ban", "doi_song_1");
  await expect(bc).toContainText("Con người bạn");
  await expect(bc).toContainText("Năm nay & 3 tháng tới");
  await expect(bc.getByTestId("lg-cot-loi")).toBeVisible();
  await expect(bc.getByText("Bạn đang ở đây")).toHaveCount(1);
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

test("trường phái: Hoả/Linh lối Việt ↔ Trung Châu đổi cách cục (1997: Linh Tham ↔ Hoả Tham)", async ({ page }) => {
  await napHoSo(page, { ...HO_SO_MAU, ngay: 19, thang: 3, nam: 1997, gio: "00:30" });
  await page.goto("/tu-vi");
  const cc = page.getByTestId("cach-cuc");
  await expect(cc).toContainText("Linh Tham");
  await page.getByRole("tab", { name: "Trung Châu" }).click();
  await expect(cc).toContainText("Hoả Tham");
});

test("sinh nửa sau tháng nhuận: chọn cách tính tháng → cung Mệnh đổi", async ({ page }) => {
  await napHoSo(page, { ...HO_SO_MAU, ngay: 10, thang: 6, nam: 2001, gio: "15:30", gioi_tinh: "nu" });
  await page.goto("/tu-vi");
  const laSo = page.getByRole("group", { name: /Lá số Tử vi/ });
  const menh = laSo.getByRole("button", { name: /^Cung Mệnh/ });
  const truoc = await menh.getAttribute("aria-label");
  await expect(page.getByTestId("chon-thang-nhuan")).toBeVisible();
  await page.getByRole("tab", { name: "Như tháng chính" }).click();
  await expect(menh).not.toHaveAttribute("aria-label", truoc!);
});

test("giá luận giải: công tắc thu Sao mặc định tắt → miễn phí, không đòi đăng nhập", async ({ page, request }) => {
  const r = await request.get("/api/luan-giai/phi");
  expect(await r.json()).toEqual({ thu: false, gia: 29 });
  await napHoSo(page);
  await page.goto("/tu-vi");
  await expect(page.getByTestId("gia-luan-giai")).toContainText("miễn phí");
  await page.getByRole("button", { name: "Xem luận giải" }).click();
  await expect(page.getByTestId("luan-giai-toan-bo")).toContainText("Con người bạn");
});

test("KB-TV2: cách cục bổ sung có phiên âm phú cổ", async ({ page }) => {
  await napHoSo(page, { ...HO_SO_MAU, ngay: 15, thang: 1, nam: 1960, gio: "06:00" });
  await page.goto("/tu-vi");
  const cc = page.getByTestId("cach-cuc");
  await cc.getByRole("button", { name: /Cơ Lương Gia Hội/ }).click();
  await expect(cc.getByTestId("co-ca")).toContainText("Cơ Lương nhập miếu tối kham ngôn");
});

test("KB-TV2b: hỏi tính cách → độ sáng Nam phái + nghĩa riêng khi sao sáng", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  const ans = await hoi(page, "Tính cách của tôi theo tử vi thế nào?");
  await expect(ans).toContainText("phân tích việc gì cũng tới nơi");   // lời khi Cự Môn sáng ở Mệnh
  await ans.getByRole("button", { name: /Vì sao nói vậy/ }).click();
  await expect(ans.getByTestId("can-cu")).toContainText("Cự Môn ở cung Mệnh (Đắc");     // Nam phái: Cự Môn tại Hợi
  await expect(ans.getByTestId("can-cu")).toContainText("lời nói có sức nặng");
});

test("TV-LICH: khung Trường phái — đổi lịch Việt ↔ Trung ra lá khác, tên vòng Thái Tuế theo phái", async ({ page }) => {
  await napHoSo(page, { ...HO_SO_MAU, ngay: 30, thang: 1, nam: 1985, gio: "10:00" });
  await page.goto("/tu-vi");
  const tp = page.getByTestId("truong-phai");
  await expect(tp).toContainText("lệch nhau");
  const laSo = page.getByRole("group", { name: /Lá số Tử vi/ });
  await expect(laSo).toContainText("Thái Tuế");                          // tên sách Việt
  const menh = laSo.getByRole("button", { name: /^Cung Mệnh/ });
  const truoc = await menh.getAttribute("aria-label");
  await tp.getByRole("tab", { name: "Lịch Trung Quốc" }).click();
  await expect(menh).not.toHaveAttribute("aria-label", truoc!);
  await tp.getByRole("tab", { name: "Phái Trung" }).click();
  await expect(laSo).toContainText("Tuế Kiện");                          // tên iztro (phái Trung)
});

test("TV-LICH: ngày hai lịch trùng → báo đổi lịch không làm lá số thay đổi", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  await expect(page.getByTestId("truong-phai")).toContainText("hai lịch trùng nhau");
});

test("TV-LN: lưu nguyệt theo phái — tháng Giêng 2026 ở Phu Thê (Đẩu Quân), đổi phái → cung khác, hỏi về tháng", async ({ page }) => {
  await napHoSo(page);
  await page.goto("/tu-vi");
  // Đưa năm xem về 2026 (test không phụ thuộc ngày chạy).
  const nam = page.getByRole("group", { name: "Năm xem hạn" });
  await expect(nam).toContainText(/Năm \d{4}/);
  for (let k = 0; k < 30; k++) {
    const n = Number((await nam.textContent())?.match(/Năm (\d{4})/)?.[1]);
    if (n === 2026) break;
    await nam.getByRole("button", { name: n > 2026 ? "Năm trước" : "Năm sau" }).click();
  }
  const ln = page.getByTestId("luu-nguyet");
  await expect(ln).toContainText("Lưu nguyệt năm Bính Ngọ");
  await expect(ln.getByRole("list", { name: "Các tháng âm lịch" }).getByRole("listitem")).toHaveCount(12);
  await ln.getByRole("button", { name: /^Tháng 1\b/ }).click();
  const ct = page.getByTestId("luu-nguyet-chi-tiet");
  await expect(ct).toContainText("Mệnh của tháng ở cung Phu Thê (Dậu)");
  await expect(ct).toContainText("Hoá Khoa Thái Âm · Phu Thê · đúng cung tháng");
  await expect(page.getByTestId("so-sanh-phai")).toContainText("Theo địa chi của tháng");
  // Đổi phái: tháng Giêng tại cung lưu niên (Ngọ = Tật Ách). Lá số gốc giữ nguyên.
  await page.getByTestId("truong-phai").getByRole("combobox", { name: "Phái tính lưu nguyệt" }).selectOption("luu_nien");
  await expect(ln).toContainText("Tháng Giêng tại cung lưu niên");
  await ln.getByRole("button", { name: /^Tháng 1\b/ }).click();
  await expect(ct).toContainText("Mệnh của tháng ở cung Tật Ách (Ngọ)");
  await ct.getByRole("button", { name: "Hỏi về tháng này" }).click();
  const ans = page.getByTestId("cau-tra-loi").last();
  await expect(ans).toContainText("Theo phái Tháng Giêng tại cung lưu niên, Mệnh của tháng rơi vào cung Tật Ách (Ngọ)");
});
