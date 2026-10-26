// SAO-HH (migration 0030, phần 2) — huy hiệu thành tựu: bản hợp pháp thay "token" (docs/CO-CHE-RUI-RO-VA-THAY-THE.md §3).
// Huy hiệu KHÔNG mua bán, KHÔNG chuyển cho ai, KHÔNG đổi ra Sao hay tiền — chỉ là dấu mốc hiện trên hồ sơ của chính
// người đó. Hai nguồn:
//   · máy chủ (huy_hieu_cua_toi(), chỉ khi đã đăng nhập): tính từ dữ liệu sẵn có, không bảng mới;
//   · máy này (localStorage, khách hay đã đăng nhập đều có): chuỗi đếm trên máy, các mảng đã xem, "Hẹn với chính mình".
// Hàm thuần (không React) để trang, route và e2e dùng chung.

export const MA_HUY_HIEU_MAY_CHU = ["chuoi_7", "chuoi_30", "da_luu_ho_so", "hoi_3", "moi_1", "moi_5", "hoi_vien"] as const;
export type MaHuyHieuMayChu = (typeof MA_HUY_HIEU_MAY_CHU)[number];
export const MA_HUY_HIEU_MAY = ["chuoi_may_7", "doc_5_mang", "hen_7", "hen_30"] as const;
export type MaHuyHieuMay = (typeof MA_HUY_HIEU_MAY)[number];
export type MaHuyHieu = MaHuyHieuMayChu | MaHuyHieuMay;

/** Một dòng huy_hieu_cua_toi(): dat = đã đạt, luc = ngày đạt (yyyy-mm-dd) khi suy được. */
export interface HuyHieuMayChu { ma: MaHuyHieuMayChu; dat: boolean; luc: string | null }
/** Huy hiệu đã gom cho hiển thị. nguon: tai_khoan = máy chủ, may = chỉ trên máy này. */
export interface HuyHieu { ma: MaHuyHieu; dat: boolean; luc: string | null; nguon: "tai_khoan" | "may" }

/** GET /api/sao/huy-hieu */
export type TrangThaiHuyHieu =
  | { tai_khoan: false }
  | { tai_khoan: true; dang_nhap: false }
  | { tai_khoan: true; dang_nhap: true; san_sang: false }
  | { tai_khoan: true; dang_nhap: true; san_sang: true; huy_hieu: HuyHieuMayChu[] };

/** Danh mục: tên, điều kiện (hiện khi chưa đạt), biểu tượng (tên lucide, web ánh xạ). Giọng mời, không doạ, không thúc. */
export const DANH_MUC: Record<MaHuyHieu, { ten: string; dieu_kien: string; bieu_tuong: string }> = {
  chuoi_7:      { ten: "Bảy ngày đều đặn", dieu_kien: "Ghé Hôm nay 7 ngày liên tiếp (tính theo tài khoản).", bieu_tuong: "Flame" },
  chuoi_30:     { ten: "Một tháng bên mình", dieu_kien: "Ghé Hôm nay 30 ngày liên tiếp (tính theo tài khoản).", bieu_tuong: "CalendarCheck" },
  da_luu_ho_so: { ten: "Có chỗ của riêng mình", dieu_kien: "Lưu hồ sơ vào tài khoản.", bieu_tuong: "Cloud" },
  hoi_3:        { ten: "Người hay hỏi", dieu_kien: "Hỏi 3 câu ở bất kỳ mảng nào khi đã đăng nhập.", bieu_tuong: "MessageCircle" },
  moi_1:        { ten: "Rủ được một người", dieu_kien: "Một người bạn mở link mời của bạn và lưu hồ sơ.", bieu_tuong: "UserPlus" },
  moi_5:        { ten: "Người kết nối", dieu_kien: "Năm người bạn lưu hồ sơ từ link mời của bạn.", bieu_tuong: "Users" },
  hoi_vien:     { ten: "Hội viên", dieu_kien: "Đang là hội viên năm.", bieu_tuong: "BadgeCheck" },
  chuoi_may_7:  { ten: "Bảy ngày trên máy này", dieu_kien: "Mở Hôm nay 7 ngày liên tiếp trên máy này.", bieu_tuong: "Flame" },
  doc_5_mang:   { ten: "Đi đủ năm mảng", dieu_kien: "Xem kết quả ở cả Thần số, Tử vi, Bát tự, Kinh Dịch và Phong thuỷ.", bieu_tuong: "Compass" },
  hen_7:        { ten: "Giữ lời hẹn 7 ngày", dieu_kien: "Đặt hẹn với chính mình 7 ngày ghé và đi hết.", bieu_tuong: "HeartHandshake" },
  hen_30:       { ten: "Giữ lời hẹn 30 ngày", dieu_kien: "Đặt hẹn với chính mình 30 ngày ghé và đi hết.", bieu_tuong: "Trophy" },
};
/** Dòng ghi rõ bản chất — hiện cạnh khối huy hiệu. */
export const CAU_BAN_CHAT = "Huy hiệu chỉ là dấu mốc của riêng bạn — không mua bán, không chuyển cho ai, không đổi ra Sao hay tiền.";

