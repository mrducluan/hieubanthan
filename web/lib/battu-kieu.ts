// Kiểu dữ liệu Bát tự từ engine (/api/battu/la-so, /api/battu/luu-nien) — web chỉ vẽ.
export interface Tru { can: string; chi: string }
export interface ThanSat { ten: string; loai: "cát" | "hung" | "trung"; y: string; tru: number[]; goc: string }
export interface QuanHe { loai: string; tru: number[]; mo_ta: string }
export interface NapAm { ten: string; hanh: string; han: string }

export interface LaSoBatTu {
  tru: Tru[];
  nhat_chu: { can: string; ngu_hanh: string; am_duong: string };
  tang_can: string[][];
  thap_than_can: string[];
  thap_than_chi: string[][];
  ngu_hanh: { diem: Record<string, number>; thieu: string[]; nhieu_nhat: string };
  than: { ti_le: number; ket_luan: string; dac_lenh?: boolean; thang_diem: string };
  dung_than: {
    phu_uc: { hanh: string[]; giai_thich: string };
    dieu_hau: { hanh: string[]; giai_thich: string };
    cach_cuc: { ten: string } | null;
  };
  dai_van: {
    thuan?: boolean;
    khoi_van?: { nam: number; thang: number; ngay: number };
    ds: { can: string; chi: string; tu_nam: number; den_nam: number; tu_tuoi_thuc: number }[];
  };
  co_canh_bao: { loai: string; chi_tiet: string }[];
  /** VZ-3 — có khi engine ≥ bản này. */
  mo_rong?: {
    nap_am: NapAm[];
    truong_sinh: string[];
    tu_toa: string[];
    khong_vong: { ngay: string[]; nam: string[] };
    than_sat: ThanSat[];
    than_sat_nguon: string;
    quan_he: QuanHe[];
    bang_hanh: { can: Record<string, string>; chi: Record<string, string> };
    vai_tro_hanh: Record<string, string>;
    dai_van_thap_than: string[];
    /** KB-3 — bảng điều hậu Cùng Thông Bảo Giám (thứ tự = ưu tiên). */
    dieu_hau_ctbg?: {
      chi_tiet: { can: string; hanh: string; thap_than: string; thau: boolean; tang: boolean }[];
      mua: string; mua_y?: string | null; nguon: string; can_doi_chieu?: boolean;
    } | null;
  };
}

export interface LuuNienBatTu {
  nam: number;
  can: string;
  chi: string;
  thap_than: string;
  thap_than_chi: string;
  nap_am: NapAm;
  truong_sinh: string;
  dai_van: (LaSoBatTu["dai_van"]["ds"][number] & { thap_than: string }) | null;
  quan_he: QuanHe[];
  luu_nguyet: { thang: number; can: string; chi: string; thap_than: string }[];
}
