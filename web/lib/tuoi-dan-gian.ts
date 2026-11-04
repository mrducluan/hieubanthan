// TDG-1 — kiểu dữ liệu + đọc phía máy chủ cho xem tuổi làm nhà/cưới, hướng xấu năm, tuổi xông đất. Engine tính hết.
import { unstable_noStore as noStore } from "next/cache";

export interface MetaKb { nguon: string; trang_thai: string; luu_y: string }
export interface HuongTranh { ma: string; ten: string; nghia?: string; phuong: string; chi?: string[] }
export interface HanNam extends MetaKb {
  nam: number; can_chi: string; huong_tranh: HuongTranh[]; moc?: string;
  tra_loi_nhanh?: string; hoi_dap?: { hoi: string; dap: string }[];   // SEO-M (engine cũ: không có)
  /** AUD-P1: trang SEO theo tuổi nhận bản gọn (không bàn 9 cung, không moc) — chỉ công cụ / trang năm có đủ. */
  phi_tinh?: { cung: string; phuong: string; sao: number; ten_sao: string; y_nghia: string | null }[];
}
export interface LamNha extends MetaKb {
  nam_sinh: number; nam_sinh_am: number; can_chi: string; nam_xay: number; can_chi_nam_xay: string; tuoi_mu: number;
  uoc_luong_nam_sinh: boolean;
  kim_lau: { ma: string; ten: string; nghia: string } | null;
  hoang_oc: { ma: string; ten: string; tot: boolean; nghia: string };
  tam_tai: { nam_thu: number; ten: string; nghia: string } | null;
  cac_nam_tam_tai: string[];
  ket_luan: { ma: "thuan" | "can_nhac"; chu: string };
  nam_thuan: { nam: number; can_chi: string; tuoi_mu: number }[];
  cuoi_hoi: string; cach_dan_gian: string | null; cach_tinh?: string; han_nam: HanNam; tra_loi_nhanh?: string;
  /** AUD-P1: 10 năm tới của tuổi (chỉ trang SEO theo tuổi; engine tính bằng đúng hàm công cụ từng năm). */
  muoi_nam?: { nam: number; can_chi: string; tuoi_mu: number; kim_lau: string | null; hoang_oc: string; tam_tai: number | null; thuan: boolean;
    /** 6b-2: năm tuổi ("trung") / năm xung tuổi ("xung") — chỉ ghi chú, không đổi mức. Engine cũ không có trường này. */
    nam_tuoi?: "trung" | "xung" | null }[];
}
export interface XongDat extends MetaKb {
  nam: { nam: number; can_chi: string }; chu: { nam_sinh: number; can_chi: string }; uoc_luong_nam_sinh: boolean;
  tuoi_hop: { nam_sinh: number; can_chi: string; nap_am: string; ly_do: string[] }[];
  nen_tranh: string[];
  // AUD-P1: trang SEO theo tuổi nhận mùng 1 bản gọn (ngày, can chi, hoàng đạo) + không cách chọn; công cụ nhận đủ.
  mung_mot: { ngay: string; can_chi: string; hoang_dao: boolean; than?: string;
    gio_hoang_dao?: { chi: string; khung: string }[]; huong?: { hy_than: string; tai_than: string; phuc_than: string } };
  cach_chon?: string; tra_loi_nhanh?: string;
  /** AUD-P1: tuổi hợp xông đất cho các Tết kế tiếp (chỉ trang SEO theo tuổi). */
  tet_toi?: { nam: number; can_chi: string; tuoi: { nam_sinh: number; can_chi: string }[] }[];
}

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

async function lay<T>(duong: string): Promise<T | null> {
  try {
    const r = await fetch(`${ENGINE_URL}${duong}`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: 60 * 60 * 24 }, signal: AbortSignal.timeout(15_000),
    });
    return r.ok ? ((await r.json()) as T) : null;
  } catch { return null; }
}
async function layHoacLoi<T>(duong: string): Promise<T | null> {
  const r = await lay<T>(duong);
  if (!r) noStore();
  return r;
}

// SEO-L1 — bảng theo năm (engine ghép lại đúng các hàm của từng tuổi; web chỉ hiển thị).
export interface HoiDap { hoi: string; dap: string }
export interface LamNhaNam extends MetaKb {
  nam: number; can_chi: string; so_thuan: number; tra_loi_nhanh: string; hoi_dap: HoiDap[]; cach_tinh: string; han_nam: HanNam;
  ds: { nam_sinh: number; can_chi: string; tuoi_mu: number; kim_lau: string | null; hoang_oc: string; hoang_oc_xau: boolean;
    tam_tai: number | null; thuan: boolean; xau: string[] }[];
}
export interface XongDatNam extends MetaKb {
  nam: { nam: number; can_chi: string }; tra_loi_nhanh: string; hoi_dap: HoiDap[]; nen_tranh: string[];
  ds: { nam_sinh: number; can_chi: string; tuoi_hop: { nam_sinh: number; can_chi: string }[] }[];
  mung_mot: { ngay: string; can_chi: string; gio_hoang_dao: { chi: string; khung: string }[]; huong: { hy_than: string; tai_than: string; phuc_than: string } };
}
export const lamNhaNamCongKhai = (nam: number) => layHoacLoi<LamNhaNam>(`/v1/tuoi/lam-nha-nam/${nam}`);
export const xongDatNamCongKhai = (nam: number) => layHoacLoi<XongDatNam>(`/v1/tuoi/xong-dat-nam/${nam}`);
export const duongLamNhaNam = (nam: number) => `/xem-tuoi-lam-nha/${nam}`;
export const duongXongDatNam = (nam: number) => `/tuoi-xong-dat/${nam}`;