// ---------------------------------------------------------------- trên máy này
/** Năm mảng cần xem để đạt doc_5_mang (mã mo_dun của reading_started; thanso_sau tính là thanso). */
export const NAM_MANG = ["thanso", "tuvi", "battu", "kinhdich", "phongthuy"] as const;
const KHOA_MANG = "hbt.mang_da_xem.v1";
const KHOA_CHUOI_MAY = "hbt.hom_nay";   // HN-1: { ngay, chuoi } — app/hom-nay/HomNay.tsx ghi
export const KHOA_HEN = "hbt.hen.v1";
export const KHOA_HUY_HIEU_MAY = "hbt.huy_hieu_may.v1";

const docJson = <T,>(khoa: string): T | null => {
  try { return JSON.parse(localStorage.getItem(khoa) ?? "null") as T | null; } catch { return null; }
};
const ghiJson = (khoa: string, v: unknown) => { try { localStorage.setItem(khoa, JSON.stringify(v)); } catch { /* chế độ riêng tư */ } };

/** Ghi nhận một mảng đã xem kết quả (gọi từ reading_started). Chỉ giữ mã trong NAM_MANG. */
export function ghiMangDaXem(moDun: string): void {
  const ma = moDun === "thanso_sau" ? "thanso" : moDun;
  if (!(NAM_MANG as readonly string[]).includes(ma)) return;
  const cu = docMangDaXem();
  if (cu.includes(ma)) return;
  ghiJson(KHOA_MANG, [...cu, ma]);
}
export function docMangDaXem(): string[] {
  const v = docJson<unknown>(KHOA_MANG);
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && (NAM_MANG as readonly string[]).includes(x)) : [];
}

/** "Hẹn với chính mình": một lúc một hẹn, lưu trên máy. chuoi_bd = chuỗi lúc đặt hẹn (tiến độ = chuỗi − chuoi_bd + 1). */
export interface HenChinhMinh { muc: 7 | 30; ngay_bd: string; chuoi_bd: number; dat_luc?: string }
export function docHen(): HenChinhMinh | null {
  const v = docJson<Partial<HenChinhMinh>>(KHOA_HEN);
  return v && (v.muc === 7 || v.muc === 30) && typeof v.ngay_bd === "string" && typeof v.chuoi_bd === "number"
    ? { muc: v.muc, ngay_bd: v.ngay_bd, chuoi_bd: v.chuoi_bd, ...(typeof v.dat_luc === "string" ? { dat_luc: v.dat_luc } : {}) } : null;
}
export const ghiHen = (h: HenChinhMinh | null) => { if (h) ghiJson(KHOA_HEN, h); else { try { localStorage.removeItem(KHOA_HEN); } catch { /* bỏ qua */ } } };

