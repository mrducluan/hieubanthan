// HL-1 — kiểu dữ liệu + đọc phía máy chủ cho "Xem ngày tốt". Engine tính mọi thứ (trực, hoàng đạo, nghi/kỵ, giờ…),
// web chỉ hiển thị. Bản công khai (không ngày sinh) đọc bằng GET để cache; bản cá nhân đi qua /api/lich/*.
import { unstable_noStore as noStore } from "next/cache";

export interface MucNghiKy { ma: string; ten: string; nghia: string }
export interface ThanSat { ma: string; ten: string; nghia?: string }
export interface GioNgay {
  chi: string; can_chi: string; khung: string; than: string; hoang_dao: boolean;
  xuat_hanh: { ten: string; tot: boolean; nghia: string };
}
export interface TomTatNgay {
  ngay: string; am: string; can_chi: string; truc: string; than: string; hoang_dao: boolean; ky_dan_gian: string[];
  con_ngay?: number; viec?: string; quan_he_tuoi?: string | null; diem_cong?: string[];
  /** Engine chấm "ngày đẹp" chung: hoàng đạo + trực tốt + không rơi ngày kỵ dân gian. */
  dep?: boolean;
}
export interface QuanHeTuoi { ma: string | null; ten: string; nghia: string }
export interface NgayTot {
  ngay: string; thu: string;
  am: { ngay: number; thang: number; nam: number; nhuan: boolean; chu: string };
  can_chi: { nam: string; thang: string; ngay: string };
  hoang_dao: boolean;
  than: { ten: string; loai: string };
  truc: { ten: string; y: string; hop: string; tranh: string };
  tu: { ten: string; tot: boolean };
  nghi: MucNghiKy[]; ky: MucNghiKy[]; cat_than: ThanSat[]; hung_sat: ThanSat[];
  xung_tuoi: { ten: string; chi: string }; sat: string; banh_to: string[];
  huong: { hy_than: string; tai_than: string; phuc_than: string }; thai_than: string;
  gio: GioNgay[]; gio_hoang_dao: GioNgay[]; ghi_chu_gio_ty?: string;
  ky_dan_gian: { ma: string; ten: string; nghia: string }[];
  tuoi: { nam_am: number; can_chi: string; uoc_luong: boolean; quan_he: QuanHeTuoi } | null;
  viec: { ma_viec: string; ten: string; danh_gia: "tot" | "binh" | "tranh"; ly_do: string[]; ngay_tot_gan: TomTatNgay | null } | null;
  ngay_mai: TomTatNgay; ngay_tot_gan: TomTatNgay | null;
  danh_sach_viec: { ma: string; ten: string }[];
  nguon: string; trang_thai: string; luu_y: string; tra_loi_nhanh?: string;
}
// SEO-M: tóm tắt tháng + ngày tốt theo việc + hỏi đáp (engine cũ không có → tuỳ chọn).
export interface ThangLich {
  nam: number; thang: number; ngay: TomTatNgay[]; thang_am?: string; tra_loi_nhanh?: string;
  tom_tat?: { so_hoang_dao: number; so_dep: number; ky_dan_gian: { ten: string; ngay: string[] }[] };
  theo_viec?: { viec: { ma: string; ten: string }; slug: string; so_ngay: number; dep_nhat: TomTatNgay | null }[];
  hoi_dap?: { hoi: string; dap: string }[];
}
export interface ChonNgayKq {
  viec: { ma: string; ten: string }; tu: string; den: string; tuoi: { can_chi: string } | null;
  ngay: TomTatNgay[]; luu_y: string; cach_chon: string;
}

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

async function lay<T>(duong: string): Promise<T | null> {
  try {
    const r = await fetch(`${ENGINE_URL}${duong}`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: 60 * 60 * 6 },        // dữ liệu một ngày cố định — không đổi theo giờ
      signal: AbortSignal.timeout(15_000),
    });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function homNayVN(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(d);
}

export async function ngayTotCongKhai(iso: string): Promise<NgayTot | null> {
  const r = await lay<NgayTot>(`/v1/lich/ngay-tot/${iso}`);
  if (!r) noStore();
  return r;
}

export async function thangCongKhai(nam: number, thang: number): Promise<ThangLich | null> {
  const r = await lay<ThangLich>(`/v1/lich/thang/${nam}/${thang}`);
  if (!r) noStore();
  return r;
}

// KH-BL đợt 1 — bảng giờ hoàng đạo theo địa chi ngày (engine; không phụ thuộc ngày xem).
export interface GioHoangDaoBang {
  nhom: { ngay: [string, string]; gio: { chi: string; khung: string; than: string }[] }[];
  than: { ten: string; loai: string; nghia: string }[];
  tra_loi_nhanh: string; hoi_dap: { hoi: string; dap: string }[]; cach_tinh: string; nguon: string; trang_thai: string; luu_y: string;
}
export async function gioHoangDaoCongKhai(): Promise<GioHoangDaoBang | null> {
  const r = await lay<GioHoangDaoBang>("/v1/lich/gio-hoang-dao");
  if (!r) noStore();
  return r;
}

