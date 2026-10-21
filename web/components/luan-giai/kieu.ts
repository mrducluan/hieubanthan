// LG-ĐS (docs/LUAN-GIAI-DOI-SONG.md mục 2.3) — kiểu dữ liệu báo cáo "đời sống" của Luận giải Tử vi. Chỉ là kiểu cho
// phần hiển thị; engine dựng mọi chữ và mã, web không tự tính.
import type { ThuatNgu } from "@/components/hoi/ThuatNgu";
import type { MoiXem } from "@/lib/sao-xem-truoc";

export type LoaiHop = "cot_loi" | "diem_manh" | "luu_y" | "loi_khuyen" | "thoi_diem";
export type Muc = "thuan" | "can_bang" | "can_chu_dong";

export interface Hop {
  loai: LoaiHop;
  /** Nhãn riêng thay nhãn mặc định của loại (vd "Điểm sáng" ở nhịp 3 tháng). */
  nhan?: string;
  tieu_de: string;
  noi_dung: string;
  can_cu?: string[];
  /** Mã kiểm chứng tất định (^[a-z0-9_.+-]{3,60}$) — có thì hiện dòng "Điều này có đúng với bạn?". */
  ma_mau?: string;
  ty_le_dung?: number;
  so_phieu?: number;
  /** Engine đã chuyển hộp này xuống "Vì sao nói vậy" — web không hiện hộp. */
  dang_xem_lai?: boolean;
  /** Hộp cot_loi: chương gốc + loại hộp gốc (dùng chung ma_mau với hộp gốc). */
  tu_chuong?: string; loai_goc?: LoaiHop;
  /** Hộp luu_y: hướng xử lý (thường đã nằm trong noi_dung). */
  huong_xu_ly?: string;
  /** Hộp thoi_diem: mức + khoảng thời gian (chữ) hoặc khoảng tuổi. */
  muc?: Muc; tu?: string; den?: string; tu_tuoi?: number; den_tuoi?: number;
  /** VH-1 chương Vận hạn: năm của hộp (+ các năm cùng mẫu đã gộp). */
  nam?: number; nam_gop?: number[];
}

/** VH-1 — một cờ của năm (tập quán dân gian theo chi năm sinh, hoặc năm xung / hình chi ngày ở Bát tự). */
export interface CoNam { ma: string; nhan: string; y?: string; tranh?: string; lam?: string }
/** VH-1 — một năm trong dòng 10 năm (engine chấm, web chỉ vẽ). `muc_cach_*` chỉ có ở Bát tự (hai cách dụng thần). */
export interface NamVanHan {
  nam: number; tuoi: number; muc: Muc; nhan_muc: string; hien_tai: boolean; co: CoNam[]; mang: string | null;
  y: string; nen_tranh: string | null; nen_lam: string | null; can_cu: string[];
  muc_cach_1?: Muc; muc_cach_2?: Muc; hai_cach_khac?: boolean;
}
/** VH-1 Bát tự — 12 tháng tới theo tiết. */
export interface ThangToi { tu: string; den: string; muc: Muc; nhan_muc: string; hai_cach_khac: boolean; mang: string }

export interface MocDaiHan {
  tu_tuoi: number; den_tuoi: number; nam_tu: number; nam_den: number; cung: string;
  chu_de: string; muc: Muc; mot_cau: string; hien_tai: boolean;
  /** BT-ĐS: nhãn nhỏ thay "cung …" (vd "vận Ất Dậu") + mức theo từng cách đọc (dụng thần hai cách, không tự chọn). */
  nhan?: string; muc_cach_1?: Muc; muc_cach_2?: Muc; hai_cach_khac?: boolean;
}

/** BT-ĐS chương "Năng lượng": điểm 5 hành (đã tính ở engine) + hành mỗi cách gợi ý bù — web chỉ VẼ. */
export interface HanhBieuDo {
  hanh: string; diem: number; ty_le: number; nhom: string; trang_thai: "thieu" | "thua" | "vua"; cach_1: boolean; cach_2: boolean;
}
export interface BieuDoNguHanh { hanh: HanhBieuDo[]; nhat_chu: string }
export interface HaiCach {
  cach_1: { ten: string; hanh: string[] }; cach_2: { ten: string; hanh: string[]; ma?: string }; chon: null;
}
/** BT-ĐS chương "Con người bạn": sức tự thân (tỉ lệ trợ lực + hai ngưỡng của thang điểm công bố). */
export interface ThanDo { ti_le: number; vuong_tu: number; nhuoc_duoi: number; muc: "manh" | "yeu" | "can_bang"; nhan: string }

export interface ChuongDoiSongMo {
  ma: string; tieu_de: string; khoa?: false;
  cau_hoi?: string; muc?: Muc; nhan_muc?: string; tom_tat?: string;
  hop?: Hop[]; doan: string[]; can_cu?: string[]; cau_tu_soi?: string;
  van_ai?: string; che_do?: string; thuat_ngu?: ThuatNgu[];
  /** Chương sức khoẻ: câu "không thay lời bác sĩ". */
  mien_tru?: string;
  /** BT-ĐS: dữ liệu trực quan (chỉ có ở báo cáo Bát tự). */
  bieu_do?: BieuDoNguHanh; hai_cach?: HaiCach; than_do?: ThanDo;
  /** VH-1 chương "Vận hạn & điều nên tránh": dòng 10 năm (+ 12 tháng tới ở Bát tự). Nằm TRONG chương → khoá SAO-2 là mất. */
  dong_nam?: NamVanHan[]; thang_toi?: ThangToi[];
}
export interface ChuongKhoa { ma: string; tieu_de: string; khoa: true; moi_xem: MoiXem }

export interface BaoCaoDoiSong {
  mo_dun: string;
  phien_ban: "doi_song_1";
  /** KC-1: phái ghi kèm phiếu kiểm chứng (nam_phai_viet · tu_binh · pitago · bat_trach_huyen_khong). */
  phai?: string;
  trang_thai: string;
  ket: string;
  dien_dat?: "ai" | "tron" | "mau";
  so_khoa?: number;
  cot_loi?: Hop[];
  thoi_gian_bieu?: MocDaiHan[];
  chuong: (ChuongDoiSongMo | ChuongKhoa)[];
  phi?: { sao: number; ly_do: string; so_du?: number | null; khoa?: boolean; dang_nhap?: boolean; thuong_chao_mung?: number | null };
}

export const NHAN_MUC: Record<Muc, string> = { thuan: "Thuận lợi", can_bang: "Cân bằng", can_chu_dong: "Cần lưu ý" };

/** Mọi mã kiểm chứng trong báo cáo (để xin tỉ lệ một lần cho cả bài). */
export function maMauBaoCao(bc: Pick<BaoCaoDoiSong, "cot_loi" | "chuong">): string[] {
  const ds = [...(bc.cot_loi ?? []), ...bc.chuong.flatMap((c) => (c.khoa ? [] : c.hop ?? []))];
  return [...new Set(ds.filter((h) => !h.dang_xem_lai && h.ma_mau).map((h) => h.ma_mau!))].sort();
}

export function laBaoCaoDoiSong(x: unknown): x is BaoCaoDoiSong {
  return Boolean(x && typeof x === "object" && (x as { phien_ban?: unknown }).phien_ban === "doi_song_1"
    && Array.isArray((x as { chuong?: unknown }).chuong));
}
