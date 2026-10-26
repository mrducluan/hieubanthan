// SAO-ND (migration 0027) — thiết kế lần nạp đầu: gói "Khởi đầu" vừa 1 báo cáo + tặng Sao lần nạp đầu, ghi VND + "≈ N
// báo cáo" cạnh số Sao, đo checkout_started{goi, lan_dau}. Quy tắc máy chủ (một lần / tài khoản, hoàn tiền thu hồi, hoa
// hồng tính trên Sao gói, công tắc mặc định tắt) kiểm ở supabase/kiem_thu/thu_nap_dau_0027.sql. Ở đây: phần thuần + giao
// diện với máy chủ giả lập bằng page.route (e2e không có Supabase).
import { test, expect, type Page } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { CAI_DAT, chuanHoa, giaTriHieuLuc } from "../lib/cau-hinh";
import { locThuocTinh } from "../lib/do-luong";
import {
  GOI_KHOI_DAU, dongNapDau, goiGoiY, goiMacDinh, hienNapDau, saoTangLanDau, soBaoCao, thuocTinhNap,
} from "../lib/thanh-toan/nap-dau";

const GOI = [
  { ma: "khoi_dau", ten: "Khởi đầu", gia_vnd: 12000, sao: 12, nhan: "Vừa 1 báo cáo", mo_ta: "Đủ mở 1 Luận giải toàn bộ" },
  { ma: "thu", ten: "Thử", gia_vnd: 29000, sao: 30, nhan: null, mo_ta: "Đủ 3 lần Luận giải toàn bộ" },
  { ma: "pho_bien", ten: "Phổ biến", gia_vnd: 99000, sao: 110, nhan: "Phổ biến", mo_ta: "Tặng thêm 10%" },
  { ma: "gia_dinh", ten: "Gia đình", gia_vnd: 199000, sao: 240, nhan: null, mo_ta: "Tặng thêm 20%" },
];
const CAM = /chỉ còn|còn \d+ suất|hết hạn sau|đếm ngược|nhanh tay|kẻo lỡ|duy nhất hôm nay/i;

test("thuần: Sao tặng lần đầu cùng công thức SQL (floor, kẹp 100), số báo cáo, gói gợi ý / mặc định", () => {
  expect(saoTangLanDau(240, 20)).toBe(48);
  expect(saoTangLanDau(12, 20)).toBe(2);
  expect(saoTangLanDau(30, 150)).toBe(30);
  expect(saoTangLanDau(30, 0)).toBe(0);
  expect(soBaoCao(12, 10)).toBe(1);
  expect(soBaoCao(110, 10)).toBe(11);
  expect(soBaoCao(30, 0)).toBe(0);
  // Thiếu 7 Sao → gói nhỏ nhất đủ dùng là Khởi đầu (12 Sao), không bắt nạp dư 30 Sao.
  expect(goiGoiY(GOI, 7)?.ma).toBe(GOI_KHOI_DAU);
  expect(goiGoiY(GOI.slice(1), 7)?.ma).toBe("thu");
  expect(goiGoiY(GOI, 100)?.ma).toBe("pho_bien");
  expect(goiGoiY(GOI, 999)?.ma).toBe("pho_bien");   // không gói nào đủ → gói có nhãn, không phải Khởi đầu
  // Trang /nap-sao: chọn sẵn vẫn là gói "Phổ biến" như cũ, không đổi sang gói nhỏ.
  expect(goiMacDinh(GOI)?.ma).toBe("pho_bien");
});

test("thuần: dòng tặng lần đầu chỉ khi bật + chưa từng nạp, lời trung tính; thuộc tính đo", () => {
  expect(hienNapDau(null)).toBe(false);
  expect(hienNapDau({ bat: false, phan_tram: 20, lan_dau: true })).toBe(false);
  expect(hienNapDau({ bat: true, phan_tram: 0, lan_dau: true })).toBe(false);
  expect(hienNapDau({ bat: true, phan_tram: 20, lan_dau: false })).toBe(false);
  expect(hienNapDau({ bat: true, phan_tram: 20, lan_dau: true })).toBe(true);
  expect(hienNapDau({ bat: true, phan_tram: 20, lan_dau: null })).toBe(true);   // khách: câu chung "mỗi tài khoản"
  const dong = dongNapDau({ bat: true, phan_tram: 20, lan_dau: true });
  expect(dong).toBe("Lần nạp đầu tặng thêm 20% Sao (Sao tặng, hạn 365 ngày).");
  expect(dongNapDau({ bat: true, phan_tram: 20, lan_dau: null })).toContain("mỗi tài khoản");
  expect(dong).not.toMatch(CAM);
  expect(thuocTinhNap("khoi_dau", { bat: true, phan_tram: 20, lan_dau: true })).toEqual({ kind: "khoi_dau", goi: "khoi_dau", lan_dau: 1 });
  expect(thuocTinhNap("thu", { bat: false, phan_tram: 20, lan_dau: false })).toEqual({ kind: "thu", goi: "thu", lan_dau: 0 });
  expect(thuocTinhNap("thu", null)).toEqual({ kind: "thu", goi: "thu" });
  // Bộ lọc PostHog giữ đúng hai thuộc tính mới.
  expect(locThuocTinh({ kind: "thu", goi: "thu", lan_dau: 1, nguon: "nap_nhanh" }))
    .toEqual({ kind: "thu", goi: "thu", lan_dau: 1, nguon: "nap_nhanh" });
});

