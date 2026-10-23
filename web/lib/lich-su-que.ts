// UI-KD — lịch sử quẻ đã gieo, CHỈ trên máy người dùng (localStorage `hbt.que.v1`, ≤ 20 quẻ). Không gửi lên máy chủ,
// không gắn tài khoản. "Xem lại" = gọi lại engine với `cach_ra_que: gieo_tay` + đúng 6 giá trị cũ (tất định) — không gieo lại.
import type { GiaTriHao } from "@/lib/dong-xu";

export const KHOA_LICH_SU_QUE = "hbt.que.v1";
export const TOI_DA_QUE = 20;
const TOI_DA_CAU = 200;

export interface QueDaLuu {
  id: string;
  /** ISO lúc gieo (giờ máy người dùng). */
  luc: string;
  /** Câu hỏi đã cắt ≤ 200 ký tự — chỉ trên máy này. */
  cau: string;
  gia_tri_hao: GiaTriHao[];
  /** Cách ra quẻ lúc gieo (may_gieo / mai_hoa / gieo_tay …) và chế độ đọc. */
  cach: string;
  che_do: string;
  chu_de?: { ma: string; ten: string } | null;
  ten_que: string;
  ten_bien?: string | null;
}

function doc(): QueDaLuu[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KHOA_LICH_SU_QUE) ?? "[]") as unknown;
    if (!Array.isArray(raw)) return [];
    return raw.filter((q): q is QueDaLuu =>
      !!q && typeof q === "object" && typeof (q as QueDaLuu).id === "string" && Array.isArray((q as QueDaLuu).gia_tri_hao)
      && (q as QueDaLuu).gia_tri_hao.length === 6 && typeof (q as QueDaLuu).ten_que === "string");
  } catch { return []; }
}
function ghi(ds: QueDaLuu[]) {
  try { localStorage.setItem(KHOA_LICH_SU_QUE, JSON.stringify(ds.slice(0, TOI_DA_QUE))); } catch { /* trình duyệt chặn lưu */ }
}

export function docLichSuQue(): QueDaLuu[] { return doc(); }

/** Thêm một quẻ lên đầu danh sách; trả bản ghi đã lưu. */
export function luuQue(q: Omit<QueDaLuu, "id" | "luc" | "cau"> & { cau: string; luc?: string }): QueDaLuu {
  const moi: QueDaLuu = {
    ...q,
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    luc: q.luc ?? new Date().toISOString(),
    cau: q.cau.trim().slice(0, TOI_DA_CAU),
  };
  ghi([moi, ...doc()]);
  return moi;
}

export function xoaQue(id: string): QueDaLuu[] {
  const ds = doc().filter((q) => q.id !== id);
  ghi(ds);
  return ds;
}

export function xoaHetQue(): void {
  try { localStorage.removeItem(KHOA_LICH_SU_QUE); } catch { /* bỏ qua */ }
}

/** "14:05 · 23/10" theo giờ máy. */
export function nhanLuc(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0"), mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm} · ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`;
}
