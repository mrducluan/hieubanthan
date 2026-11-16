// SEO-L5 — lịch âm cả năm (engine `/v1/lich/nam/{nam}`, Hồ Ngọc Đức UTC+7). Web chỉ hiển thị.
import { duongTheoLuot } from "@/lib/engine-ngon-ngu";
import { unstable_noStore as noStore } from "next/cache";

export interface ThangAm { thang: number; nhuan: boolean; mung_mot: string; so_ngay: number; cuoi: string; can_chi: string; ram: string }
export interface LichNam {
  nam: number; can_chi: string; tet: string; tet_sau: string; thang_nhuan: number | null; thang: ThangAm[];
  tra_loi_nhanh: string; hoi_dap: { hoi: string; dap: string }[]; cach_tinh: string;
  /** SEO-O: ngày lễ âm lịch của năm + số ngày năm âm (engine cũ: không có). */
  le?: LeAm[]; so_ngay?: number;
}
export interface LeAm { ma: string; ten: string; am: string; duong: string; thu: string }
export interface TetNam { nam: number; can_chi: string; con_giap: string; tet: string; thang_nhuan: number | null; so_ngay: number }

/** SEO-O: bảng Tết nhiều năm (≤ 30 năm) cho mục lục /lich-am. Engine cũ → null (trang giữ bản cũ). */
export async function cacNamLich(tu: number, den: number): Promise<TetNam[] | null> {
  try {
    // EN-ALL GĐ 8: ngôn ngữ của lượt tải đi trong URL (khoá đệm) + header; bản Việt giữ nguyên URL cũ.
    const nn = await duongTheoLuot(`/v1/lich/cac-nam?tu=${tu}&den=${den}`);
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, {
      headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau },
      next: { revalidate: 60 * 60 * 24 * 7 }, signal: AbortSignal.timeout(15_000),
    });
    if (r.ok) return (await r.json()) as TetNam[];
  } catch { /* engine cũ / bận */ }
  return null;
}

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

// SEO-O: "?b=le" đổi khoá bộ nhớ đệm fetch (đệm 7 ngày, giữ qua deploy) để trang nhận ngay trường `le` mới.
export async function lichNamCongKhai(nam: number): Promise<LichNam | null> {
  try {
    const nn = await duongTheoLuot(`/v1/lich/nam/${nam}?b=le`);
    const r = await fetch(`${ENGINE_URL}${nn.duong}`, {
      headers: { ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}), ...nn.dau },
      next: { revalidate: 60 * 60 * 24 * 7 }, signal: AbortSignal.timeout(15_000),
    });
    if (r.ok) return (await r.json()) as LichNam;
  } catch { /* engine bận → trả null, trang báo lỗi 5xx */ }
  noStore();
  return null;
}

export const duongLichAm = (nam: number, en = false) => en ? `/en/lunar-calendar/${nam}` : `/lich-am/${nam}`;
/** Năm có trang lịch âm được index: 10 năm trước → 10 năm tới (năm khác vẫn xem được, noindex). */
export const lichAmIndex = (nam: number, namNay: number) => nam >= namNay - 10 && nam <= namNay + 10;
export function docNamLich(s: string): number | null {
  const n = /^\d{4}$/.test(s) ? Number(s) : NaN;
  return n >= 1901 && n <= 2098 ? n : null;
}

// LA-UI (2026-11-16) — mọi ngày của năm âm cho component lịch (`components/lich-am/LichAmNam`). Engine tính hết
// (`/v1/lich/nam-ngay/{nam}`: âm – dương, can chi ngày, hoàng đạo, trực, ngày đẹp, kiêng dân gian, tiết khí, ngày lễ);
// web chỉ vẽ. Khoá ngắn vì một lượt ~355 ngày. Engine cũ / bận → null, trang bỏ khối lịch (không 5xx).
export interface NgayAm {
  /** dương lịch YYYY-MM-DD */ d: string; /** ngày âm 1..30 */ a: number; /** 0 = thứ Hai */ thu: number; /** can chi ngày */ cc: string;
  /** hoàng đạo */ hd: boolean; /** thần */ th: string; /** trực */ tr: string; dep?: boolean; ky?: string[]; tiet?: string; le?: string[];
}
export interface ThangAmNgay {
  thang: number; nhuan: boolean; ten: string; can_chi: string; mung_mot: string; cuoi: string; so_ngay: number;
  so_hoang_dao: number; so_dep: number; ngay: NgayAm[];
}
export interface TietKhi { ten: string; nghia: string; loai: "tiet" | "trung_khi"; ngay: string; gio: string; am: string }
export interface LichNgay {
  nam: number; can_chi: string; tet: string; tet_sau: string; so_ngay: number; thang_nhuan: number | null;
  thang: ThangAmNgay[]; tiet_khi: TietKhi[]; chu_thich: string;
}
export async function lichNgayCongKhai(nam: number): Promise<LichNgay | null> {
  if (nam < 1901 || nam > 2098) return null;
  try {
    const r = await fetch(`${ENGINE_URL}/v1/lich/nam-ngay/${nam}`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: 60 * 60 * 24 * 7 }, signal: AbortSignal.timeout(15_000),
    });
    if (r.ok) return (await r.json()) as LichNgay;
  } catch { /* engine cũ / bận → trang không có khối lịch */ }
  return null;
}
