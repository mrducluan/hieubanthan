// Kiểu dữ liệu Bát tự từ engine (/api/battu/la-so, /api/battu/luu-nien) — web chỉ vẽ.
export interface Tru { can: string; chi: string }
export interface TruNapAm extends Tru { nap_am: string }
export interface ThanSat { ten: string; loai: "cát" | "hung" | "trung"; y: string; tru: number[]; goc: string }
/** EN-5.3 (2026-11-02) — thần sát tham khảo (Tam Mệnh Thông Hội), luôn đủ 4 mục; không vào luận giải. */
export interface ThanSatThamKhao extends ThanSat {
  nhom: string; co: boolean; phai: string; cach_khac: string; theo_cach_khac: number[]; chinh?: boolean; chinh_tru?: number[];
}
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
  /** HTT-2 H1 — engine ≥ bản này: lựa chọn điều hậu đang dùng + có mở được "theo mùa nơi sinh" không (ngoài chí tuyến Nam). */
  tuy_chon?: { dieu_hau: "bac_ban_cau" | "noi_sinh"; nam_ban_cau_kha_dung: boolean };
  /** Trục 2 UX — câu lời thường về nhật chủ (KB đời sống) cho đầu trang; engine cũ không có → đầu trang chỉ còn nút. */
  loi_thuong?: { hinh_tuong: string | null; chan_dung: string | null; cau_tu_soi: string | null } | null;
  /** VZ-3 — có khi engine ≥ bản này. */
  mo_rong?: {
    nap_am: NapAm[];
    truong_sinh: string[];
    tu_toa: string[];
    khong_vong: { ngay: string[]; nam: string[] };
    than_sat: ThanSat[];
    than_sat_nguon: string;
    than_sat_tham_khao?: ThanSatThamKhao[];
    than_sat_tham_khao_nguon?: string;
    /** EN-5.3 — Thai nguyên, Mệnh cung, Thân cung (+ nạp âm) và tiểu vận trước khi vào đại vận. */
    cung_than?: { thai_nguyen: TruNapAm; menh_cung: TruNapAm; than_cung: TruNapAm; giai_thich: Record<string, string>; nguon: string };
    tieu_van?: (TruNapAm & { nam: number; tuoi_mu: number })[];
    quan_he: QuanHe[];
    bang_hanh: { can: Record<string, string>; chi: Record<string, string> };
    vai_tro_hanh: Record<string, string>;
    dai_van_thap_than: string[];
    /** KB-3 — bảng điều hậu Cùng Thông Bảo Giám (thứ tự = ưu tiên). */
    dieu_hau_ctbg?: {
      chi_tiet: { can: string; hanh: string; thap_than: string; thau: boolean; tang: boolean }[];
      mua: string; mua_y?: string | null; nguon: string; can_doi_chieu?: boolean;
    } | null;
    /** KB-3b — cách cục Tử Bình Chân Thuyên (định cách theo nguyệt lệnh) + hỷ/kỵ. */
    cach_cuc_tbct?: {
      ma: string; ten: string; can_lap_cach: string; thap_than: string; nguon_khi: "ban_khi" | "trung_khi" | "du_khi";
      thau: boolean; chi_thang: string; can_thau_khac: { can: string; thap_than: string }[];
      y?: string; hy?: string; ky?: string; nguon?: string;
    };
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