// SEO-L2 — "ngày tốt {việc} tháng M/YYYY": 6 việc có trang riêng (engine VIEC_SEO; engine trả 404 cho việc khác).
export const VIEC_SEO = [
  { ma: "cuoi_hoi", slug: "cuoi-hoi", ten: "Cưới hỏi" }, { ma: "khai_truong", slug: "khai-truong", ten: "Khai trương" },
  { ma: "nhap_trach", slug: "nhap-trach", ten: "Về nhà mới" }, { ma: "dong_tho", slug: "dong-tho", ten: "Động thổ, làm nhà" },
  { ma: "xuat_hanh", slug: "xuat-hanh", ten: "Xuất hành, đi xa" }, { ma: "mua_xe", slug: "mua-xe", ten: "Mua xe, tài sản" },
] as const;
export type ViecSeo = (typeof VIEC_SEO)[number];
export interface ViecThang {
  viec: { ma: string; slug: string; ten: string }; nam: number; thang: number; tieu_de: string; thang_am: string;
  ngay: TomTatNgay[]; so_ngay: number; dep_nhat: TomTatNgay | null; tra_loi_nhanh: string;
  hoi_dap: { hoi: string; dap: string }[]; cach_chon: string; luu_y: string; trang_thai: string;
}
export async function viecThangCongKhai(ma: string, nam: number, thang: number): Promise<ViecThang | null> {
  const r = await lay<ViecThang>(`/v1/lich/viec-thang/${ma}/${nam}/${thang}`);
  if (!r) noStore();
  return r;
}
export const duongViecThang = (slug: string, nam: number, thang: number) => `/xem-ngay-tot/${slug}-thang-${thang}-${nam}`;
const RE_VIEC = /^([a-z-]+)-thang-(\d{1,2})-(\d{4})$/;

const RE_NGAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const RE_THANG = /^thang-(\d{1,2})-(\d{4})$/;

/** Đường dẫn con của /xem-ngay-tot: "2026-10-13" (một ngày), "thang-10-2026" (cả tháng) hoặc "cuoi-hoi-thang-10-2026"
 *  (ngày tốt cho một việc trong tháng — SEO-L2). Sai dạng → null. */
export function docDuong(s: string): { loai: "ngay"; iso: string } | { loai: "thang"; nam: number; thang: number }
  | { loai: "viec"; viec: ViecSeo; nam: number; thang: number } | null {
  const v = RE_VIEC.exec(s);
  if (v) {
    const viec = VIEC_SEO.find((x) => x.slug === v[1]);
    const [m, y] = [Number(v[2]), Number(v[3])];
    if (!viec || m < 1 || m > 12 || y < 1901 || y > 2099 || String(m) !== v[2]) return null;
    return { loai: "viec", viec, nam: y, thang: m };
  }
  const a = RE_NGAY.exec(s);
  if (a) {
    const [y, m, d] = [Number(a[1]), Number(a[2]), Number(a[3])];
    const t = new Date(Date.UTC(y, m - 1, d));
    if (y < 1901 || y > 2099 || t.getUTCMonth() !== m - 1 || t.getUTCDate() !== d) return null;
    return { loai: "ngay", iso: s };
  }
  const b = RE_THANG.exec(s);
  if (b) {
    const [m, y] = [Number(b[1]), Number(b[2])];
    if (m < 1 || m > 12 || y < 1901 || y > 2099 || String(m) !== b[1]) return null;
    return { loai: "thang", nam: y, thang: m };
  }
  return null;
}

export const duongNgay = (iso: string) => `/xem-ngay-tot/${iso}`;
export const duongThang = (nam: number, thang: number) => `/xem-ngay-tot/thang-${thang}-${nam}`;

/** Cộng ngày cho chuỗi YYYY-MM-DD (UTC, không lệch múi giờ). */
export function congNgay(iso: string, n: number): string {
  return new Date(Date.parse(`${iso}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);
}

/** Cửa sổ index trang tháng (cũng là cửa sổ sitemap): 12 tháng trước → 24 tháng tới. Ngoài cửa sổ: noindex + link
 *  tháng trước/sau rel=nofollow (không mở không gian bò vô hạn 1901–2099). */
export const THANG_TRUOC = 12, THANG_SAU = 24;
export function lechThang(nam: number, thang: number, h: string = homNayVN()): number {
  return (nam - Number(h.slice(0, 4))) * 12 + (thang - Number(h.slice(5, 7)));
}
export function thangIndex(nam: number, thang: number, h?: string): boolean {
  const l = lechThang(nam, thang, h);
  return l >= -THANG_TRUOC && l <= THANG_SAU;
}

/** Trang ngày được index khi nằm trong cửa sổ hữu ích (7 ngày trước → 400 ngày tới); ngoài ra vẫn xem được, noindex. */
export function ngayDangIndex(iso: string, homNay: string = homNayVN()): boolean {
  return iso >= congNgay(homNay, -7) && iso <= congNgay(homNay, 400);
}
