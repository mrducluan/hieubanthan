// SAO-HH (migration 0030, phần 2) — huy hiệu thành tựu: bản hợp pháp thay "token" (docs/CO-CHE-RUI-RO-VA-THAY-THE.md §3).
// Huy hiệu KHÔNG mua bán, KHÔNG chuyển cho ai, KHÔNG đổi ra Sao hay tiền — chỉ là dấu mốc hiện trên hồ sơ của chính
// người đó. Hai nguồn:
//   · máy chủ (huy_hieu_cua_toi(), chỉ khi đã đăng nhập): tính từ dữ liệu sẵn có, không bảng mới;
//   · máy này (localStorage, khách hay đã đăng nhập đều có): chuỗi đếm trên máy, các mảng đã xem, "Hẹn với chính mình".
// Hàm thuần (không React) để trang, route và e2e dùng chung.

import { docNhatKy, maHoSo, thangDu9 } from "@/lib/nhat-ky-ngay";

export const MA_HUY_HIEU_MAY_CHU = ["chuoi_7", "chuoi_30", "da_luu_ho_so", "hoi_3", "moi_1", "moi_5", "hoi_vien", "du_9_nhip"] as const;
export type MaHuyHieuMayChu = (typeof MA_HUY_HIEU_MAY_CHU)[number];
export const MA_HUY_HIEU_MAY = ["chuoi_may_7", "doc_5_mang", "hen_7", "hen_30", "du_9_nhip_may"] as const;
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
  chuoi_7:      { ten: "Ghé 7 ngày liền", dieu_kien: "Ghé Hôm nay 7 ngày liên tiếp (tính theo tài khoản).", bieu_tuong: "Flame" },
  chuoi_30:     { ten: "Ghé 30 ngày liền", dieu_kien: "Ghé Hôm nay 30 ngày liên tiếp (tính theo tài khoản).", bieu_tuong: "CalendarCheck" },
  da_luu_ho_so: { ten: "Lưu hồ sơ vào tài khoản", dieu_kien: "Lưu hồ sơ vào tài khoản.", bieu_tuong: "Cloud" },
  hoi_3:        { ten: "Hỏi 3 câu", dieu_kien: "Hỏi 3 câu ở bất kỳ mảng nào khi đã đăng nhập.", bieu_tuong: "MessageCircle" },
  moi_1:        { ten: "Rủ được 1 người bạn", dieu_kien: "Một người bạn mở link mời của bạn và lưu hồ sơ.", bieu_tuong: "UserPlus" },
  moi_5:        { ten: "Rủ được 5 người bạn", dieu_kien: "Năm người bạn lưu hồ sơ từ link mời của bạn.", bieu_tuong: "Users" },
  hoi_vien:     { ten: "Hội viên", dieu_kien: "Đang là hội viên năm.", bieu_tuong: "BadgeCheck" },
  chuoi_may_7:  { ten: "Ghé 7 ngày liền", dieu_kien: "Mở trang Hôm nay 7 ngày liên tiếp.", bieu_tuong: "Flame" },
  doc_5_mang:   { ten: "Xem đủ 5 mảng", dieu_kien: "Xem kết quả ở cả Thần số, Tử vi, Bát tự, Kinh Dịch và Phong thuỷ.", bieu_tuong: "Compass" },
  hen_7:        { ten: "Giữ lời hẹn 7 ngày", dieu_kien: "Đặt hẹn với chính mình 7 ngày ghé và đi hết.", bieu_tuong: "HeartHandshake" },
  hen_30:       { ten: "Giữ lời hẹn 30 ngày", dieu_kien: "Đặt hẹn với chính mình 30 ngày ghé và đi hết.", bieu_tuong: "Trophy" },
  // KV-THANG: đi qua đủ 9 số ngày cá nhân (1–9) trong một tháng — không cần liên tiếp, không đếm ngược; tài khoản (0032) / máy.
  du_9_nhip:     { ten: "Đủ 9 nhịp một tháng", dieu_kien: "Ghé Hôm nay ở đủ 9 số ngày cá nhân trong một tháng (tính theo tài khoản).", bieu_tuong: "Orbit" },
  du_9_nhip_may: { ten: "Đủ 9 nhịp một tháng", dieu_kien: "Ghé Hôm nay ở đủ 9 số ngày cá nhân trong một tháng.", bieu_tuong: "Orbit" },
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

