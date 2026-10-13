"use client";
// SAO-2 — phía trình duyệt: mọi lời gọi có thể gặp "cửa Sao" (402 + can) đi qua fetchSao. Hộp thoại dùng chung
// (components/sao/HopThoaiSao, gắn ở layout) hỏi người dùng: đăng nhập / đồng ý trừ Sao / nạp nhanh.
// Đồng ý trừ Sao → gửi lại đúng yêu cầu kèm header x-dong-y-sao: 1 (máy chủ trừ SAU khi trả lời được).
export type CanSao = "dang_nhap" | "xac_nhan_sao" | "nap";
export type YeuCauSao = {
  can: CanSao; error: string; gia?: number; so_du?: number; tran?: number; thuong?: number | null;
  /** can = nap: tài khoản chưa nhận Sao chào mừng → số Sao nhận được khi lưu hồ sơ vào tài khoản (null = đã nhận). */
  chao_mung?: number | null;
  /** "hoi" = hỏi đáp vượt lượt · "luan_giai" = mở khoá báo cáo */
  nguon: "hoi" | "luan_giai"; mo_dun?: string;
};

type Nghe = (y: YeuCauSao) => Promise<boolean>;
let nghe: Nghe | null = null;

export function dangKyHopThoaiSao(f: Nghe): () => void {
  nghe = f;
  return () => { if (nghe === f) nghe = null; };
}

/** Mở hộp thoại; trả true khi người dùng đồng ý dùng Sao (can = xac_nhan_sao) hoặc vừa nhận đủ Sao (can = nap). */
export function hoiSao(y: YeuCauSao): Promise<boolean> {
  return nghe ? nghe(y) : Promise.resolve(false);
}

export const TU_DONG_Y = "sao:tu-dong-y";   // "không hỏi lại trong phiên này" (sessionStorage)
export const QUAY_VE = "sao:quay-ve";       // trang cần quay lại sau khi nạp / đăng nhập (sessionStorage)

/** Báo cáo đang chờ mở (người dùng bấm "Mở toàn bộ" rồi đi đăng nhập / nạp): localStorage để sống qua tab mới
 *  (link trong thư) — gắn đúng route + lá số, hết hạn sau 30 phút. Người dùng bấm "Để sau" thì xoá. */
const CHO_MO = "lg:cho-mo";
const CHO_MO_HAN = 30 * 60_000;
const vanTay = (x: unknown) => { const s = JSON.stringify(x) ?? ""; let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return String(h); };
export function ghiChoMo(duong: string, laSo: unknown): void {
  try { localStorage.setItem(CHO_MO, JSON.stringify({ d: duong, k: vanTay(laSo), t: Date.now() })); } catch { /* chế độ riêng tư */ }
}
export function xoaChoMo(): void { try { localStorage.removeItem(CHO_MO); } catch { /* bỏ qua */ } }
export function dangChoMo(duong: string, laSo: unknown): boolean {
  try {
    const v = JSON.parse(localStorage.getItem(CHO_MO) ?? "null") as { d?: string; k?: string; t?: number } | null;
    if (!v) return false;
    if (!v.t || Date.now() - v.t > CHO_MO_HAN) { xoaChoMo(); return false; }
    return v.d === duong && v.k === vanTay(laSo);
  } catch { return false; }
}

function doc(k: string): string | null { try { return sessionStorage.getItem(k); } catch { return null; } }

/** fetch có xử lý cửa Sao. Trả Response cuối cùng (402 nếu người dùng chưa đồng ý / cần đăng nhập / cần nạp). */
export async function fetchSao(url: string, init: RequestInit, nguon: YeuCauSao["nguon"]): Promise<Response> {
  const r = await fetch(url, init);
  if (r.status !== 402) return r;
  const d = (await r.clone().json().catch(() => null)) as Omit<YeuCauSao, "nguon"> | null;
  if (!d?.can) return r;
  const dongY = d.can === "xac_nhan_sao" && doc(TU_DONG_Y) === "1" ? true : await hoiSao({ ...d, nguon });
  if (!dongY || d.can === "dang_nhap") return r;
  const h = new Headers(init.headers);
  if (d.can === "xac_nhan_sao") h.set("x-dong-y-sao", "1");
  // can = nap + true: vừa nhận Sao chào mừng → gửi lại đúng yêu cầu (máy chủ tự hỏi đồng ý nếu là câu hỏi).
  return d.can === "nap" ? fetchSao(url, { ...init, headers: h }, nguon) : fetch(url, { ...init, headers: h });
}
