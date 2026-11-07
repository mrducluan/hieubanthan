// TR-1 — Tarot: kiểu dữ liệu + hằng dùng chung máy chủ và trình duyệt (không "use client"). Web KHÔNG tính gì: mọi nghĩa,
// phẩm giá, nhịp thời gian do engine trả; ở đây chỉ có tên bộ, màu nguyên tố và hình vẽ lá (components/tarot/LaBai).
import type { BaoCaoDoiSong, ChuongDoiSongMo, Hop, Muc } from "@/components/luan-giai/kieu";

export type BoTarot = "gay" | "coc" | "kiem" | "tien";
export type NguyenTo = "hoa" | "thuy" | "khi" | "dat";
export type LoaiLa = "an_chinh" | "so" | "hoang_gia";
export type MaTraiBai = "mot_la" | "ba_la_thoi_gian" | "ba_la_loi_khuyen" | "nam_la" | "celtic" | "hai_lua_chon" | "khi_nao";
export type QuanHeNguyenTo = "manh" | "hop" | "trung" | "xung";
export type SucLa = "tiep_suc" | "binh" | "bi_kim";

/** Một lá rút gọn (engine `/v1/tarot/bo-bai` và trong hộp bài đọc). */
export interface LaGon { id: string; ten: string; en: string; so: number; bo: BoTarot | null; nguyen_to: NguyenTo; loai: LoaiLa; nguoc?: boolean }
export interface LaBoBai extends LaGon { tu_khoa: string[]; huong_nhin: -1 | 0 | 1 | null; chiem_tinh: string | null; decan: { cung: string; so: number; hanh_tinh: string } | null }
export interface ViTriTraiBai { ma: string; ten: string; hoi: string; x: number; y: number; xoay?: number }
export interface TraiBai {
  ten: string; ngan: string; mo_ta: string; vi_tri: ViTriTraiBai[]; ke_can: [number, number][]; truc: { ten: string; vi_tri: number[] }[];
  truc_nhin?: number[]; thoi_diem?: number[]; loi_khuyen?: number[]; trong_tam: number;
}
export interface BoBai {
  la: Record<string, LaBoBai>; thu_tu: string[];
  bo: Record<BoTarot, { ten: string; en: string; nguyen_to: NguyenTo; mang: string; nhip: string; loi: string }>;
  nguyen_to: Record<NguyenTo, { ten: string; en: string; bo: BoTarot; tinh: string; loi: string }>;
  trai_bai: Record<MaTraiBai, TraiBai>;
  chu_de: Record<string, { ten: string }>;
  truong_phai: Record<string, { ten: string; ngan: string; mo_ta: string; hoi: string }>;
}
/** Lá người dùng đã rút cho một vị trí. */
export interface LaRut { id: string; nguoc: boolean }

export interface HopTarot extends Hop {
  la?: LaGon; vi_tri?: { so: number; ma: string; ten: string; hoi: string }; suc?: SucLa; tu_khoa?: string[]; cau_tu_soi?: string;
  quan_he?: QuanHeNguyenTo; cap?: [number, number]; vi_tri_nhin?: number; toi?: number | null; huong?: -1 | 0 | 1;
  loai_nhip?: string; dang_trong?: boolean | null; ngu_hinh?: string | null; nghieng?: NghiengTraLoi;
}
export type NghiengTraLoi = "tien" | "dieu_kien" | "cho";
export type YDinhTarot = "quyet_dinh" | "lua_chon" | "ket_qua" | "thoi_diem" | "cach_lam" | "ly_do" | "nguoi_khac" | "hieu_minh" | "tong_quat";
/** TR-2: engine hiểu câu hỏi — chỉ mã + nhãn danh mục, không trả lại chữ người dùng gõ. */
export interface HieuCau {
  y_dinh: YDinhTarot; linh_vuc: string | null; chu_de: string | null; viec: string | null; nhan_viec: string | null; lua_chon: [string, string] | null;
  goi_y_trai_bai: MaTraiBai; co_cau: boolean; chan: "an_toan" | "tu_choi" | "dan_huong" | null; ten_y_dinh?: string; ten_goi_y?: string; loi?: string | null;
  nghieng?: { nghieng: NghiengTraLoi; diem: number } | null;
}
export interface ChuongTarot extends ChuongDoiSongMo { hop?: HopTarot[]; thieu?: string | null; nghieng?: NghiengTraLoi; chan?: string }
export interface BaoCaoTarot extends BaoCaoDoiSong {
  ten: string; thieu: string[]; chuong: ChuongTarot[]; /** hộp cốt lõi đầu tiên = hộp của vị trí trọng tâm (engine chọn theo KB) */ cot_loi: HopTarot[]; cau_hoi: null; chu_de: string | null; linh_vuc: string | null; hieu_cau?: HieuCau;
  da_tinh: {
    trai_bai: MaTraiBai; ten_trai_bai: string;
    vi_tri: { vi_tri: number; ma: string; ten: string; id: string; nguoc: boolean; nguyen_to: NguyenTo; loai: LoaiLa; so: number; ten_la: string; suc: { suc: SucLa; diem: number; triet_tieu: boolean }; ke: number[] }[];
    ke_can: { a: number; b: number; quan_he: QuanHeNguyenTo }[];
    nguyen_to: { dem: Record<NguyenTo, number>; troi: NguyenTo | null; thieu: NguyenTo[] };
    an_chinh: { so: number; tong: number; ti_le: number; muc: "nhieu" | "vua" | "it" };
    so_hoc: { day: number[]; xu_huong: string };
    huong_nhin: { vi_tri: number; huong: -1 | 0 | 1; toi: number | null; tren_truc: boolean; lat?: boolean }[];
    ngay_xem: string;
  };
}
export interface LaNgay { ngay: string; rieng: boolean; la: LaGon & { tu_khoa: string[]; y_xuoi: string; viec: string; cau_tu_soi: string; hinh_anh: string }; cach_tinh: string }