/** "Hẹn với chính mình": một lúc một hẹn, lưu trên máy. chuoi_bd = chuỗi lúc đặt hẹn (tiến độ = chuỗi − chuoi_bd + 1).
 *  tien_do / tien_do_luc: tiến độ lần gần nhất trang Hôm nay tính được (đúng nguồn chuỗi tài khoản/máy) — Bản thân chỉ đọc. */
export interface HenChinhMinh { muc: 7 | 30; ngay_bd: string; chuoi_bd: number; dat_luc?: string; tien_do?: number; tien_do_luc?: string }
export function docHen(): HenChinhMinh | null {
  const v = docJson<Partial<HenChinhMinh>>(KHOA_HEN);
  return v && (v.muc === 7 || v.muc === 30) && typeof v.ngay_bd === "string" && typeof v.chuoi_bd === "number"
    ? { muc: v.muc, ngay_bd: v.ngay_bd, chuoi_bd: v.chuoi_bd, ...(typeof v.dat_luc === "string" ? { dat_luc: v.dat_luc } : {}),
        ...(typeof v.tien_do === "number" && typeof v.tien_do_luc === "string" ? { tien_do: v.tien_do, tien_do_luc: v.tien_do_luc } : {}) } : null;
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

/** Gom huy hiệu máy từ localStorage: chuỗi máy ≥ 7, đủ 5 mảng, hẹn đã đạt, đủ 9 nhịp (nhật ký ghé của hồ sơ này). */
export function huyHieuMay(hoSo?: Parameters<typeof maHoSo>[0] | null): HuyHieu[] {
  const du9 = hoSo ? thangDu9(docNhatKy(hoSo)) : null;
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
    { ma: "du_9_nhip_may", dat: Boolean(du9), luc: du9?.ngay_cuoi ?? null, nguon: "may" },
  ];
}

/** Gộp máy chủ (nếu có) + máy. Chưa đăng nhập: chỉ huy hiệu máy. hoi_vien chỉ hiện khi đã đạt (chưa có hội viên thì không gợi). */
export function gopHuyHieu(mayChu: HuyHieuMayChu[] | null, may: HuyHieu[]): HuyHieu[] {
  const mc: HuyHieu[] = (mayChu ?? [])
    .filter((h) => (MA_HUY_HIEU_MAY_CHU as readonly string[]).includes(h.ma) && (h.ma !== "hoi_vien" || h.dat))
    .map((h) => ({ ma: h.ma, dat: Boolean(h.dat), luc: typeof h.luc === "string" ? h.luc : null, nguon: "tai_khoan" }));
  // Đã có bản tài khoản thì bản máy chỉ là bản phụ: ẩn khi tài khoản đã đạt (chuoi_7 ↔ chuoi_may_7, du_9_nhip ↔ du_9_nhip_may).
  const anChuoiMay = mc.some((h) => h.ma === "chuoi_7" && h.dat);
  const anDu9May = mc.some((h) => h.ma === "du_9_nhip" && h.dat);
  return [...mc, ...may.filter((h) => !(anChuoiMay && h.ma === "chuoi_may_7") && !(anDu9May && h.ma === "du_9_nhip_may"))];
}

export const demDat = (ds: HuyHieu[]) => ds.filter((h) => h.dat).length;

/** KV-THANG: mã huy hiệu đã báo `badge_earned` trên máy này — để mỗi huy hiệu chỉ đo một lần khi vừa đạt.
 *  Trả danh sách huy hiệu ĐÃ ĐẠT mà máy chưa ghi nhận (lần đầu mở khối sau khi đạt). Lần xem đầu tiên trên máy: chỉ ghi
 *  nhận, không báo (huy hiệu cũ không phải "vừa đạt"). */
