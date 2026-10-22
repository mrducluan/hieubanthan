// SEO-L5 — lịch âm cả năm (engine `/v1/lich/nam/{nam}`, Hồ Ngọc Đức UTC+7). Web chỉ hiển thị.
import { unstable_noStore as noStore } from "next/cache";

export interface ThangAm { thang: number; nhuan: boolean; mung_mot: string; so_ngay: number; cuoi: string; can_chi: string; ram: string }
export interface LichNam {
  nam: number; can_chi: string; tet: string; tet_sau: string; thang_nhuan: number | null; thang: ThangAm[];
  tra_loi_nhanh: string; hoi_dap: { hoi: string; dap: string }[]; cach_tinh: string;
}

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function lichNamCongKhai(nam: number): Promise<LichNam | null> {
  try {
    const r = await fetch(`${ENGINE_URL}/v1/lich/nam/${nam}`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: 60 * 60 * 24 * 7 }, signal: AbortSignal.timeout(15_000),
    });
    if (r.ok) return (await r.json()) as LichNam;
  } catch { /* engine bận → trả null, trang báo lỗi 5xx */ }
  noStore();
  return null;
}

export const duongLichAm = (nam: number) => `/lich-am/${nam}`;
/** Năm có trang lịch âm được index: 10 năm trước → 10 năm tới (năm khác vẫn xem được, noindex). */
export const lichAmIndex = (nam: number, namNay: number) => nam >= namNay - 10 && nam <= namNay + 10;
export function docNamLich(s: string): number | null {
  const n = /^\d{4}$/.test(s) ? Number(s) : NaN;
  return n >= 1901 && n <= 2098 ? n : null;
}
