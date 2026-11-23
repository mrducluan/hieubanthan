// UD-1 — đợt ưu đãi có hạn cho Luận giải toàn bộ (docs/UU-DAI-CO-HAN.md). Khoá nguyên tắc "mọi con số đều thật":
// giá gạch = giá thường, đồng hồ theo hạn chót, suất đếm thật; thiếu hạn / hết hạn / hết suất → KHÔNG có ưu đãi.
// Máy chủ giả lập bằng page.route (e2e không có Supabase).
import { test, expect } from "@playwright/test";
import { napHoSo } from "./_hoso";
import { conLai, hetLuc, loiTietKiem, tinhUuDai, type CauHinhUuDai } from "../lib/uu-dai";

const C: CauHinhUuDai = { bat: true, ten: "Ưu đãi mở bán", giamPt: 30, hetHan: "2026-11-30", soSuat: 100, ma: "mb2611" };
const LUC = Date.parse("2026-11-20T10:00:00+07:00");

test("thuần: giá, hạn chót, suất", () => {
  const u = tinhUuDai(C, 99, 61, LUC)!;
  expect([u.gia, u.gia_goc, u.tiet_kiem, u.giam_pt, u.con_suat, u.tong_suat]).toEqual([69, 99, 30, 30, 39, 100]);
  expect(loiTietKiem(u)).toBe("Tiết kiệm 30 Sao (giảm 30%)");
  expect(u.het_luc).toBe(new Date("2026-11-30T23:59:59+07:00").toISOString());
  // Tắt · thiếu hạn · hạn sai · quá hạn · hết suất · mức 0 → không có ưu đãi.
  expect(tinhUuDai({ ...C, bat: false }, 99, 0, LUC)).toBeNull();
  expect(tinhUuDai({ ...C, hetHan: "" }, 99, 0, LUC)).toBeNull();
  expect(tinhUuDai({ ...C, hetHan: "2026-02-31" }, 99, 0, LUC)).toBeNull();
  expect(tinhUuDai(C, 99, 0, Date.parse("2026-12-01T00:00:01+07:00"))).toBeNull();
  expect(tinhUuDai(C, 99, 100, LUC)).toBeNull();
  expect(tinhUuDai({ ...C, giamPt: 0 }, 99, 0, LUC)).toBeNull();
  // Mức giảm bị kẹp 50%; không giới hạn suất hoặc không đếm được → không có dòng suất (không bịa số).
  expect(tinhUuDai({ ...C, giamPt: 90 }, 100, 0, LUC)!.gia).toBe(50);
  expect(tinhUuDai({ ...C, soSuat: 0 }, 99, null, LUC)!.con_suat).toBeNull();
  expect(tinhUuDai(C, 99, null, LUC)!.con_suat).toBeNull();
  expect(hetLuc("30/11/2026")).toBeNull();
  expect(conLai(u.het_luc, LUC)).toEqual({ ngay: 10, gio: 13, phut: 59, giay: 59 });
  expect(conLai(u.het_luc, Date.parse(u.het_luc) + 1)).toBeNull();
});

const MOI = (cau: string) => ({ diem_nhan: "Trong lá số của bạn, Thiên Đồng ở cung Phu Thê", cau_hoi: cau, so_doan: 4, phut_doc: 3 });
const xemTruoc = (uuDai: object | null) => ({
  mo_dun: "tuvi", ket: "Kết.", trang_thai: "nhap_ai", dien_dat: "mau", so_khoa: 1,
  chuong: [
    { ma: "tong_quan", tieu_de: "Tổng quan bản mệnh", doan: ["Đoạn mở miễn phí."] },
    { ma: "tinh_cam", tieu_de: "Tình cảm, hôn nhân", khoa: true, moi_xem: MOI("Bạn thật sự tìm gì ở người bạn đời?") },
  ],
  phi: { sao: uuDai ? 69 : 99, ly_do: "xem_truoc", khoa: true, dang_nhap: false, so_du: null, thuong_chao_mung: 10, ...(uuDai ? { uu_dai: uuDai } : {}) },
});

test("thanh mở khoá: có ưu đãi → giá gạch, tiết kiệm, đồng hồ, suất; gửi kèm giá đang thấy", async ({ page }) => {
  const u = tinhUuDai({ ...C, hetHan: "2099-12-31" }, 99, 61)!;
  let giaThay: string | undefined;
  await page.route("**/api/sao/muc", (r) => r.fulfill({ json: { moi_ban: 33, duoc_moi: 33, chao_mung: 10, tran: 20 } }));
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: true, gia: 69, uu_dai: u } }));
  // CRO-2: Tử vi tự tải chương 1 — giữ lượt tải đầu lại để kiểm dòng giá của khung chờ, rồi mới trả bài.
  let tha!: () => void;
  const cho = new Promise<void>((x) => { tha = x; });
  await page.route("**/api/tuvi/luan-giai", async (r) => {
    await cho;
    const h = r.request().headers();
    if (h["x-mo-khoa"] === "1") { giaThay = h["x-gia-thay"]; return r.fulfill({ status: 402, json: { error: "Đăng nhập để mở toàn bộ báo cáo (69 Sao).", can: "dang_nhap", gia: 69, thuong: 10 } }); }
    return r.fulfill({ json: xemTruoc(u) });
  });
  await napHoSo(page);
  await page.goto("/tu-vi");
  await expect(page.getByTestId("gia-luan-giai")).toContainText("69 Sao");
  await expect(page.getByTestId("gia-luan-giai").locator("s")).toHaveText("99 Sao");
  tha();
  await expect(page.getByTestId("luan-giai-toan-bo")).toBeVisible({ timeout: 60_000 });   // CRO-2: Tử vi tự mở chương 1 (không còn nút)
  const hop = page.getByTestId("lg-hop-mo");
  await expect(hop).toBeVisible();
  await expect(hop.locator("s")).toHaveText("99 Sao");
  await expect(page.getByTestId("lg-tiet-kiem")).toHaveText("Tiết kiệm 30 Sao (giảm 30%)");
  await expect(hop.getByTestId("ud-dem-nguoc")).toBeVisible();
  await expect(hop.getByTestId("ud-con-suat")).toContainText("Còn 39/100 suất");
  await expect(page.getByTestId("lg-mo-khoa")).toHaveText(/Mở toàn bộ · 69 Sao/);
  await page.getByTestId("lg-mo-khoa").click();
  await expect.poll(() => giaThay).toBe("69");
});

test("không có ưu đãi → không gạch giá, không đồng hồ, không dòng suất", async ({ page }) => {
  await page.route("**/api/sao/muc", (r) => r.fulfill({ json: { moi_ban: 33, duoc_moi: 33, chao_mung: 10, tran: 20 } }));
  await page.route("**/api/luan-giai/phi*", (r) => r.fulfill({ json: { thu: true, gia: 99 } }));
  await page.route("**/api/tuvi/luan-giai", (r) => r.fulfill({ json: xemTruoc(null) }));
  await napHoSo(page);
  await page.goto("/tu-vi");
  await expect(page.getByTestId("luan-giai-toan-bo")).toBeVisible({ timeout: 60_000 });   // CRO-2: Tử vi tự mở chương 1 (không còn nút)
  const hop = page.getByTestId("lg-hop-mo");
  await expect(hop).toContainText("99 Sao");
  await expect(hop.locator("s")).toHaveCount(0);
  await expect(page.getByTestId("ud-dem-nguoc")).toHaveCount(0);
  await expect(page.getByTestId("ud-con-suat")).toHaveCount(0);
  await expect(page.getByTestId("lg-uu-dai")).toHaveCount(0);
});
