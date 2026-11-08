// QTE-1 tuần 2 — "Tết ở nước ngoài" (engine `/v1/tet-nuoc-ngoai[/{nuoc}]`): ngày Tết lịch Việt / Trung, giờ giao thừa Việt Nam
// quy ra giờ từng vùng. Web chỉ hiển thị.
import { unstable_noStore as noStore } from "next/cache";

export interface VungGio { mui_gio: string; thanh_pho: string[]; ngay: string; gio: string; utc: number; gio_mua_he: boolean }
export interface TetNuocNgoai {
  slug: string; nam: number; can_chi: string; ten: string; ten_day_du: string; ngay_tet: string; thu_tet: string;
  ngay_tet_trung: string; lich_khac: boolean; ghi_chu_lich: string; dem_giao_thua: string; gio_giao_thua_vn: VungGio[];
  tra_loi_nhanh: string; cong_dong: string; xong_dat: string; hoang_dao: string; hoi_dap: { hoi: string; dap: string }[];
}
export interface DsTet { nuoc: { slug: string; ten: string; ma: string }[]; nam: number }

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

async function lay<T>(duong: string): Promise<T | null | "khong_co"> {
  try {
    const r = await fetch(`${ENGINE_URL}${duong}`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: 60 * 60 * 6 }, signal: AbortSignal.timeout(15_000),
    });
    if (r.status === 404) return "khong_co";
    if (r.ok) return (await r.json()) as T;
  } catch { /* engine bận → null, trang báo 5xx */ }
  noStore();
  return null;
}

export const dsTetNuocNgoai = () => lay<DsTet>("/v1/tet-nuoc-ngoai");
export const tetNuocNgoai = (slug: string) => lay<TetNuocNgoai>(`/v1/tet-nuoc-ngoai/${encodeURIComponent(slug)}`);
export const duongTetNuoc = (slug: string) => `/tet-o-nuoc-ngoai/${slug}`;
export const NUOC_TET = ["my", "nhat-ban", "uc", "canada"] as const;
