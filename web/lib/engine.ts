// Kiểu dữ liệu engine trả về cho thần số — web chỉ hiển thị, không tự tính (CLAUDE.md, ranh giới tầng).
// Gọi engine qua route handler (lib/proxy.ts), không gọi thẳng từ client.

export interface NghiaSo {
  gia_tri: number;
  tu_khoa: string;
  mat_toi: string;
  phan_chung: string;
  so_cai: boolean;
  trich_nguon: string;
}
export interface ViTriLuanGiai {
  vi_tri: string;
  ten: string;
  khung: string;
  gia_tri: number;
  nghia: NghiaSo | null;
  on_dinh: boolean;
  gia_tri_khac: number[];
  ghi_chu_do_nhay?: string;
  cach_tinh?: CachTinh;
}
/** Vết tính từng bước (lớp ĐÃ TÍNH) — engine trả, web chỉ hiển thị. */
export interface CachTinh {
  so_hang: { ky_tu: string; so: number }[];
  tong: number;
  rut_gon: number[];
  ket_qua: number;
  dien_giai: string;
}
export interface DinhCao {
  dinh: number;
  so: number;
  tu_tuoi: number;
  den_tuoi: number | null;
  nghia: { chu_de: string; y_nghia: string; bong_toi: string;
           phan_chung?: string; so_cai?: boolean } | null;
}
export interface NamCaNhan {
  nam: number;
  tuoi: number;
  so: number;
  nghia: { chu_de: string; y_nghia: string; nen: string; tranh: string } | null;
}
export interface ChieuSau {
  dinh_cao: DinhCao[];
  thu_thach_chinh: {
    so: number;
    nghia: { mo_ta: string; y_nghia: string; cach_vuot: string } | null;
  };
  nam_ca_nhan: NamCaNhan[];
  dong_doi?: DongDoi;
  trich_nguon: string;
  cach_doc_chieu_sau: string;
}
export interface NghiaThuThach { mo_ta: string; y_nghia: string; cach_vuot: string }
/** Dòng đời & bước ngoặt (TS-SAU) — engine tính trục, web chỉ vẽ. */
export interface GiaiDoan extends Omit<DinhCao, "nghia"> {
  thu_thach: number;
  tu_nam: number;
  den_nam: number | null;
  nghia: DinhCao["nghia"];
  nghia_thu_thach: NghiaThuThach | null;
}
export type LoaiMoc = "chuyen_dinh" | "khoi_chu_ky" | "khep_chu_ky";
export interface BuocNgoat { nam: number; tuoi: number; loai: LoaiMoc; so: number; trung_moc: boolean; nhan: string }
export interface DongDoi {
  giai_doan: GiaiDoan[];
  chu_ky: { bat_dau: number; ket_thuc: number; tuoi_bat_dau: number }[];
  buoc_ngoat: BuocNgoat[];
  hien_tai: { nam: number; tuoi: number; dinh: number; nam_ca_nhan: number };
  cach_doc: string;
}
export interface DoiChieuNam {
  nam: number; tuoi: number; nam_ca_nhan: number;
  nam_ca_nhan_sinh_nhat: { truoc_sinh_nhat: number; tu_sinh_nhat: number };
  dinh: number; so_dinh: number; thu_thach: number; moc: LoaiMoc[]; nhan_moc: string[];
  nghia_nam: { chu_de: string; y_nghia: string; nen: string; tranh: string; hay_gap?: string } | null;
  nghia_dinh: { chu_de: string; y_nghia: string } | null;
  nghia_thu_thach: NghiaThuThach | null;
}
/** Chân dung 4 mặt (TS-SAU). */
export interface LopThem { nhan: string; so: number; noi_dung: string }
interface MatGoc { ma: string; ten: string; lop_them: LopThem[] }
export interface MatTongQuan extends MatGoc {
  ma: "tong_quan"; chan_dung: string; dong_luc: string; diem_manh: string[]; diem_mu: string[];
  khi_cang_thang: string; huong_lon: string;
}
export interface MatTinhCam extends MatGoc {
  ma: "tinh_cam"; cach_yeu: string; can_duoc: string; diem_mu: string; hop_kieu_nguoi: string;
  dau_hieu_lech: string; hon_nhan: string;
}
export interface MatCongViec extends MatGoc {
  ma: "cong_viec"; the_manh: string; moi_truong: string; vai_tro: string; nghe: string[];
  cai_bay: string; tien_bac: string;
}
export interface MatBienCo extends MatGoc { ma: "bien_co"; kieu_bien_co: string; bai_hoc: string; cach_di_qua: string }
export type MatChanDung = MatTongQuan | MatTinhCam | MatCongViec | MatBienCo;
export interface ChanDung {
  so_truc: number;
  mat: MatChanDung[];
  cach_doc: string;
  nguon: string;
  trang_thai: string;
}
export interface MuiTen {
  ma: string;
  trong: boolean;
  ten?: string;
  y_nghia?: string;
  mat_toi?: string;
  goi_y?: string;
}
export interface ThangCaNhanNghia { chu_de: string; nen: string; tranh: string }
export interface NoNghiepNghia { ten: string; y_nghia: string; goi_y: string }
export interface MoRong {
  bieu_do: { luoi: number[][]; so_thieu: number[]; mui_ten: MuiTen[] };
  so_ngay_sinh: { so: number; nghia: string | null };
  so_thai_do: { so: number; nghia: string | null };
  so_truong_thanh: { so: number; nghia: string | null };
  thang_ca_nhan: { thang: number; nam: number; so: number; nghia: ThangCaNhanNghia | null };
  no_nghiep: { vi_tri: string; so: number; nghia: NoNghiepNghia | null }[];
  bai_hoc_nghiep: { so: number; nghia: string | null }[];
  trich_nguon: string;
  trang_thai: string;
}
export interface LuanGiaiResult {
  engine_version: string;
  ngay_sinh: string;
  ten_chinh: string;
  ten_bien_the_da_quet: string[];
  /** TS-V3: cách cộng Đường đời đang dùng + số theo cả hai cách (báo khi lệch). */
  quy_uoc_duong_doi?: "tong_het" | "tung_phan";
  duong_doi_hai_cach?: { tong_het: number; tung_phan: number; lech: boolean };
  giai_thich_quy_uoc?: Record<"tong_het" | "tung_phan", string>;
  cac_vi_tri: ViTriLuanGiai[];
  chieu_sau: ChieuSau;
  mo_rong?: MoRong;
  chan_dung?: ChanDung | null;
  tom_tat_do_tin: string;
  cach_doc: string;
  trich_nguon_chung: string;
}
