// Ý3 (2026-11-09) — cụm trang "Sinh ở nước ngoài" cho người Việt xa quê: engine `/v1/sinh-nuoc-ngoai[/{nước}]` tính hết
// (múi giờ chuẩn, giờ mùa hè theo lịch sử nơi đó, lệch giờ mặt trời theo kinh độ, Nam bán cầu, ngày lịch âm Việt – Trung
// lệch nhau) — web chỉ hiển thị. Chỉ dùng ở máy chủ (gọi engine, next/cache); form hồ sơ chỉ cần đường dẫn chữ nên không import.
import { unstable_noStore as noStore } from "next/cache";

export const DUONG_SINH_NN = "/sinh-o-nuoc-ngoai";
export const duongSinhNN = (ma: string) => `${DUONG_SINH_NN}/${ma}`;
/** Mã nước có trang (khớp engine `MA_NUOC`; engine là nguồn — mục lục lấy từ engine, hằng này chỉ để đoán khi engine bận). */
export const MA_NUOC_SEO = ["us", "au", "ca", "de", "jp", "kr", "tw", "fr", "cz", "gb", "pl", "ru", "th", "la", "kh"] as const;
export const docMaNuoc = (s: string): string | null => (/^[a-z]{2}$/.test(s) ? s : null);

export interface MocDoiGio { ngay: string; gio: string; sang: "mùa hè" | "giờ chuẩn" }
export interface ThanhPhoSinhNN {
  ma: string; ten: string; ten_en: string | null; zone: string; utc_chuan: number; nhan_utc: string; gio_mua_he: boolean; doi_gio: MocDoiGio[];
  kinh_do: number | null; vi_do: number | null; lech_mat_troi_phut: number | null; canh_bao_mat_troi: boolean; nam_ban_cau: boolean; nam_ban_cau_kha_dung: boolean;
}
export interface MucNuocSinhNN {
  ma: string; ten: string; ten_en: string | null; so_thanh_pho: number; mui_gio: string[]; gio_mua_he: boolean; nam_ban_cau: boolean;
  cong_tac: { gio_mat_troi: boolean; mua_noi_sinh: boolean };
}
export interface NuocSinhNN {
  ma: string; ten: string; ten_en: string | null; nam: number; tieu_de: string; nhan_tren: string; tra_loi_nhanh: string; ghi_chu_nuoc: string;
  thanh_pho: ThanhPhoSinhNN[]; mui_gio: string[];
  lich_su_gio_mua_he: { zone: string; cac_nam: { nam: number; co: boolean; utc_chuan: number; moc: string[] }[] }[];
  nam_mau: number[];
  cau: { mui_gio: string; gio_mua_he: string; mat_troi: string; mua: string; lich_am: string; tet: string; ket: string };
  cong_tac: { gio_mat_troi: boolean; mua_noi_sinh: boolean };
  lich_am: { nam: number; tet_viet: string; tet_trung: string; ngay_lech: { ngay: string; am_viet: string; am_trung: string }[] };
  huong_dan: string[]; hoi_dap: { hoi: string; dap: string }[];
  nguon: { source_id: string; school_id: string; trang_thai: string | null };
}

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

async function lay<T>(duong: string): Promise<T | null> {
  try {
    const r = await fetch(`${ENGINE_URL}${duong}`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: 60 * 60 * 24 }, signal: AbortSignal.timeout(15_000),
    });
    if (r.ok) return (await r.json()) as T;
    if (r.status === 404) return null;
  } catch { /* engine bận → noStore + null; trang ném lỗi 5xx (SEO-L3: không trả trang rỗng 200) */ }
  noStore();
  throw new Error("engine không phản hồi");
}

export const mucLucSinhNN = () => lay<{ nuoc: MucNuocSinhNN[] }>("/v1/sinh-nuoc-ngoai").then((r) => r?.nuoc ?? []);
export const nuocSinhNN = (ma: string) => lay<NuocSinhNN>(`/v1/sinh-nuoc-ngoai/${ma}`);

/** Mục lục cho sitemap: engine bận → danh sách cố định (không rớt URL khỏi sitemap vì một lần engine chậm). */
export async function dsNuocSitemap(): Promise<string[]> {
  try { return (await mucLucSinhNN()).map((n) => n.ma); } catch { return [...MA_NUOC_SEO]; }
}

export const dmy = (iso: string) => { const [y, m, d] = iso.split("-"); return `${d}/${m}/${y}`; };
