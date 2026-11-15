// Chỉ tay — đọc engine `/v1/chi-tay` (tầng KB: 67 hình vân Thần Tướng Toàn Biên quyển 10 + đồ hình tám cung bàn tay).
// Web chỉ hiển thị; ảnh tự phục vụ ở /anh/chi-tay/van/<anh> và /anh/do-hinh/<tep>. Không ảnh tay người dùng.
import type { DoHinh } from "@/lib/do-hinh";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export const DUONG_CHI_TAY = "/chi-tay";
export const anhVan = (tep: string) => `/anh/chi-tay/van/${tep}`;
export const KHOA_CHI_TAY = "hbt.chi_tay.v1";

export interface VanTay {
  ma: string; ten: string; ten_han: string; am_ten: string; anh: string; rong: number; cao: number;
  han: string; am?: string; y: string; nhom: "A" | "B" | "C"; chu_de: string; ham_y?: string; viec?: string; loi: string;
}
export interface ThuVienChiTay {
  nguon_hien_thi: string; chu_de: { ma: string; ten: string }[]; van: VanTay[]; cau_ket: string; do_hinh: DoHinh | null;
}

export async function layThuVienChiTay(): Promise<ThuVienChiTay> {
  try {
    const r = await fetch(`${ENGINE_URL}/v1/chi-tay`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: 60 * 60 * 6 }, signal: AbortSignal.timeout(15_000),
    });
    if (r.ok) return (await r.json()) as ThuVienChiTay;
  } catch { /* engine bận */ }
  throw new Error("engine chỉ tay không phản hồi");   // trang trả 5xx, không dựng trang rỗng
}

/** Bài thơ bảy chữ (hoặc năm chữ) tách dòng để đọc. */
export function tachCau(han: string): string[] {
  const n = han.length % 4 === 0 && han.length / 4 >= 4 ? han.length / 4 : han.length % 7 ? 5 : 7;   // bài bốn câu
  const ra: string[] = [];
  for (let i = 0; i < han.length; i += n) ra.push(han.slice(i, i + n));
  return ra;
}