test("cài đặt: gói Khởi đầu + tặng lần nạp đầu mặc định TẮT, tỉ lệ kẹp 0–100 mặc định 20", () => {
  const goi = CAI_DAT.find((c) => c.khoa === "sao.goi_khoi_dau.bat")!;
  const bat = CAI_DAT.find((c) => c.khoa === "sao.nap_dau.bat")!;
  const pt = CAI_DAT.find((c) => c.khoa === "sao.nap_dau.phan_tram")!;
  for (const c of [goi, bat, pt]) expect(c.nhom).toBe("Nạp Sao");
  expect(giaTriHieuLuc(goi, {})).toBe(false);
  expect(giaTriHieuLuc(bat, {})).toBe(false);
  expect(giaTriHieuLuc(pt, {})).toBe(20);
  expect(chuanHoa(pt, 100).ok).toBe(true);
  expect(chuanHoa(pt, 101).ok).toBe(false);
  expect(giaTriHieuLuc(pt, { "sao.nap_dau.phan_tram": 150 })).toBe(20);
});

test("/nap-sao chưa bật tài khoản: ghi VND + ≈ N báo cáo, chọn sẵn Phổ biến, không có dòng tặng; Điều khoản nêu Sao tặng lần đầu", async ({ page }) => {
  await page.goto("/nap-sao");
  await expect(page.getByTestId("goi-thu")).toContainText("29.000 ₫");
  await expect(page.getByTestId("goi-thu")).toContainText("≈ 3 báo cáo Luận giải toàn bộ");
  await expect(page.getByTestId("goi-gia_dinh")).toContainText("≈ 24 báo cáo");
  await expect(page.locator('input[value="pho_bien"]')).toBeChecked();
  await expect(page.getByTestId("nap-dau")).toHaveCount(0);
  await expect(page.getByTestId("sao-tang-dau")).toHaveCount(0);
  await expect(page.getByTestId("nap-sao")).not.toContainText(CAM);

  await page.goto("/dieu-khoan");
  const sao = page.locator("#sao");
  await expect(sao).toContainText("Tặng lần nạp đầu");
  await expect(sao).toContainText("một lần mỗi tài khoản");
  await expect(sao).toContainText("hoàn tiền");
});

async function moHopNap(page: Page, napDau: object | null) {
  await page.route("**/api/thanh-toan/goi", (r) => r.fulfill({ json: { cong: "payos", goi: GOI, gia_bao_cao: 10, nap_dau: napDau } }));
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: true, gia: 10 } }));
  await page.route("**/api/tuvi/luan-giai", (r) => r.request().headers()["x-mo-khoa"] === "1"
    ? r.fulfill({ status: 402, json: { error: "Cần 10 Sao, ví bạn còn 3 Sao.", can: "nap", gia: 10, so_du: 3 } })
    : r.fulfill({ json: {
      mo_dun: "tuvi", ket: "Kết.", trang_thai: "nhap_ai", dien_dat: "mau", so_khoa: 1,
      chuong: [
        { ma: "tong_quan", tieu_de: "Tổng quan bản mệnh", doan: ["Đoạn mở miễn phí."] },
        { ma: "tinh_cam", tieu_de: "Tình cảm, hôn nhân", khoa: true,
          moi_xem: { diem_nhan: "Điểm nhấn", cau_hoi: "Bạn tìm gì?", so_doan: 3, phut_doc: 2 } },
      ],
      phi: { sao: 10, ly_do: "xem_truoc", khoa: true, dang_nhap: true, so_du: 3 },
    } }));
  await napHoSo(page);
  await page.goto("/tu-vi");
  await page.getByRole("button", { name: "Đọc miễn phí chương đầu" }).click();
  await page.getByTestId("lg-mo-khoa").click();
  const hop = page.getByTestId("hop-thoai-sao");
  await expect(hop).toHaveAttribute("data-can", "nap");
  return hop;
}

test("hộp nạp nhanh: thiếu 7 Sao → gợi ý gói Khởi đầu 12.000 ₫; lần đầu thấy dòng tặng 20% + số Sao tặng từng gói", async ({ page }) => {
  const hop = await moHopNap(page, { bat: true, phan_tram: 20, lan_dau: true });
  await expect(hop.getByTestId("nap-nhanh-nut")).toHaveText(/Quét QR nạp 12 Sao · 12\.000/);
  await expect(hop.getByTestId("nap-dau")).toHaveText("Lần nạp đầu tặng thêm 20% Sao (Sao tặng, hạn 365 ngày).");
  await expect(hop.getByTestId("goi-nhanh-gia_dinh")).toContainText("+48 tặng");
  await expect(hop.getByTestId("goi-nhanh-gia_dinh")).toContainText("199.000 ₫");
  await expect(hop.getByTestId("goi-nhanh-khoi_dau")).toContainText("≈ 1 báo cáo");
  await expect(hop.getByTestId("goi-nhanh-thu")).toContainText("≈ 3 báo cáo");
  await expect(hop.getByTestId("nap-nhanh")).not.toContainText(CAM);
});

test("hộp nạp nhanh: đã từng nạp (hoặc công tắc tắt) → không có dòng tặng, vẫn ghi VND + ≈ N báo cáo", async ({ page }) => {
  const hop = await moHopNap(page, { bat: true, phan_tram: 20, lan_dau: false });
  await expect(hop.getByTestId("nap-nhanh-nut")).toHaveText(/Quét QR nạp 12 Sao · 12\.000/);
  await expect(hop.getByTestId("nap-dau")).toHaveCount(0);
  await expect(hop.getByTestId("goi-nhanh-gia_dinh")).not.toContainText("+48");
  await expect(hop.getByTestId("goi-nhanh-pho_bien")).toContainText("≈ 11 báo cáo");
});
