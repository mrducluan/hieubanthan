// Kiểu dữ liệu engine trả về cho /v1/doanh-chu/doi-ngu — web chỉ hiển thị, không tự tính (CLAUDE.md).

export type TenNguHanh = "Mộc" | "Hỏa" | "Thổ" | "Kim" | "Thủy";

export type MucPhoiHop = "bu_khuyet_cao" | "bo_tro_on_dinh" | "can_quy_che_ro";

export interface OngChuTomTat {
  ten: string;
  hanh_manh: string;
  hanh_can_bu: string;
  duong_doi: number;
  nam_ca_nhan: number | [number, number];
}

export interface CanBangNguHanh {
  ty_le_5_hanh: Record<string, number>;
  hanh_troi: string;
  hanh_thieu: string;
  nhan_xet_diem_manh: string;
  nhan_xet_lo_hong: string;
}

export interface YeuToCotLoi {
  yeu_to: string;
  chi_tiet: string;
}

export type CapQuanLy = "chu_dn" | "giam_doc" | "truong_nhom";

export type NhomViec = "" | "kinh_doanh" | "van_hanh" | "tai_chinh" | "san_pham" | "marketing" | "doi_ngoai";

export interface KhopNhomViec {
  ma: string;
  ten: string;
  muc: "thuan_luc" | "bo_sung_goc_nhin";
  nhan: string;
  giai_thich: string;
}

export interface GoiYGhepCap {
  ten_a: string;
  ten_b: string;
  hanh_a: string;
  hanh_b: string;
  ly_do: string;
}

export interface GoiYCapQuanLy {
  ma: CapQuanLy;
  ten: string;
  trong_tam: string;
  hanh_dong: string;
}

export interface ThanhVienMaTran {
  ten: string;
  vai_tro_hien_tai: string;
  nhom_viec?: string;
  khop_nhom_viec?: KhopNhomViec | null;
  chi_so: {
    hanh_manh: string;
    duong_doi: number;
    nam_ca_nhan: number | [number, number];
    quan_he_dia_chi: string;
    bu_khuyet_ngu_hanh: boolean;
  };
  muc_phoi_hop: MucPhoiHop;
  nhan_phoi_hop: string;
  vai_tro_goi_y: string;
  sau_yeu_to_cot_loi: YeuToCotLoi[];
  mat_tich_cuc: string;
  ong_chu_can_chu_y: string[];
  nhan_su_can_luu_y: string[];
  kich_ban_trao_doi: string;
}

export interface GoiYQuyMo {
  kinh_doanh_nho: string;
  doanh_nghiep_lon: string;
}

export interface KetQuaDoanhChu {
  engine_version?: string;
  khong_luu_du_lieu?: boolean;
  la_du_lieu_mau?: boolean;
  provenance: string;
  nam_xem: number;
  cap_quan_ly?: GoiYCapQuanLy;
  ong_chu: OngChuTomTat;
  can_bang_ngu_hanh: CanBangNguHanh;
  ma_tran_phoi_hop: ThanhVienMaTran[];
  goi_y_ghep_cap?: GoiYGhepCap[];
  goi_y_quy_mo: GoiYQuyMo;
  ranh_gioi_phap_ly: string;
}

/** Lấy số Năm cá nhân hiển thị (engine trả số đơn hoặc cặp [trước sinh nhật, từ sinh nhật]). */
export function soNamCaNhan(v: number | [number, number]): number {
  return Array.isArray(v) ? (v[1] ?? v[0] ?? 1) : v;
}
