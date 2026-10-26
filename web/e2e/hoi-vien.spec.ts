// SAO-HV (migration 0028) — hội viên năm: mua một lần bằng VND, không tự gia hạn; mở mọi chương Luận giải toàn bộ; Sao
// tháng không cộng dồn; câu hỏi chuyên gia; hoàn tiền theo chính sách. Quy tắc máy chủ (kích hoạt, gia hạn ≤ 30 ngày, hoàn
// tiền gợi ý, quyền) kiểm ở supabase/kiem_thu/thu_hoi_vien_0028.sql; chuỗi thật ở e2e-that/sao-hoi-vien-that.spec.ts. Ở đây:
// phần thuần + giao diện với máy chủ giả lập bằng page.route (e2e không có Supabase → công tắc TẮT ở trang máy chủ).
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { CAI_DAT, chuanHoa, giaTriHieuLuc } from "../lib/cau-hinh";
import { locThuocTinh } from "../lib/do-luong";
import {
  HOAN_TIEN_HOI_VIEN, HOI_VIEN_MAC_DINH, docHoiVien, dongHoiVien, giaMoiThang, hienDongHoiVien, loiGiaHan, thuocTinhHoiVien, vnd,
} from "../lib/thanh-toan/hoi-vien";

const CAM = /chỉ còn|còn \d+ suất|hết hạn sau|đếm ngược|nhanh tay|kẻo lỡ|duy nhất hôm nay|ưu đãi|giảm giá|<s>|<del>|line-through/i;
const HV_BAT = { ...HOI_VIEN_MAC_DINH, bat: true };
const GOI = [
  { ma: "thu", ten: "Thử", gia_vnd: 29000, sao: 30, nhan: null, mo_ta: "Đủ 3 lần" },
  { ma: "pho_bien", ten: "Phổ biến", gia_vnd: 99000, sao: 110, nhan: "Phổ biến", mo_ta: "Tặng thêm 10%" },
];

test("thuần: đọc RPC an toàn, dòng hội viên, nhắc gia hạn chỉ khi ≤ 30 ngày, thuộc tính đo, chính sách hoàn tiền", () => {
  expect(docHoiVien(null)).toBeNull();
  expect(docHoiVien("x")).toBeNull();
  expect(docHoiVien({})).toEqual(HOI_VIEN_MAC_DINH);
  const hv = docHoiVien({ bat: true, gia_vnd: 3990000, dang_la: true, tu_ngay: "2026-10-26", den_ngay: "2027-10-26", con_ngay: 365,
    cau_hoi_con: 2, sao_thang: 15, cau_hoi_nam: 2, gia_han_duoc: false, sao_thang_da_cap: false })!;
  expect(hv.dang_la).toBe(true);
  expect(hv.con_ngay).toBe(365);
  expect(giaMoiThang(3990000)).toBe(333000);
  expect(vnd(3990000)).toBe("3.990.000 ₫");
  const dong = dongHoiVien(HV_BAT);
  expect(dong).toBe("Hoặc hội viên năm 3.990.000 ₫: mở mọi chương Luận giải toàn bộ, 15 Sao tặng mỗi tháng — mua một lần, không tự gia hạn.");
  expect(dong).not.toMatch(CAM);
  expect(hienDongHoiVien(null)).toBe(false);
  expect(hienDongHoiVien(HOI_VIEN_MAC_DINH)).toBe(false);           // công tắc tắt
  expect(hienDongHoiVien(HV_BAT)).toBe(true);
  expect(hienDongHoiVien({ ...HV_BAT, dang_la: true })).toBe(false); // đã là hội viên → không mời nữa
  expect(loiGiaHan(hv)).toBeNull();                                  // còn 365 ngày
  expect(loiGiaHan({ ...hv, con_ngay: 31, gia_han_duoc: false })).toBeNull();
  const nhac = loiGiaHan({ ...hv, con_ngay: 30, gia_han_duoc: true })!;
  expect(nhac).toContain("còn 30 ngày");
  expect(nhac).toContain("không tự gia hạn");
  expect(nhac).not.toMatch(CAM);
  expect(loiGiaHan({ ...hv, con_ngay: 0, gia_han_duoc: true })).toContain("hết hạn hôm nay");
  expect(thuocTinhHoiVien(false)).toEqual({ kind: "hoi_vien", goi: "hoi_vien" });
  expect(thuocTinhHoiVien(true)).toEqual({ kind: "hoi_vien", goi: "hoi_vien_gia_han" });
  expect(locThuocTinh({ kind: "hoi_vien", goi: "hoi_vien", so_sao: 15 })).toEqual({ kind: "hoi_vien", goi: "hoi_vien", so_sao: 15 });
  // Chính sách hoàn tiền: 14 ngày / 100 %, tháng tròn, trừ câu hỏi chuyên gia, Sao tháng không thu hồi — khớp hoan_don_nap.
  expect(HOAN_TIEN_HOI_VIEN[0]).toMatch(/14 ngày/);
  expect(HOAN_TIEN_HOI_VIEN[0]).toMatch(/100%/);
  expect(HOAN_TIEN_HOI_VIEN[1]).toMatch(/tháng tròn còn lại/);
  expect(HOAN_TIEN_HOI_VIEN[1]).toMatch(/câu hỏi chuyên gia đã dùng/);
  expect(HOAN_TIEN_HOI_VIEN[1]).toMatch(/không bị thu hồi/);
  for (const t of HOAN_TIEN_HOI_VIEN) expect(t).not.toMatch(CAM);
});