/** Tiến độ hẹn theo chuỗi hiện tại. lo = chuỗi đã đứt từ lúc đặt hẹn (chuỗi nhỏ hơn lúc bắt đầu) → mời "Hẹn lại từ hôm nay". */
export function tienDoHen(h: HenChinhMinh, chuoi: number): { ngay: number; dat: boolean; lo: boolean } {
  if (h.dat_luc) return { ngay: h.muc, dat: true, lo: false };
  if (chuoi < h.chuoi_bd) return { ngay: 0, dat: false, lo: true };
  const ngay = Math.min(h.muc, chuoi - h.chuoi_bd + 1);
  return { ngay, dat: ngay >= h.muc, lo: false };
}

/** Huy hiệu máy đã cấp (hen_7 / hen_30) — { ma: ngày đạt }. */
export function docHuyHieuMay(): Partial<Record<MaHuyHieuMay, string>> {
  const v = docJson<Record<string, unknown>>(KHOA_HUY_HIEU_MAY);
  const kq: Partial<Record<MaHuyHieuMay, string>> = {};
  if (v && typeof v === "object") for (const m of MA_HUY_HIEU_MAY) if (typeof v[m] === "string") kq[m] = v[m] as string;
  return kq;
}
/** Cấp huy hiệu máy (một lần — đã có thì giữ ngày cũ). Trả true nếu vừa cấp mới. */
export function capHuyHieuMay(ma: MaHuyHieuMay, ngay: string): boolean {
  const cu = docHuyHieuMay();
  if (cu[ma]) return false;
  ghiJson(KHOA_HUY_HIEU_MAY, { ...cu, [ma]: ngay });
  return true;
}

/** Gom huy hiệu máy từ localStorage: chuỗi máy ≥ 7, đủ 5 mảng, hẹn đã đạt. */
export function huyHieuMay(): HuyHieu[] {
  const chuoi = docJson<{ ngay?: string; chuoi?: number }>(KHOA_CHUOI_MAY);
  const soChuoi = chuoi && typeof chuoi.chuoi === "number" ? chuoi.chuoi : 0;
  const mang = docMangDaXem();
  const da = docHuyHieuMay();
  const ngayChuoi = chuoi && typeof chuoi.ngay === "string" ? chuoi.ngay : null;
  return [
    { ma: "chuoi_may_7", dat: soChuoi >= 7, luc: soChuoi >= 7 ? ngayChuoi : null, nguon: "may" },
    { ma: "doc_5_mang", dat: mang.length >= NAM_MANG.length, luc: null, nguon: "may" },
    { ma: "hen_7", dat: Boolean(da.hen_7), luc: da.hen_7 ?? null, nguon: "may" },
    { ma: "hen_30", dat: Boolean(da.hen_30), luc: da.hen_30 ?? null, nguon: "may" },
  ];
}

/** Gộp máy chủ (nếu có) + máy. Chưa đăng nhập: chỉ huy hiệu máy. hoi_vien chỉ hiện khi đã đạt (chưa có hội viên thì không gợi). */
export function gopHuyHieu(mayChu: HuyHieuMayChu[] | null, may: HuyHieu[]): HuyHieu[] {
  const mc: HuyHieu[] = (mayChu ?? [])
    .filter((h) => (MA_HUY_HIEU_MAY_CHU as readonly string[]).includes(h.ma) && (h.ma !== "hoi_vien" || h.dat))
    .map((h) => ({ ma: h.ma, dat: Boolean(h.dat), luc: typeof h.luc === "string" ? h.luc : null, nguon: "tai_khoan" }));
  // Đã có chuỗi tài khoản thì chuỗi máy chỉ là bản phụ: ẩn khi tài khoản đã đạt chuoi_7.
  const anChuoiMay = mc.some((h) => h.ma === "chuoi_7" && h.dat);
  return [...mc, ...may.filter((h) => !(anChuoiMay && h.ma === "chuoi_may_7"))];
}

export const demDat = (ds: HuyHieu[]) => ds.filter((h) => h.dat).length;
