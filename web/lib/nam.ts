// NAM-1 (hướng A, chủ dự án duyệt 2026-10-30) — trang trụ "Năm {năm}" + "Sinh con năm {năm}" + "Cưới năm {năm}".
// Engine tính hết (`/v1/nam/{nam}…`, chỉ ghép lịch âm Việt, can chi, nạp âm, Tam tai, Kim lâu, hạn năm) — web chỉ hiển thị.
// URL `/nam/{năm}` (chủ dự án chốt): index năm âm hiện tại + năm sau như các cụm năm khác → tự trượt sau Tết.
import { unstable_noStore as noStore } from "next/cache";
import type { HanNam, HoiDap, MetaKb } from "@/lib/tuoi-dan-gian";

export type QuanHeNam = "trung" | "xung" | "hinh" | "hai" | "tam_hop" | "luc_hop" | "binh";
export interface DongConGiap { chi: string; quan_he: QuanHeNam; nhan: string; loi: string; tam_tai: number | null; loi_tam_tai: string | null; nam_sinh: number[];
  /** NAM-3: năm sinh có trang "Tử vi năm … tuổi …" (engine cũ: không có). */ nam_sinh_trang?: number[] }
export interface NamTongQuan extends MetaKb {
  nam: number; can_chi: string; can: string; con_giap: string; nap_am: { ten: string; hanh: string; han: string };
  tet: string; het_nam: string; lap_xuan: string; thang_nhuan: number; nam_truoc_tet: { nam: number; can_chi: string };
  so_nam_the_gioi: { so: number; rut_gon: number }; nam_tuoi: string; xung: string;
  tam_tai: { tuoi: string[]; nam_thu: number | null }; tuoi_hop: string[]; bang_con_giap: DongConGiap[];
  moc: { ma: string; ten: string; duong: string }[]; han_nam: HanNam; tra_loi_nhanh: string; hoi_dap: HoiDap[];
}
export interface NamSinhCon extends MetaKb {
  nam: number; con: { can_chi: string; nap_am: string; hanh: string; tu: string; den: string };
  truoc_tet: { nam: number; can_chi: string; nap_am: string }; chi_hop: string[]; chi_xung: string;
  ds: { nam_sinh: number; can_chi: string; nap_am: string; chi_quan_he: string; chi_nhan: string; nap_am_quan_he: string;
    nap_am_nhan: string; nhom: "hop" | "binh" | "luu_y"; nhom_nhan: string }[];
  loi_nhom: Record<"hop" | "binh" | "luu_y", string>; ranh_gioi: string; tra_loi_nhanh: string; hoi_dap: HoiDap[];
}
export interface NamCuoiHoi extends MetaKb {
  nam: number; can_chi: string; tet: string; so_duoc: number; cach_tinh: string; muon_tuoi: string; ranh_gioi: string;
  ds: { nam_sinh: number; can_chi: string; tuoi_mu: number; kim_lau: string | null; duoc: boolean; nam_khong_pham: number | null }[];
  tra_loi_nhanh: string; hoi_dap: HoiDap[];
}

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

async function lay<T>(duong: string): Promise<T | null> {
  try {
    const r = await fetch(`${ENGINE_URL}${duong}`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: 60 * 60 * 24 }, signal: AbortSignal.timeout(15_000),
    });
    if (r.ok) return (await r.json()) as T;
  } catch { /* engine bận → null, trang ném lỗi 5xx (không trả trang rỗng 200) */ }
  noStore();
  return null;
}