test("cài đặt: hội viên mặc định TẮT, giá 3.990.000 (100.000–50.000.000), 15 Sao/tháng, 2 câu hỏi/năm; giá câu hỏi lẻ 199.000 dùng chung", () => {
  const bat = CAI_DAT.find((c) => c.khoa === "sao.hoi_vien.bat")!;
  const gia = CAI_DAT.find((c) => c.khoa === "sao.hoi_vien.gia_vnd")!;
  const sao = CAI_DAT.find((c) => c.khoa === "sao.hoi_vien.sao_thang")!;
  const cau = CAI_DAT.find((c) => c.khoa === "sao.hoi_vien.cau_hoi_nam")!;
  const cg = CAI_DAT.find((c) => c.khoa === "sao.chuyen_gia.gia_vnd")!;
  for (const c of [bat, gia, sao, cau]) expect(c.nhom).toBe("Hội viên năm");
  expect(cg.nhom).toBe("Hỏi chuyên gia");
  expect(giaTriHieuLuc(bat, {})).toBe(false);
  expect(giaTriHieuLuc(gia, {})).toBe(3990000);
  expect(giaTriHieuLuc(sao, {})).toBe(15);
  expect(giaTriHieuLuc(cau, {})).toBe(2);
  expect(giaTriHieuLuc(cg, {})).toBe(199000);
  expect(chuanHoa(gia, 100000).ok).toBe(true);
  expect(chuanHoa(gia, 99999).ok).toBe(false);
  expect(chuanHoa(gia, 50000001).ok).toBe(false);
  expect(chuanHoa(sao, 101).ok).toBe(false);
  expect(chuanHoa(cau, 13).ok).toBe(false);
  expect(giaTriHieuLuc(gia, { "sao.hoi_vien.gia_vnd": 5 })).toBe(3990000);   // ngoài khoảng → mặc định
});

test("/hoi-vien khi TẮT: vẫn có trang (noindex), H1 máy chủ, chỉ khung 'Sắp có' + lối quay về — không giá, không nút mua, không đếm ngược", async ({ page, request }) => {
  const html = await (await request.get("/hoi-vien")).text();
  expect(html).toMatch(/<h1[^>]*>Hội viên năm<\/h1>/);
  expect(html).toMatch(/<meta name="robots" content="noindex/);
  await page.goto("/hoi-vien");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Hội viên năm");
  // Rà UX mục 17: chưa mua được thì không bày giá to / quyền lợi / chính sách hoàn tiền như một trang bán hàng.
  const sapCo = page.getByTestId("hoi-vien-chua-mo");
  await expect(sapCo).toContainText("Sắp có");
  await expect(sapCo).toContainText("chưa mua được");
  await expect(sapCo.getByRole("link", { name: /Về Tài khoản/ })).toHaveAttribute("href", "/tai-khoan");
  await expect(sapCo.getByRole("link", { name: /Khám phá/ })).toHaveAttribute("href", "/kham-pha");
  await expect(page.getByTestId("gia-hoi-vien")).toHaveCount(0);
  await expect(page.getByTestId("hoi-vien-quyen-loi")).toHaveCount(0);
  await expect(page.getByTestId("nut-mua-hoi-vien")).toHaveCount(0);
  await expect(page.getByTestId("mua-hoi-vien")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("₫");
  await expect(page.locator("main")).not.toContainText(CAM);
  expect(html).not.toMatch(/line-through|<s>|<del>/);
  // Không có lối vào nào từ Tài khoản khi chưa mở (cũng không vào menu đầu trang).
  await page.goto("/tai-khoan");
  await expect(page.getByTestId("du-lieu-cua-toi")).toBeVisible();
  await expect(page.getByTestId("tk-dich-vu")).toHaveCount(0);
  await expect(page.locator('header a[href="/hoi-vien"], nav a[href="/hoi-vien"]')).toHaveCount(0);

  // Điều khoản: mục Hội viên năm nêu không tự gia hạn, hoàn tiền đúng chính sách, Sao tháng không cộng dồn.
  await page.goto("/dieu-khoan");
  const muc = page.locator("#hoi-vien");
  await expect(muc).toContainText("Không tự gia hạn");
  await expect(muc).toContainText("không cộng dồn");
  await expect(muc).toContainText("14 ngày");
  await expect(muc).toContainText("tháng tròn còn lại");
  await expect(muc).not.toContainText(CAM);
});

test("báo cáo với phi.ly_do = hoi_vien: đầy đủ, không nút mở khoá, không chương khoá, không hộp Sao", async ({ page }) => {
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: true, gia: 10 } }));
  await page.route("**/api/tuvi/luan-giai", (r) => r.fulfill({ json: {
    mo_dun: "tuvi", ket: "Kết.", trang_thai: "nhap_ai", dien_dat: "mau", so_khoa: 0,
    chuong: [
      { ma: "tong_quan", tieu_de: "Tổng quan bản mệnh", doan: ["Đoạn mở."] },
      { ma: "tinh_cam", tieu_de: "Tình cảm, hôn nhân", doan: ["Chương tình cảm mở nhờ hội viên."] },
      { ma: "van_han", tieu_de: "Vận hạn hiện tại", doan: ["Chương vận hạn mở nhờ hội viên."] },
    ],
    phi: { sao: 0, ly_do: "hoi_vien" },
  } }));
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  const bc = page.getByTestId("luan-giai-toan-bo");
  await expect(bc).toContainText("Chương tình cảm mở nhờ hội viên.");
  await expect(bc).toContainText("Chương vận hạn mở nhờ hội viên.");
  await expect(page.getByTestId("lg-chuong-khoa")).toHaveCount(0);
  await expect(page.getByTestId("lg-mo-khoa")).toHaveCount(0);
  await expect(page.getByTestId("lg-phan-khoa")).toHaveCount(0);
  await expect(page.getByTestId("hop-thoai-sao")).toHaveCount(0);
});

