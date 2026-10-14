// TDG-1 — kiểu dữ liệu + đọc phía máy chủ cho xem tuổi làm nhà/cưới, hướng xấu năm, tuổi xông đất. Engine tính hết.
import { unstable_noStore as noStore } from "next/cache";

export interface MetaKb { nguon: string; trang_thai: string; luu_y: string }
export interface HuongTranh { ma: string; ten: string; nghia: string; phuong: string; chi?: string[] }
export interface HanNam extends MetaKb {
  nam: number; can_chi: string; huong_tranh: HuongTranh[]; moc: string;
  phi_tinh: { cung: string; phuong: string; sao: number; ten_sao: string; y_nghia: string | null }[];
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
  cuoi_hoi: string; cach_dan_gian: string | null; cach_tinh: string; han_nam: HanNam;
}
export interface XongDat extends MetaKb {
  nam: { nam: number; can_chi: string }; chu: { nam_sinh: number; can_chi: string }; uoc_luong_nam_sinh: boolean;
  tuoi_hop: { nam_sinh: number; can_chi: string; nap_am: string; ly_do: string[] }[];
  nen_tranh: string[];
  mung_mot: { ngay: string; can_chi: string; hoang_dao: boolean; than: string;
    gio_hoang_dao: { chi: string; khung: string }[]; huong: { hy_than: string; tai_than: string; phuc_than: string } };
  cach_chon: string;
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

export const hanNamCongKhai = (nam: number) => layHoacLoi<HanNam>(`/v1/tuoi/han-nam/${nam}`);
export const lamNhaCongKhai = (nam: number, namSinh: number) => layHoacLoi<LamNha>(`/v1/tuoi/lam-nha/${nam}/${namSinh}`);
export const xongDatCongKhai = (nam: number, namSinh: number) => layHoacLoi<XongDat>(`/v1/tuoi/xong-dat/${nam}/${namSinh}`);

/** Năm sinh có trang SEO (cùng dải với trang tuổi hợp hướng: nhóm đang làm nhà / con cái tìm cho bố mẹ). */
export const NAM_SINH_SEO = Array.from({ length: 2005 - 1960 + 1 }, (_, i) => 1960 + i);
export const duongLamNha = (nam: number, namSinh: number) => `/xem-tuoi-lam-nha/${nam}/tuoi-${namSinh}`;
export const duongXongDat = (nam: number, namSinh: number) => `/tuoi-xong-dat/${nam}/tuoi-${namSinh}`;
export const duongHanNam = (nam: number) => `/huong-xau-nam/${nam}`;

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

/** Năm âm lịch hôm nay (engine trả qua hoàng lịch hôm nay); engine bận → năm dương (gần đúng, chỉ làm mặc định ô nhập). */
export async function namAmHienTai(): Promise<number> {
  const { homNayVN, ngayTotCongKhai } = await import("@/lib/hoang-lich");
  const iso = homNayVN();
  return (await ngayTotCongKhai(iso))?.am.nam ?? Number(iso.slice(0, 4));
}

/** Cửa sổ index: làm nhà năm âm hiện tại + năm sau; xông đất Tết sắp tới (+ năm hiện tại); hướng xấu năm −1…+2. */
export const lamNhaIndex = (nam: number, namAm: number, ns: number) => (nam === namAm || nam === namAm + 1) && NAM_SINH_SEO.includes(ns);
export const xongDatIndex = (nam: number, namAm: number, ns: number) => (nam === namAm || nam === namAm + 1) && NAM_SINH_SEO.includes(ns);
export const hanNamIndex = (nam: number, namAm: number) => nam >= namAm - 1 && nam <= namAm + 2;