export const KHOA_HUY_HIEU_DA_BAO = "hbt.huy_hieu_da_bao.v1";
export function ghiHuyHieuVuaDat(ds: HuyHieu[]): HuyHieu[] {
  const v = docJson<unknown>(KHOA_HUY_HIEU_DA_BAO);
  const cu = Array.isArray(v) ? new Set(v.filter((x): x is string => typeof x === "string")) : null;
  const dat = ds.filter((h) => h.dat);
  ghiJson(KHOA_HUY_HIEU_DA_BAO, [...new Set([...(cu ?? []), ...dat.map((h) => h.ma)])]);
  // Cặp máy ↔ tài khoản (chuoi_may_7 ↔ chuoi_7, du_9_nhip_may ↔ du_9_nhip): đã báo bản máy thì đăng nhập không báo lại.
  const goc = (ma: string) => ma.replace(/_may(_|$)/, "$1");
  const daBao = cu ? new Set([...cu].map(goc)) : null;
  return daBao ? dat.filter((h) => !daBao.has(goc(h.ma))) : [];
}

// ---------------------------------------------------------------- tiến độ (trục 2 UX 2026-10-26)
/** Ngày hôm qua (yyyy-mm-dd) của một ngày yyyy-mm-dd. */
const homQua = (iso: string) => new Date(Date.parse(`${iso}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

/** Dữ liệu trên máy để tính tiến độ: chuỗi máy (0 nếu lần ghé cuối trước hôm qua — chuỗi đã đứt), mảng đã xem, hẹn. */
export interface NguyenLieuTienDo { chuoiMay: number; mang: string[]; hen: HenChinhMinh | null }
export function nguyenLieuTienDo(homNay: string): NguyenLieuTienDo {
  const c = docJson<{ ngay?: string; chuoi?: number }>(KHOA_CHUOI_MAY);
  const chuoi = c && typeof c.ngay === "string" && typeof c.chuoi === "number" && (c.ngay === homNay || c.ngay === homQua(homNay)) ? c.chuoi : 0;
  return { chuoiMay: chuoi, mang: docMangDaXem(), hen: docHen() };
}

/** Tiến độ của một huy hiệu chưa đạt: { co, can } — chỉ cho huy hiệu đếm được trên máy (chuỗi máy, 5 mảng, hẹn đang đi).
 *  Huy hiệu máy chủ (tài khoản) không có số đếm ở web → null (chỉ hiện điều kiện). Đạt rồi → null. */
export function tienDoHuyHieu(h: HuyHieu, nl: NguyenLieuTienDo): { co: number; can: number } | null {
  if (h.dat) return null;
  if (h.ma === "chuoi_may_7") return { co: Math.min(7, nl.chuoiMay), can: 7 };
  if (h.ma === "doc_5_mang") return { co: Math.min(NAM_MANG.length, nl.mang.length), can: NAM_MANG.length };
  const muc = h.ma === "hen_7" ? 7 : h.ma === "hen_30" ? 30 : 0;
  if (muc && nl.hen && !nl.hen.dat_luc && nl.hen.muc === muc) return { co: Math.max(0, Math.min(muc, nl.hen.tien_do ?? 0)), can: muc };
  return null;
}

/** Huy hiệu chưa đạt đang gần nhất (tỉ lệ co/can lớn nhất, > 0) — cho dòng tóm tắt "đang đi 1/7". */
export function dangDiGanNhat(ds: HuyHieu[], nl: NguyenLieuTienDo): { ma: MaHuyHieu; co: number; can: number } | null {
  let tot: { ma: MaHuyHieu; co: number; can: number } | null = null;
  for (const h of ds) {
    const t = tienDoHuyHieu(h, nl);
    if (t && t.co > 0 && (!tot || t.co / t.can > tot.co / tot.can)) tot = { ma: h.ma, ...t };
  }
  return tot;
}

// ---------------------------------------------------------------- thẻ chia sẻ huy hiệu (khâu MỜI)
// Thẻ CHỈ mang mã huy hiệu (công khai, cùng một danh mục cho mọi người) — không tên, không ngày đạt, không số liệu riêng
// → không cần ký mã (docs/THE-CHIA-SE.md: chỉ dữ liệu riêng mới phải ký). Người nhận thấy dấu mốc + một lối thử ngay.
export const laMaHuyHieu = (s: string): s is MaHuyHieu => Object.prototype.hasOwnProperty.call(DANH_MUC, s);

/** Câu trên thẻ + lối người nhận thử ngay (đường dẫn trong site). Giọng kể, không khoe hơn ai, không thúc. */
export const THE_HUY_HIEU: Record<MaHuyHieu, { cau: string; moi: string; nut: string; den: string }> = {
  chuoi_7:      { cau: "Bảy buổi sáng liền ghé xem hôm nay của mình.", moi: "Mỗi ngày một câu tự soi, một con số của riêng bạn.", nut: "Xem hôm nay của bạn", den: "/hom-nay" },
  chuoi_30:     { cau: "Ba mươi ngày liền giữ một thói quen nhỏ cho mình.", moi: "Mỗi ngày một câu tự soi, một con số của riêng bạn.", nut: "Xem hôm nay của bạn", den: "/hom-nay" },
  chuoi_may_7:  { cau: "Bảy buổi sáng liền ghé xem hôm nay của mình.", moi: "Mỗi ngày một câu tự soi, một con số của riêng bạn.", nut: "Xem hôm nay của bạn", den: "/hom-nay" },
  da_luu_ho_so: { cau: "Đã có bản đồ con số của riêng mình.", moi: "Bốn con số từ tên và ngày sinh — 30 giây là có.", nut: "Xem con số của bạn", den: "/than-so" },
  hoi_3:        { cau: "Đã hỏi ba câu về chính mình.", moi: "Hỏi điều bạn đang băn khoăn — trả lời theo đúng con số của bạn.", nut: "Đặt câu hỏi đầu tiên", den: "/than-so" },
  moi_1:        { cau: "Đã rủ được một người bạn cùng tìm hiểu bản thân.", moi: "Xem hai người hợp nhau ở đâu, cần dung hoà chỗ nào.", nut: "Xem hợp với ai", den: "/hop-doi" },
  moi_5:        { cau: "Đã rủ được năm người bạn cùng tìm hiểu bản thân.", moi: "Xem hai người hợp nhau ở đâu, cần dung hoà chỗ nào.", nut: "Xem hợp với ai", den: "/hop-doi" },
  hoi_vien:     { cau: "Dành một năm để hiểu mình kỹ hơn.", moi: "Bắt đầu từ bốn con số của bạn — miễn phí.", nut: "Xem con số của bạn", den: "/than-so" },
  doc_5_mang:   { cau: "Đã xem mình qua cả năm góc: Thần số, Tử vi, Bát tự, Kinh Dịch, Phong thuỷ.", moi: "Mỗi mảng một góc nhìn — bắt đầu từ mảng bạn tò mò nhất.", nut: "Khám phá năm mảng", den: "/huyen-hoc" },
  hen_7:        { cau: "Hẹn với chính mình bảy ngày — và đã giữ lời.", moi: "Đặt một lời hẹn nhỏ với chính bạn, không ai chấm điểm.", nut: "Xem hôm nay của bạn", den: "/hom-nay" },
  hen_30:       { cau: "Hẹn với chính mình ba mươi ngày — và đã giữ lời.", moi: "Đặt một lời hẹn nhỏ với chính bạn, không ai chấm điểm.", nut: "Xem hôm nay của bạn", den: "/hom-nay" },
  du_9_nhip:     { cau: "Một tháng đi qua đủ chín nhịp ngày cá nhân, từ 1 tới 9.", moi: "Mỗi ngày một con số, một câu tự soi của riêng bạn.", nut: "Xem hôm nay của bạn", den: "/hom-nay" },
  du_9_nhip_may: { cau: "Một tháng đi qua đủ chín nhịp ngày cá nhân, từ 1 tới 9.", moi: "Mỗi ngày một con số, một câu tự soi của riêng bạn.", nut: "Xem hôm nay của bạn", den: "/hom-nay" },
};
export const duongTheHuyHieu = (ma: MaHuyHieu) => `/the/huy-hieu/${ma.replace(/_/g, "-")}`;
/** Đoạn URL (gạch ngang) → mã huy hiệu; null khi không có trong danh mục. */
export function maTuDuongHuyHieu(s: string): MaHuyHieu | null {
  const ma = s.replace(/-/g, "_");
  return laMaHuyHieu(ma) ? ma : null;
}
