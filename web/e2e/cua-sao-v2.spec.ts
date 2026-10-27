// Cửa Sao v2 "Ba lối mở" (docs/CUA-SAO-V2.md): thanh dính nói giá trị trước + lối miễn phí; hộp khách có phép cộng
// quà chào mừng + thưởng mời; khách hết lượt hỏi biết tài khoản được thêm mấy câu. Máy chủ giả lập bằng page.route
// (e2e không có Supabase) — chuỗi đăng nhập thật (thẻ mời bạn, nạp QR, hội viên) ở e2e-that/sao-chuoi-that.spec.ts.
import { test, expect, type Page } from "@playwright/test";
import { napHoSo, hoi } from "./_hoso";
import { dieuKienMoi, goiYThanhKhoa, ketQuaMoi, loiKhachHetLuot, soBanCanMoi, soCau } from "../lib/loi-sao";

// Lời mời không được doạ, không khan hiếm giả, không đếm ngược (CLAUDE.md "Cấm tuyệt đối" + quy tắc Sao).
const CAM = /chỉ còn|sắp hết|nhanh tay|kẻo lỡ|duy nhất hôm nay|hết hạn sau|đếm ngược|xui|hạn nặng|cẩn thận kẻo/i;

const MOI = (cau: string) => ({ diem_nhan: "Trong lá số của bạn, Thiên Đồng ở cung Phu Thê (Đắc)", cau_hoi: cau, so_doan: 4, phut_doc: 3 });
const xemTruoc = (gia: number, thuong: number | null) => ({
  mo_dun: "tuvi", ket: "Kết.", trang_thai: "nhap_ai", dien_dat: "mau", so_khoa: 2,
  chuong: [
    { ma: "tong_quan", tieu_de: "Tổng quan bản mệnh", doan: ["Đoạn mở miễn phí."] },
    { ma: "tinh_cam", tieu_de: "Tình cảm, hôn nhân", khoa: true, moi_xem: MOI("Bạn thật sự tìm gì ở người bạn đời?") },
    { ma: "van_han", tieu_de: "Vận hạn hiện tại", khoa: true, moi_xem: MOI("Mười năm này xoay quanh chủ đề gì?") },
  ],
  phi: { sao: gia, ly_do: "xem_truoc", khoa: true, dang_nhap: false, so_du: null, thuong_chao_mung: thuong },
});

async function moBaoCao(page: Page, gia: number, thuong: number) {
  await page.route("**/api/sao/muc", (r) => r.fulfill({ json: { moi_ban: 20, duoc_moi: 20, chao_mung: thuong, tran: 20 } }));
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: true, gia } }));
  await page.route("**/api/tuvi/luan-giai", (r) => r.request().headers()["x-mo-khoa"] === "1"
    ? r.fulfill({ status: 402, json: { error: `Đăng nhập để mở toàn bộ báo cáo (${gia} Sao).`, can: "dang_nhap", gia, thuong } })
    : r.fulfill({ json: xemTruoc(gia, thuong) }));
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
}