// NAM-3 — "Tử vi năm {nam} tuổi {can chi}" (một trang mỗi năm sinh, gộp nam + nữ mạng).
/** AUD-P1: trang SEO theo tuổi nhận sao bản gọn (tên + hạn); lời giải thích ở trang sao hạn năm. */
export interface SaoGioi { ten: string; han: string | null; nghia?: string; viec?: string[]; tu_soi?: string }
export interface DiemNhan { loai: "thuan" | "luu_y" | "trung"; tieu_de: string; noi_dung: string; can_cu: string }
export interface NamTheoTuoi extends MetaKb {
  nam: number; can_chi_nam: string; nap_am_nam: string; tuoi_mu: number;
  nguoi: { nam_sinh: number; can_chi: string; nap_am: string; hanh: string };
  quan_he: { chi: string; can: string; nap_am: string }; diem_nhan: DiemNhan[];
  sao: { nam: SaoGioi | null; nu: SaoGioi | null }; tam_tai: number | null; kim_lau: string | null;
  lam_nha: { thuan: boolean; xau: string[]; hoang_oc: string };
  tu_hoa: { hoa: "Lộc" | "Quyền" | "Khoa" | "Kỵ"; sao: string; y_nghia?: string }[]; tu_hoa_loi: string; ranh_gioi: string;
  tra_loi_nhanh: string; hoi_dap: HoiDap[];
  /** AUD-P1: 10 năm tới của tuổi (quan hệ địa chi, Tam tai, Kim lâu, sao hạn hai giới) — engine tính, web chỉ hiện. */
  nam_toi?: { nam: number; can_chi: string; tuoi_mu: number; dia_chi: string | null; tam_tai: number | null; kim_lau: string | null;
    sao_nam: string | null; sao_nu: string | null }[];
}
export const namTheoTuoiCongKhai = (nam: number, ns: number) => lay<NamTheoTuoi>(`/v1/nam/${nam}/tuoi/${ns}?gon=1`);
export const duongNamTuoi = (nam: number, ns: number) => `/nam/${nam}/tuoi-${ns}`;
/** Có trang index: CHỈ năm sắp tới (`namTuoiSeo`, AUD-Q1), năm sinh 1960–2005 (như cụm tuổi làm nhà / xông đất). */
export const namTuoiIndex = (nam: number, namSeo: number, ns: number) => nam === namSeo && ns >= 1960 && ns <= 2005;

export const namCongKhai = (nam: number) => lay<NamTongQuan>(`/v1/nam/${nam}`);
export const sinhConCongKhai = (nam: number) => lay<NamSinhCon>(`/v1/nam/${nam}/sinh-con`);
export const cuoiHoiCongKhai = (nam: number) => lay<NamCuoiHoi>(`/v1/nam/${nam}/cuoi-hoi`);

export const duongNam = (nam: number) => `/nam/${nam}`;
export const duongSinhCon = (nam: number) => `/nam/${nam}/sinh-con`;
export const duongCuoiHoi = (nam: number) => `/nam/${nam}/cuoi-hoi`;
/** Cửa sổ index: năm âm hiện tại + năm sau (cùng sao hạn / làm nhà / xông đất). Năm khác vẫn xem được, noindex. */
export const namIndex = (nam: number, namAm: number) => nam === namAm || nam === namAm + 1;

/** "dd/mm/yyyy" từ ISO. */
export const dmy = (iso: string) => iso.split("-").reverse().join("/");

/** NAM-2: năm chọn được ở /thoi-gian-toi + năm mặc định (engine quyết: năm tới khi Tết sau còn ≤ 120 ngày).
 *  `hanMs`: menu đầu trang chỉ chờ ngắn (như khung CMS 1,5 giây). Engine lỗi/chậm → đoán theo lịch dương (năm âm ≈ năm
 *  dương; tháng 10–12 mời năm sau) — chỉ để chọn nhãn/đường dẫn mặc định, mọi dữ kiện năm vẫn do engine tính. */
export async function namThoiGianToi(hanMs = 10_000): Promise<{ cac_nam: number[]; mac_dinh: number | null }> {
  try {
    const r = await fetch(`${ENGINE_URL}/v1/thoi-gian-toi/nam`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: 60 * 60 }, signal: AbortSignal.timeout(hanMs),
    });
    if (r.ok) return (await r.json()) as { cac_nam: number[]; mac_dinh: number };
  } catch { /* engine bận → đoán theo lịch dương */ }
  const vn = new Date(Date.now() + 7 * 3600_000);
  const y = vn.getUTCFullYear(), m = vn.getUTCMonth() + 1;
  const namAm = m === 1 ? y - 1 : y;   // tháng 1 thường còn trước Tết
  return { cac_nam: [namAm, namAm + 1], mac_dinh: m >= 10 || m === 1 ? namAm + 1 : null };
}

/** AUD-Q1: năm duy nhất của trang theo tuổi được index = năm mặc định của menu / Thời gian tới (engine quyết). */
export async function namTuoiSeo(): Promise<number> {
  const r = await namThoiGianToi();
  return r.mac_dinh ?? r.cac_nam[0] ?? new Date(Date.now() + 7 * 3600_000).getUTCFullYear();
}
