// TV-BD1 — kiểu dữ liệu "Bản đồ 12 cung Tử vi" (engine /v1/tuvi/ban-do) + hàm hình học thuần cho bánh xe 12 cung & mạng đường bay.
// Web chỉ vẽ: mọi mức cung, đường bay, chuỗi 2 chặng, tuổi và năm đều do engine tính.
import type { TenHien } from "@/lib/ten-hien";

export type MaCung =
  | "menh" | "phu_mau" | "phuc_duc" | "dien_trach" | "quan_loc" | "no_boc"
  | "thien_di" | "tat_ach" | "tai_bach" | "tu_nu" | "phu_the" | "huynh_de";
export type MucCung = "thuan" | "can_bang" | "can_chu_dong";
export type LoaiChamTV = "luu_nien" | "loc_nam" | "quyen_nam" | "khoa_nam" | "ky_nam" | "ky_xung";

export interface CungBanDo {
  ma: MaCung;
  chi_so: number;           // 0=Tý … 6=Ngọ … 11=Hợi
  cung: string;             // mã tên cung Việt ("Mệnh", "Quan Lộc"…) — hiển thị qua `ten_hien`
  can: string;
  chi: string;
  hanh_cung: string;
  muc: MucCung;
  nhan_muc: string;
  la_menh: boolean;
  la_than: boolean;
  la_lai_nhan: boolean;
  vo_chinh_dieu: boolean;
  tuan_triet: string[];
  chinh_tinh: { sao: string; do_sang: string | null; tu_hoa: string | null; muon: boolean }[];
  dai_han: { tu_tuoi: number; den_tuoi: number; tu_nam: number; den_nam: number; dang_di: boolean };
  la_gi: string[];
  tam_phuong: {
    xung: MaCung;
    tam_hop: [MaCung, MaCung];
    cau: string[];
  };
  bay_cung: {
    chieu: "di" | "den" | "tu_hoa";
    cung_kia: MaCung;
    hoa: string;
    sao: string;
    cau: string;
  }[];
  nam: {
    nam: number;
    can: string;
    chi: string;
    muc: MucCung;
    nhan_muc: string;
    cau: string;
  }[];
  vi_sao: string[];
  chuong: string;
}

export interface ChuoiHaiChang {
  loai: "ky_chuyen_ky" | "loc_chuyen_ky";
  phai: string;
  ma_mau: string;
  tu: MaCung;
  qua: MaCung;
  den: MaCung;
  xung: MaCung | null;
  can_dau: string;
  can_chuyen: string;
  hoa_dau: string;
  sao_dau: string;
  sao_chuyen: string;
  tieu_de: string;
  nghia: string;
  viec_nen_lam?: string | null;
  can_cu: string[];
}

export interface DuongNoiBatTV {
  ma: string;
  loai: string;
  tu: MaCung;
  den: MaCung;
  xung: MaCung | null;
  hoa: string;
  sao: string;
  tu_hoa: boolean;
  tieu_de: string;
  nghia: string;
  viec_nen_lam?: string | null;
  can_cu: string[];
}

export interface NamBanDoTV {
  nam: number;
  tuoi: number;
  can: string;
  chi: string;
  cung_luu_nien: MaCung;
  dai_han: number | null;
  qua: boolean;
  hoa_nam: { hoa: string; sao: string; den: MaCung | null; xung: MaCung | null }[];
  cham: { o: MaCung; loai: LoaiChamTV }[];
  cau: string;
  chi_tiet: string[];
  muc?: MucCung;
  nhan_muc?: string;
  mang?: string | null;
  /** Cách a (SAO-2): CHỈ `nam === nam_xem` mang `y`, `nen_tranh`, `nen_lam`; `nam > nam_xem` mang `khoa: true`. */
  y?: string;
  nen_tranh?: string | null;
  nen_lam?: string | null;
  khoa?: boolean;
}

export interface DaiVanTV {
  i: number;
  cung: MaCung;
  ten_cung: string;
  tu_tuoi: number;
  den_tuoi: number;
  tu_nam: number;
  den_nam: number;
  muc: MucCung;
  chu_de: string;
  hien_tai: boolean;
  cau: string;
}

export interface BanDoTuVi {
  phien_ban: "tuvi_ban_do_1" | string;
  tuoi: number;
  tuoi_mu: number;
  nguoi_lon: boolean;
  tam: {
    cuc: string;
    hanh_cuc: string;
    nap_am: string;
    hanh_menh: string;
    menh_cuc: string;
    cung_menh: MaCung;
    cung_than: MaCung;
    lai_nhan: MaCung | null;
    tuan_chi?: string[];
    triet_chi?: string[];
  };
  o: CungBanDo[];
  noi_bat: { ma: string; o: MaCung[]; cau: string }[];
  duong_bay: {
    lai_nhan: MaCung | null;
    sinh_nien: { hoa: string; sao: string; cung: MaCung }[];
    noi_bat: DuongNoiBatTV[];
    vao_menh: { tu: MaCung; den: MaCung; hoa: string; sao: string; tu_hoa: boolean; nghia: string; can_cu: string[] }[];
    tu_hoa: { tu: MaCung; hoa: string; sao: string; nghia: string; can_cu: string[] }[];
    chuoi_chuyen_ky: ChuoiHaiChang[];
  };
  thoi_gian: {
    nam_xem: number;
    dong_han?: { tu_tuoi: number; den_tuoi: number; cung: MaCung } | null;
    dai_van: DaiVanTV[];
    nam: NamBanDoTV[];
    hoi_dan: string;
    nam_toi: string;
  };
  ten_hien?: TenHien | null;
}