test("thuần: phép tính + câu chữ ba lối mở", () => {
  expect([soBanCanMoi(19, 20), soBanCanMoi(21, 20), soBanCanMoi(0, 20), soBanCanMoi(5, 0)]).toEqual([1, 2, 0, null]);
  expect([soCau(10, 3), soCau(20, 3), soCau(5, 0)]).toEqual([3, 6, 0]);
  // Thanh dính: khách — quà + 1 lời mời đủ giá → nói lối miễn phí; quà đủ → mở ngay; không quà → chỉ mời đăng nhập.
  expect(goiYThanhKhoa({ sao: 29, dangNhap: false, thuongChaoMung: 10, moiBan: 20 }))
    .toBe("Đăng nhập nhận 10 Sao, mời 1 bạn thêm 20 Sao — đủ mở mà không tốn đồng nào.");
  expect(goiYThanhKhoa({ sao: 10, dangNhap: false, thuongChaoMung: 10, moiBan: 20 })).toBe("Đăng nhập nhận 10 Sao — đủ mở ngay báo cáo này.");
  expect(goiYThanhKhoa({ sao: 59, dangNhap: false, thuongChaoMung: 10, moiBan: 20 })).toContain("mời bạn bè hoặc nạp nhanh bằng QR");
  expect(goiYThanhKhoa({ sao: 29, dangNhap: false, thuongChaoMung: null, moiBan: 20 })).toBe("Đăng nhập để dùng Sao.");
  // Đã đăng nhập.
  expect(goiYThanhKhoa({ sao: 29, dangNhap: true, soDu: 30, moiBan: 20 })).toBe("Ví có 30 Sao — đủ mở ngay, xem lại cả ngày không trừ thêm.");
  expect(goiYThanhKhoa({ sao: 29, dangNhap: true, soDu: 10, moiBan: 20 })).toBe("Ví có 10 Sao. Mời 1 bạn là đủ (miễn phí), hoặc nạp nhanh bằng QR.");
  expect(goiYThanhKhoa({ sao: 29, dangNhap: true, soDu: 0, moiBan: 0 })).toBe("Ví có 0 Sao — nạp nhanh bằng QR, xong quay lại đúng chỗ này.");
  // Thẻ mời bạn.
  expect(ketQuaMoi({ nguon: "luan_giai", gia: 29, thieu: 19, moiBan: 20 })).toBe("Mời 1 bạn là đủ mở báo cáo này.");
  expect(ketQuaMoi({ nguon: "luan_giai", gia: 29, thieu: 29, moiBan: 20 })).toBe("Mời 2 bạn là đủ mở báo cáo này.");
  expect(ketQuaMoi({ nguon: "hoi", gia: 3, thieu: 3, moiBan: 20 })).toBe("Mỗi bạn nhận lời mời = 6 câu hỏi nữa cho bạn.");
  expect(ketQuaMoi({ nguon: "luan_giai", gia: 29, thieu: 19, moiBan: 0 })).toBe("");
  // Điều kiện luôn nói rõ: bạn bè phải đăng nhập + lưu hồ sơ (không thưởng cho cú bấm chia sẻ).
  expect(dieuKienMoi({ moiBan: 20, duocMoi: 20, tran: 20 })).toBe("Bạn ấy mở link, đăng nhập và lưu hồ sơ là cả hai cùng nhận 20 Sao. Tối đa 20 lượt mỗi 30 ngày.");
  expect(dieuKienMoi({ moiBan: 20, duocMoi: 10, tran: 5 })).toContain("bạn nhận 20 Sao, bạn ấy nhận 10 Sao");
  expect(loiKhachHetLuot({ tranTk: 10, tranKhach: 3, thuong: 10, gia: 3 }))
    .toBe("Có tài khoản: 10 câu miễn phí mỗi ngày, cộng 10 Sao chào mừng — hỏi thêm được 3 câu ngay hôm nay.");
  expect(loiKhachHetLuot({ thuong: 10 })).toBe("Có tài khoản: câu hỏi miễn phí mỗi ngày, cộng 10 Sao chào mừng.");
  for (const c of [goiYThanhKhoa({ sao: 29, dangNhap: false, thuongChaoMung: 10, moiBan: 20 }), ketQuaMoi({ nguon: "hoi", gia: 3, thieu: 3, moiBan: 20 }),
    dieuKienMoi({ moiBan: 20, duocMoi: 20, tran: 20 }), loiKhachHetLuot({ tranTk: 10, tranKhach: 3, thuong: 10, gia: 3 })]) {
    expect(c).not.toMatch(CAM);
  }
});

test("báo cáo (khách, giá 29, quà 10): thanh dính nói giá trị trước + lối miễn phí; hộp có phép cộng quà + mời 1 bạn", async ({ page }) => {
  await moBaoCao(page, 29, 10);
  const khoa = page.getByTestId("lg-phan-khoa");
  await expect(khoa).toContainText("Đọc tiếp 2 chương còn lại");
  await expect(page.getByTestId("lg-goi-y")).toHaveText("Đăng nhập nhận 10 Sao, mời 1 bạn thêm 20 Sao — đủ mở mà không tốn đồng nào.");
  await page.getByTestId("lg-mo-khoa").click();
  const hop = page.getByTestId("hop-thoai-sao");
  await expect(hop).toHaveAttribute("data-can", "dang_nhap");
  await expect(hop.getByRole("heading", { name: "Đọc tiếp báo cáo của bạn" })).toBeVisible();
  await expect(hop.getByTestId("qua-dang-nhap")).toContainText("nhận ngay 10 Sao");
  await expect(hop.getByTestId("qua-dang-nhap")).toContainText("Báo cáo này 29 Sao — còn thiếu 19 Sao.");
  await expect(hop.getByTestId("duong-mien-phi")).toContainText("10 Sao quà + mời 1 bạn (20 Sao) là đủ 29 Sao — không tốn đồng nào.");
  await expect(hop.getByTestId("sao-dang-nhap")).toHaveText("Đăng nhập · nhận 10 Sao");
  const chu = await hop.innerText();
  expect(chu).not.toMatch(/\s[.,]/);       // lỗi cũ "tặng 10 Sao ." (khoảng trắng trước dấu chấm)
  expect(chu).not.toMatch(CAM);
});