export const hanNamCongKhai = (nam: number) => layHoacLoi<HanNam>(`/v1/tuoi/han-nam/${nam}`);
export const lamNhaCongKhai = (nam: number, namSinh: number) => layHoacLoi<LamNha>(`/v1/tuoi/lam-nha/${nam}/${namSinh}?gon=1`);
export const xongDatCongKhai = (nam: number, namSinh: number) => layHoacLoi<XongDat>(`/v1/tuoi/xong-dat/${nam}/${namSinh}?gon=1`);

/** Năm sinh có trang SEO (cùng dải với trang tuổi hợp hướng: nhóm đang làm nhà / con cái tìm cho bố mẹ). */
export const NAM_SINH_SEO = Array.from({ length: 2005 - 1960 + 1 }, (_, i) => 1960 + i);
export const duongLamNha = (nam: number, namSinh: number) => `/xem-tuoi-lam-nha/${nam}/tuoi-${namSinh}`;
export const duongXongDat = (nam: number, namSinh: number) => `/tuoi-xong-dat/${nam}/tuoi-${namSinh}`;
export const duongHanNam = (nam: number) => `/phong-thuy/huong-xau-nam/${nam}`;

/** "tuoi-1990" → 1990 (1900–2099), sai dạng → null. */
export function docTuoi(s: string): number | null {
  const m = /^tuoi-(\d{4})$/.exec(s);
  const n = m ? Number(m[1]) : NaN;
  return n >= 1900 && n <= 2099 ? n : null;
}
export function docNam(s: string): number | null {
  const n = /^\d{4}$/.test(s) ? Number(s) : NaN;
  return n >= 1901 && n <= 2099 ? n : null;
}

/** Bảng theo năm liệt kê tuổi sinh 1960–2005 → chỉ có từ năm 2006 (năm sớm hơn sẽ có tuổi chưa sinh). Khớp engine. */
export const NAM_BANG_TU = 2006;
export function docNamBang(s: string): number | null {
  const n = docNam(s);
  return n && n >= NAM_BANG_TU ? n : null;
}

/** Năm âm lịch hôm nay (engine trả qua hoàng lịch hôm nay); engine bận → năm dương (gần đúng, chỉ làm mặc định ô nhập). */
export async function namAmHienTai(): Promise<number> {
  const { homNayVN, ngayTotCongKhai } = await import("@/lib/hoang-lich");
  const iso = homNayVN();
  return (await ngayTotCongKhai(iso))?.am.nam ?? Number(iso.slice(0, 4));
}

/** Cửa sổ index trang THEO TUỔI. AUD-Q1 (chủ dự án 2026-11-03): chỉ MỘT năm — năm sắp tới (`namTuoiSeo`, cùng năm
 *  menu "Năm …": năm tới khi Tết sau còn ≤ 120 ngày, không thì năm âm đang đi); năm đang qua thôi index (trang con cùng
 *  tuổi khác năm gần trùng 47–57 %). Bảng theo năm + hướng xấu năm giữ cửa sổ riêng. */
export const lamNhaIndex = (nam: number, namSeo: number, ns: number) => nam === namSeo && NAM_SINH_SEO.includes(ns);
/** Xông đất: "năm sắp tới" luôn là Tết SẮP TỚI (năm âm hiện tại + 1) — sau Tết, Tết vừa qua thôi index ngay. */
export const xongDatIndex = (nam: number, namAm: number, ns: number) => nam === namAm + 1 && NAM_SINH_SEO.includes(ns);
export const hanNamIndex = (nam: number, namAm: number) => nam >= namAm - 1 && nam <= namAm + 2;

// ---- MT-ĐS B3 — sao hạn Cửu Diệu + Bát hạn (tập quán theo tuổi, miễn phí; bảng một trang theo năm, không trang theo tuổi)
export interface SaoHanO { ten: string; nghia: string; viec: string[]; tu_soi: string }
export interface SaoHan extends MetaKb {
  tra_loi_nhanh: string; nam: { nam: number; can_chi: string }; nguoi: { nam_sinh: number; can_chi: string; gioi_tinh: "nam" | "nu" };
  tuoi_mu: number; uoc_luong_nam_sinh: boolean; sao: SaoHanO | null; han: SaoHanO | null; kim_lau: string | null;
  tam_tai: number | null; hoi_dap: HoiDap[]; cau_co_dinh: string; cach_tinh: string;
}
export interface SaoHanNam extends MetaKb {
  nam: number; can_chi: string; tra_loi_nhanh: string; cau_co_dinh: string; cach_tinh: string; hoi_dap: HoiDap[];
  ds: { nam_sinh: number; can_chi: string; tuoi_mu: number; nam: string | null; nu: string | null; han_nam: string | null; han_nu: string | null }[];
  sao: SaoHanO[]; han: SaoHanO[];
}
export const saoHanNamCongKhai = (nam: number) => layHoacLoi<SaoHanNam>(`/v1/tuoi/sao-han/${nam}`);
export const duongSaoHanNam = (nam: number) => `/xem-sao-han/${nam}`;
export const saoHanIndex = (nam: number, namAm: number) => nam === namAm || nam === namAm + 1;
