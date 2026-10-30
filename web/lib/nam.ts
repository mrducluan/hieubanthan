// NAM-1 (hướng A, chủ dự án duyệt 2026-10-30) — trang trụ "Năm {năm}" + "Sinh con năm {năm}" + "Cưới năm {năm}".
// Engine tính hết (`/v1/nam/{nam}…`, chỉ ghép lịch âm Việt, can chi, nạp âm, Tam tai, Kim lâu, hạn năm) — web chỉ hiển thị.
// URL `/nam/{năm}` (chủ dự án chốt): index năm âm hiện tại + năm sau như các cụm năm khác → tự trượt sau Tết.
import { unstable_noStore as noStore } from "next/cache";
import type { HanNam, HoiDap, MetaKb } from "@/lib/tuoi-dan-gian";

export type QuanHeNam = "trung" | "xung" | "hinh" | "hai" | "tam_hop" | "luc_hop" | "binh";
export interface DongConGiap { chi: string; quan_he: QuanHeNam; nhan: string; loi: string; tam_tai: number | null; loi_tam_tai: string | null; nam_sinh: number[] }
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

/** NAM-2: năm chọn được ở /thoi-gian-toi + năm mặc định (engine quyết: năm tới khi Tết sau còn ≤ 120 ngày). */
export async function namThoiGianToi(): Promise<{ cac_nam: number[]; mac_dinh: number | null }> {
  try {
    const r = await fetch(`${ENGINE_URL}/v1/thoi-gian-toi/nam`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: 60 * 60 }, signal: AbortSignal.timeout(10_000),
    });
    if (r.ok) return (await r.json()) as { cac_nam: number[]; mac_dinh: number };
  } catch { /* engine bận → để engine tự chọn năm lúc gọi báo cáo */ }
  const { namAmHienTai } = await import("@/lib/tuoi-dan-gian");
  const n = await namAmHienTai();
  return { cac_nam: [n, n + 1], mac_dinh: null };
}
