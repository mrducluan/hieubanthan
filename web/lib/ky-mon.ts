// Kỳ Môn Độn Giáp — đọc engine `/v1/ky-mon/*` (bàn theo giờ + bài đọc hướng / việc). Web chỉ hiển thị: không lập bàn,
// không chấm mức. Bàn là của THỜI ĐIỂM (không tên, không ngày sinh) nên không có gì riêng tư để lưu.
const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export const DUONG_KY_MON = "/ky-mon";
export type MucKM = "thuan" | "binh" | "cham";
export const VIEC_KM = ["gap_go", "ky_ket", "di_xa", "giay_to", "hoa_giai", "thu_no", "tinh_tam"] as const;
export type ViecKM = (typeof VIEC_KM)[number];
export type PhepKM = "sach_bo" | "tri_nhuan";
export type GioTyKM = "da_ty" | "sang_ngay";

export interface CachKM { ma: string; ten: string; loai: "cat" | "hung"; dieu_kien: string; loi: string; nen: string; ky?: string; sach: string | null; han?: string }
export interface HuongKM {
  cung: number; que: string; phuong: string; muc: MucKM; muc_nhan: string; noi_bat: boolean;
  cua: { ma: string; ten: string; tom: string; loai: "cat" | "binh" | "hung"; loi: string; nen: string; tranh: string; sach: string | null };
  sao: { ma: string; ten: string; tom: string; loi: string; bac: string; kem_cam: boolean; sach: string | null };
  than: { ma: string; ten: string; tom: string; loi: string; sach: string | null };
  ky: string[]; cach: CachKM[]; hop_viec: string[]; tom: string; can_cu: string[];
}
export interface ViecDocKM { ma: string; ten: string; mo_ta: string; ranh_gioi?: string | null; co: boolean; phuong?: string; cung?: number; muc?: MucKM; loi: string }
export interface DocGioKM {
  gio: { chi: string; khung: string; can_chi: string; muc: MucKM; muc_nhan: string };
  tom_tat: string; luu_y_gio: string[]; cach_gio: CachKM[]; huong: HuongKM[]; huong_thuan: string[];
  hiem: { ma: string; ten: string; phuong: string; loi: string }[]; cach_dung: string; ranh_gioi: string; viec?: ViecDocKM;
}
export interface BanKM {
  thoi_diem: string;
  ban: { am_duong: "duong" | "am"; cuc: number; nguyen: string; tiet: { ten: string }; tiet_thuc: { ten: string }; phu_dau: string;
    can_chi: { ngay: string; gio: string }; tuan_thu: string; truc_phu: { sao: string; cung: number }; truc_su: { cua: string; cung: number } };
  doc: DocGioKM; tuy_chon: { utc: number; phep: PhepKM; gio_ty: GioTyKM; phep_ghi_chu: string | null };
}
export interface GioNgayKM {
  luc: string; chi: string; khung: string; can_chi: string; muc: MucKM; muc_nhan: string; huong_thuan: string[]; noi_bat: string[];
  hiem: { ten: string; phuong: string }[]; luu_y: string[]; hop_menh?: string[]; viec?: { phuong: string; cua: string; noi_bat: boolean };
}
export interface NgayKM {
  ngay: string; gio: GioNgayKM[]; cach_dung: string; hop_menh?: { gio: string[]; loi: string };
  viec?: { ma: string; ten: string; mo_ta: string; ranh_gioi?: string | null; loi?: string;
    gio_tot: { chi: string; khung: string; luc: string; phuong: string; cua: string; noi_bat: boolean; ban_dem: boolean; loi: string }[] };
}
export interface MucDanhMucKM { ma: string; ten: string; han?: string; hanh?: string; loai?: string; tom?: string; loi: string; nen?: string; tranh?: string; dieu_kien?: string; ten_khac?: string; sach: string | null }
export interface DanhMucKM {
  cua: MucDanhMucKM[]; sao: MucDanhMucKM[]; than: MucDanhMucKM[]; cach: MucDanhMucKM[];
  viec: { ma: ViecKM; ten: string; mo_ta: string }[]; sao_chung: string | null; cach_dung: string; ranh_gioi: string;
  meta: { nguon: string };
}

const dau = (): Record<string, string> => ({ "content-type": "application/json", ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}) });

async function goi<T>(duong: string, than?: unknown, nho?: number): Promise<T> {
  const r = await fetch(`${ENGINE_URL}${duong}`, {
    method: than === undefined ? "GET" : "POST", headers: dau(), body: than === undefined ? undefined : JSON.stringify(than),
    ...(nho ? { next: { revalidate: nho } } : { cache: "no-store" as const }), signal: AbortSignal.timeout(15_000),
  });
  if (!r.ok) throw new Error(`engine Kỳ Môn ${r.status}`);   // trang trả 5xx, không dựng trang rỗng
  return (await r.json()) as T;
}

/** Bàn của giờ đang đi (giờ Việt Nam) + 13 khung giờ hôm nay + danh mục giải nghĩa. */
export function layKyMonHomNay(): Promise<[BanKM, NgayKM, DanhMucKM]> {
  return Promise.all([goi<BanKM>("/v1/ky-mon/ban", {}), goi<NgayKM>("/v1/ky-mon/ngay", {}), goi<DanhMucKM>("/v1/ky-mon/danh-muc", undefined, 60 * 60 * 6)]);
}

/** Vị trí của tám hướng trên lưới 3×3, Bắc ở trên (như bản đồ): số cung Lạc Thư theo từng ô, đọc trái → phải, trên → dưới. */
export const LUOI_BAC_TREN = [6, 1, 8, 7, 5, 3, 2, 9, 4] as const;
