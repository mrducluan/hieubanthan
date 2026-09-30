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
  trich_nguon: string;
  cach_doc_chieu_sau: string;
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
  cac_vi_tri: ViTriLuanGiai[];
  chieu_sau: ChieuSau;
  mo_rong?: MoRong;
  tom_tat_do_tin: string;
  cach_doc: string;
  trich_nguon_chung: string;
}