// Mỗi trường hợp một trang mới: dùng lại một trang thì lượt sau tự mở báo cáo (nhớ "quay về sau khi nạp") → nút đầu không còn.
async function hopNap(page: Page, hoi_vien: object | null) {
  await page.route("**/api/thanh-toan/goi", (r) => r.fulfill({ json: { cong: "payos", goi: GOI, gia_bao_cao: 29, nap_dau: null, hoi_vien } }));
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: true, gia: 29 } }));
  await page.route("**/api/tuvi/luan-giai", (r) => r.request().headers()["x-mo-khoa"] === "1"
    ? r.fulfill({ status: 402, json: { error: "Cần 29 Sao, ví bạn còn 3 Sao.", can: "nap", gia: 29, so_du: 3 } })
    : r.fulfill({ json: {
      mo_dun: "tuvi", ket: "Kết.", trang_thai: "nhap_ai", dien_dat: "mau", so_khoa: 1,
      chuong: [
        { ma: "tong_quan", tieu_de: "Tổng quan bản mệnh", doan: ["Đoạn mở miễn phí."] },
        { ma: "tinh_cam", tieu_de: "Tình cảm, hôn nhân", khoa: true, moi_xem: { diem_nhan: "Điểm nhấn", cau_hoi: "Bạn tìm gì?", so_doan: 3, phut_doc: 2 } },
      ],
      phi: { sao: 29, ly_do: "xem_truoc", khoa: true, dang_nhap: true, so_du: 3 },
    } }));
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  await page.getByTestId("lg-mo-khoa").click();
  const hop = page.getByTestId("hop-thoai-sao");
  await expect(hop).toHaveAttribute("data-can", "nap");
  await expect(hop.getByTestId("nap-nhanh-nut")).toBeVisible();
  return hop;
}

test("hộp nạp nhanh: công tắc hội viên bật + chưa là hội viên → một dòng 'Hoặc hội viên năm' trỏ /hoi-vien", async ({ page }) => {
  const hop = await hopNap(page, HV_BAT);
  await expect(hop.getByTestId("dong-hoi-vien")).toContainText("Hoặc hội viên năm 3.990.000 ₫");
  await expect(hop.getByTestId("dong-hoi-vien")).toContainText("không tự gia hạn");
  await expect(hop.getByTestId("dong-hoi-vien").getByRole("link")).toHaveAttribute("href", "/hoi-vien");
  await expect(hop.getByTestId("nap-nhanh")).not.toContainText(CAM);
});

test("hộp nạp nhanh: đã là hội viên → không có dòng hội viên", async ({ page }) => {
  const hop = await hopNap(page, { ...HV_BAT, dang_la: true });
  await expect(hop.getByTestId("dong-hoi-vien")).toHaveCount(0);
});

test("hộp nạp nhanh: chưa chạy 0028 / công tắc tắt → không có dòng hội viên", async ({ page }) => {
  const hop = await hopNap(page, null);
  await expect(hop.getByTestId("dong-hoi-vien")).toHaveCount(0);
});

test("/nap-sao khi chưa bật tài khoản: không có dòng hội viên (máy chủ không hứa điều chưa làm)", async ({ page }) => {
  await page.goto("/nap-sao");
  await expect(page.getByTestId("nap-sao")).toBeVisible();
  await expect(page.getByTestId("dong-hoi-vien")).toHaveCount(0);
});