test("báo cáo (khách, quà đủ giá): hộp nói 'đủ mở ngay', không bày lối mời như điều kiện", async ({ page }) => {
  await moBaoCao(page, 10, 10);
  await page.getByTestId("lg-mo-khoa").click();
  const hop = page.getByTestId("hop-thoai-sao");
  await expect(hop.getByTestId("qua-dang-nhap")).toContainText("Đủ mở ngay báo cáo này.");
  await expect(hop.getByTestId("duong-mien-phi")).toContainText("cho lần sau");
});

test("hỏi đáp: khách hết lượt → biết tài khoản được thêm mấy câu; nút 'Đăng nhập để hỏi tiếp'; có lối 'ngày mai'", async ({ page }) => {
  await page.route("**/api/sao/muc", (r) => r.fulfill({ json: { moi_ban: 20, duoc_moi: 20, chao_mung: 10, tran: 20 } }));
  await page.route("**/api/tuvi/hoi", (r) => r.fulfill({ status: 402, json: {
    error: "Bạn đã dùng hết 3 câu hỏi miễn phí hôm nay.", can: "dang_nhap", tran: 3, tran_tk: 10, gia: 3, thuong: 10 } }));
  await napHoSo(page);
  await page.goto("/tu-vi");
  void hoi(page, "Cung Mệnh của tôi nói gì?");
  const hop = page.getByTestId("hop-thoai-sao");
  await expect(hop).toHaveAttribute("data-can", "dang_nhap");
  await expect(hop.getByTestId("khach-het-luot")).toHaveText("Có tài khoản: 10 câu miễn phí mỗi ngày, cộng 10 Sao chào mừng — hỏi thêm được 3 câu ngay hôm nay.");
  await expect(hop.getByTestId("duong-mien-phi")).toContainText("20 Sao (6 câu hỏi)");
  await expect(hop.getByTestId("sao-dang-nhap")).toHaveText("Đăng nhập để hỏi tiếp");
  await expect(hop).toContainText("ngày mai bạn lại có 3 câu miễn phí");
  expect(await hop.innerText()).not.toMatch(CAM);
});

test("hỏi đáp: đủ Sao → hộp đồng ý nói ví đủ mấy câu + Sao tự hoàn khi máy lỗi", async ({ page }) => {
  await page.route("**/api/tuvi/hoi", (r) => r.fulfill({ status: 402, json: {
    error: "Hết 10 câu miễn phí hôm nay. Hỏi tiếp: 3 Sao mỗi câu.", can: "xac_nhan_sao", gia: 3, so_du: 10, tran: 10 } }));
  await napHoSo(page);
  await page.goto("/tu-vi");
  void hoi(page, "Cung Mệnh của tôi nói gì?");
  const hop = page.getByTestId("hop-thoai-sao");
  await expect(hop).toHaveAttribute("data-can", "xac_nhan_sao");
  await expect(hop).toContainText("ví còn 10 Sao (đủ 3 câu)");
  await expect(hop).toContainText("Sao tự hoàn");
  await expect(hop.getByRole("button", { name: "Để mai" })).toBeVisible();
});

