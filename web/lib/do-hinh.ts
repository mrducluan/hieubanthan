// Lớp phủ đồ hình Nhân tướng — đọc engine `/v1/nhan-tuong/do-hinh` (tầng KB: toạ độ 0..1 đo trên ảnh khắc gỗ, chữ Hán, âm,
// nghĩa Việt). Web chỉ hiển thị; ảnh gốc tự phục vụ ở /anh/do-hinh/<tep> (tách khỏi đường dẫn trang), không sửa điểm ảnh.
const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export const DUONG_DO_HINH = "/nhan-tuong/do-hinh";
export const anhDoHinh = (tep: string) => `/anh/do-hinh/${tep}`;

export interface DiemDoHinh {
  id: string; vt: [number, number]; han: string; am?: string | null; ten: string; y: string; nhom: string;
  /** Nốt ruồi: A sách khen · B nên chú ý · C ghi chép xưa (đã nói giảm). Điểm khác: không có. */
  muc?: "A" | "B" | "C" | null;
  tuoi?: number[]; ben?: string; duong?: string; sach_ghi?: { han: string; y: string; sach: string };
}
export interface MucDoHinh {
  ma: string; ten: string; ten_han: string; am: string; tep: string; rong: number; cao: number; mo_ta: string;
  so_diem: number; duong: string;
}
export interface DoHinh extends Omit<MucDoHinh, "so_diem"> {
  nhom: { ma: string; ten: string }[]; diem: DiemDoHinh[]; cau_khung?: string | null;
  nguon_hien_thi: string; khac: MucDoHinh[];
}

async function lay<T>(duong: string): Promise<T | null> {
  try {
    const r = await fetch(`${ENGINE_URL}${duong}`, {
      headers: ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {},
      next: { revalidate: 60 * 60 * 6 }, signal: AbortSignal.timeout(15_000),
    });
    if (r.status === 404) return null;
    if (r.ok) return (await r.json()) as T;
  } catch { /* engine bận */ }
  // Ném lỗi → trang trả 5xx (Google thử lại sau), sitemap tự bỏ cụm này; không gọi noStore() ở đây vì sitemap cũng đi qua.
  throw new Error("engine đồ hình không phản hồi");
}

export async function danhMucDoHinh(): Promise<{ nguon_hien_thi: string; do_hinh: MucDoHinh[] }> {
  const d = await lay<{ nguon_hien_thi: string; do_hinh: MucDoHinh[] }>("/v1/nhan-tuong/do-hinh");
  if (!d) throw new Error("engine đồ hình không phản hồi");
  return d;
}

export async function layDoHinh(ma: string): Promise<DoHinh | null> {
  if (!/^[a-z0-9-]{2,60}$/.test(ma)) return null;
  return lay<DoHinh>(`/v1/nhan-tuong/do-hinh/${ma}`);
}