export const TEN_BO: Record<BoTarot, string> = { gay: "Gậy", coc: "Cốc", kiem: "Kiếm", tien: "Tiền" };
export const TEN_NGUYEN_TO: Record<NguyenTo, string> = { hoa: "Lửa", thuy: "Nước", khi: "Khí", dat: "Đất" };
/** Màu nhấn theo nguyên tố (lớp Tailwind viết đủ). */
export const MAU_NGUYEN_TO: Record<NguyenTo, { chu: string; vien: string; nen: string; hex: string }> = {
  hoa: { chu: "text-cinnabar", vien: "border-cinnabar/60", nen: "bg-cinnabar/10", hex: "#EF8A6F" },
  thuy: { chu: "text-moon", vien: "border-moon/60", nen: "bg-moon/10", hex: "#8FB3FF" },
  khi: { chu: "text-gold", vien: "border-gold/60", nen: "bg-gold/10", hex: "#E9C46A" },
  dat: { chu: "text-jade", vien: "border-jade/60", nen: "bg-jade/10", hex: "#6FD3B5" },
};
export const TEN_SUC: Record<SucLa, string> = { tiep_suc: "được tiếp sức", binh: "giữ nguyên sức", bi_kim: "bị kìm" };
export const TEN_QUAN_HE: Record<QuanHeNguyenTo, string> = { manh: "cùng nguyên tố", hop: "hợp nhau", trung: "trung tính", xung: "xung nhau" };
export const MA_LA = /^[a-z]{3,4}_[a-z0-9_]{1,12}$/;
export const TRAI_BAI_MAC_DINH: MaTraiBai = "ba_la_loi_khuyen";
export const SO_LA: Record<MaTraiBai, number> = { mot_la: 1, ba_la_thoi_gian: 3, ba_la_loi_khuyen: 3, nam_la: 5, celtic: 10, hai_lua_chon: 5, khi_nao: 3 };
export const MA_TRAI_BAI = Object.keys(SO_LA) as MaTraiBai[];
export const laMaTraiBai = (s: string | null | undefined): s is MaTraiBai => Boolean(s) && s! in SO_LA;
export const mucCuaSuc = (s: SucLa): Muc => (s === "tiep_suc" ? "thuan" : s === "bi_kim" ? "can_chu_dong" : "can_bang");

/** Số La Mã cho ẩn chính (0 → "0"). */
export function soLaMa(n: number): string {
  if (n <= 0) return "0";
  const b: [number, string][] = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let r = "", x = n;
  for (const [v, s] of b) while (x >= v) { r += s; x -= v; }
  return r;
}

/** TR-3: dựng `LaGon` đủ để VẼ một lá từ mã lá + tên (trang nhận thẻ chia sẻ không gọi engine). Chỉ đọc mã (bộ, số), không tính. */
export function laGonTuMa(id: string, ten: string): LaGon {
  const CAP: Record<string, number> = { tieu_dong: 11, hiep_si: 12, hoang_hau: 13, vua: 14 };
  const NT: Record<BoTarot, NguyenTo> = { gay: "hoa", coc: "thuy", kiem: "khi", tien: "dat" };
  if (id.startsWith("dai_")) return { id, ten, en: "", so: Number(id.slice(4)) || 0, bo: null, nguyen_to: "khi", loai: "an_chinh" };
  const [bo, ...phan] = id.split("_") as [BoTarot, ...string[]];
  const duoi = phan.join("_");
  const cap = CAP[duoi];
  return { id, ten, en: "", so: cap ?? (Number(duoi) || 1), bo, nguyen_to: NT[bo] ?? "khi", loai: cap ? "hoang_gia" : "so" };
}
export const TEN_NGHIENG: Record<"tien" | "dieu_kien" | "cho", string> = { tien: "Nghiêng về có", dieu_kien: "Có điều kiện", cho: "Chưa nên vội" };