/** Điểm trên vòng tròn SVG tâm (0, 0): `goc` tính theo độ, `0°` = đỉnh trên cùng, chiều kim đồng hồ. */
export function diemTron(r: number, goc: number): [number, number] {
  const t = ((goc - 90) * Math.PI) / 180;
  return [r * Math.cos(t), r * Math.sin(t)];
}

/** Hình quạt vành khăn `r0..r1` từ góc `a0` tới `a1` (độ, chiều kim đồng hồ). */
export function quat(r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = diemTron(r1, a0);
  const [x1, y1] = diemTron(r1, a1);
  const [x2, y2] = diemTron(r0, a1);
  const [x3, y3] = diemTron(r0, a0);
  const l = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0}A${r1} ${r1} 0 ${l} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${l} 0 ${x3} ${y3}Z`;
}

/** Góc tâm của địa chi `chiSo` (0=Tý … 6=Ngọ … 11=Hợi): Ngọ ở đỉnh `0°` (Nam), Tý ở đáy `180°` (Bắc), chiều kim đồng hồ. */
export function gocChi(chiSo: number): number {
  return (((chiSo - 6) * 30) % 360 + 360) % 360;
}

/** Góc đường ranh giới giữa cặp địa chi chẵn–lẻ liền kề (dùng đặt huy hiệu Tuần / Triệt đúng vách ngăn). */
export function gocRanhGioi(chiSoA: number, chiSoB: number): number {
  const nho = Math.min(chiSoA, chiSoB);
  return (gocChi(nho) + 15) % 360;
}

/** Tuổi mụ → góc trên vành Đại hạn (0–90 tuổi = một vòng 360°). */
export function gocTuoi(tuoi: number): number {
  return (Math.max(0, Math.min(90, tuoi)) / 90) * 360;
}

/** Cung bậc hai Bézier nối từ góc `aTu` sang `aDen` trên bán kính `r` (trả đường dẫn `d` + toạ độ điểm giữa `t = 0.5`). */
export function cungBezier(
  r: number,
  aTu: number,
  aDen: number,
  lechPhapTuyen = 0,
): { d: string; giua: [number, number] } {
  const [x1, y1] = diemTron(r, aTu);
  const [x2, y2] = diemTron(r, aDen);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const doDai = Math.hypot(dx, dy) || 1;
  // Kéo điểm điều khiển về phía tâm (0.28 * trung điểm) + dịch pháp tuyến nhẹ khi hai chiều trùng trục
  const cx = mx * 0.28 + (-dy / doDai) * lechPhapTuyen;
  const cy = my * 0.28 + (dx / doDai) * lechPhapTuyen;
  const gx = 0.25 * x1 + 0.5 * cx + 0.25 * x2;
  const gy = 0.25 * y1 + 0.5 * cy + 0.25 * y2;
  return { d: `M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`, giua: [gx, gy] };
}

/** Dựng hai chặng Bézier `A -> B -> C` cho `chuoi_chuyen_ky` (tự tách thấu kính khi `C === A` để hai chặng ① và ② không đè nhau). */
export function chuoiBezierHaiChang(
  r: number,
  aTu: number,
  aQua: number,
  aDen: number,
): { chang1: string; giua1: [number, number]; chang2: string; giua2: [number, number] } {
  const hoiGoc = Math.abs((((aDen - aTu) % 360) + 360) % 360) < 0.01;
  const c1 = cungBezier(r, aTu + (hoiGoc ? -3.5 : 0), aQua + (hoiGoc ? 3.5 : -2), hoiGoc ? 22 : 10);
  const c2 = cungBezier(r, aQua + (hoiGoc ? -3.5 : 2), aDen + (hoiGoc ? 3.5 : 0), hoiGoc ? 22 : -10);
  return { chang1: c1.d, giua1: c1.giua, chang2: c2.d, giua2: c2.giua };
}

/** Khuyên tròn nhỏ bên ngoài nút cung khi cung tự hoá (`tu_hoa`). */
export function khuyenTuHoa(rNgoai: number, goc: number): { d: string; dinh: [number, number] } {
  const [x1, y1] = diemTron(rNgoai, goc - 5.5);
  const [x2, y2] = diemTron(rNgoai, goc + 5.5);
  const [cx, cy] = diemTron(rNgoai + 34, goc);
  const [dx, dy] = diemTron(rNgoai + 19, goc);
  return { d: `M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`, dinh: [dx, dy] };
}