test("nạp (ví thiếu): ba lối — Đọc ngay (một gói vừa đủ + QR, gói khác gập), thẻ hội viên khi bật; điện thoại không tràn ngang", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route("**/api/thanh-toan/goi", (r) => r.fulfill({ json: { cong: "payos", gia_bao_cao: 29, goi: [
    { ma: "khoi_dau", ten: "Khởi đầu", gia_vnd: 19000, sao: 19, nhan: "Khởi đầu", mo_ta: null },
    { ma: "thu", ten: "Thử", gia_vnd: 29000, sao: 30, nhan: null, mo_ta: "Gói nhỏ để thử" },
    { ma: "pho_bien", ten: "Phổ biến", gia_vnd: 99000, sao: 110, nhan: "Phổ biến", mo_ta: null },
  ], hoi_vien: { bat: true, gia_vnd: 399000, sao_thang: 15 } } }));
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: true, gia: 29 } }));
  await page.route("**/api/tuvi/luan-giai", (r) => r.request().headers()["x-mo-khoa"] === "1"
    ? r.fulfill({ status: 402, json: { error: "Cần 29 Sao, ví bạn còn 10 Sao.", can: "nap", gia: 29, so_du: 10 } })
    : r.fulfill({ json: { ...xemTruoc(29, null), phi: { sao: 29, ly_do: "xem_truoc", khoa: true, dang_nhap: true, so_du: 10, thuong_chao_mung: null } } }));
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  await page.getByTestId("lg-mo-khoa").click();
  const hop = page.getByTestId("hop-thoai-sao");
  await expect(hop).toHaveAttribute("data-can", "nap");
  await expect(hop.getByRole("heading", { name: "Chọn cách đọc tiếp" })).toBeVisible();
  await expect(hop.getByTestId("thanh-vi")).toHaveAttribute("data-co", "10");
  await expect(hop.getByTestId("thanh-vi")).toContainText("10 / 29 Sao");
  // Gói gợi ý = gói nhỏ nhất đủ 19 Sao còn thiếu → Khởi đầu; các gói khác gập (vẫn chọn được).
  await expect(hop.getByTestId("nap-nhanh-nut")).toHaveText(/Quét QR nạp 19 Sao · 19\.000/);
  await expect(hop.getByTestId("goi-nhanh-pho_bien")).toBeHidden();
  await hop.getByText(/Chọn gói khác/).click();
  await hop.getByTestId("goi-nhanh-pho_bien").click();
  await expect(hop.getByTestId("nap-nhanh-nut")).toHaveText(/Quét QR nạp 110 Sao · 99\.000/);
  await expect(hop.getByTestId("goi-chon")).toContainText("≈ 3 báo cáo");
  await expect(hop.getByTestId("dong-hoi-vien")).toContainText("399.000 ₫");
  await expect(hop.getByTestId("dong-hoi-vien").getByRole("link")).toHaveAttribute("href", "/hoi-vien");
  // Không có Supabase → không lấy được mã mời → thẻ mời tự ẩn (link không mã = không thưởng), không quay vòng mãi.
  await expect(hop.getByTestId("the-moi-ban")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
  expect(await hop.innerText()).not.toMatch(CAM);
});

test("nạp khi CHƯA nhận quà chào mừng: gói gợi ý + số bạn cần mời tính phần thiếu SAU quà (không gợi nạp dư); quà đủ giá → chỉ một nút", async ({ page }) => {
  await page.route("**/api/thanh-toan/goi", (r) => r.fulfill({ json: { cong: "payos", gia_bao_cao: 29, goi: [
    { ma: "khoi_dau", ten: "Khởi đầu", gia_vnd: 19000, sao: 19, nhan: "Khởi đầu", mo_ta: null },
    { ma: "thu", ten: "Thử", gia_vnd: 29000, sao: 30, nhan: null, mo_ta: null },
  ] } }));
  let gia = 29;
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: true, gia } }));
  await page.route("**/api/tuvi/luan-giai", (r) => r.request().headers()["x-mo-khoa"] === "1"
    ? r.fulfill({ status: 402, json: { error: `Cần ${gia} Sao, ví bạn còn 0 Sao.`, can: "nap", gia, so_du: 0, chao_mung: 10 } })
    : r.fulfill({ json: { ...xemTruoc(gia, null), phi: { sao: gia, ly_do: "xem_truoc", khoa: true, dang_nhap: true, so_du: 0, thuong_chao_mung: null } } }));
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  await page.getByTestId("lg-mo-khoa").click();
  const hop = page.getByTestId("hop-thoai-sao");
  await expect(hop.getByTestId("nhan-chao-mung")).toBeVisible();
  await expect(hop.getByTestId("nap-nhanh-nut")).toHaveText(/Quét QR nạp 19 Sao · 19\.000/);   // 29 − 10 quà = 19, không phải gói 30
  await expect(hop).not.toContainText("ví bạn còn 0 Sao");                                       // câu máy chủ cũ — thanh ví thay
  // Quà một chạm đủ giá (giá 10) → không bày lối trả tiền / mời bạn.
  await page.keyboard.press("Escape");
  gia = 10;
  await page.reload();
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  await page.getByTestId("lg-mo-khoa").click();
  await expect(hop.getByTestId("nhan-chao-mung")).toBeVisible();
  await expect(hop.getByTestId("nap-nhanh")).toHaveCount(0);
});
