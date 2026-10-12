"use client";
// SAO-2 — phía trình duyệt: mọi lời gọi có thể gặp "cửa Sao" (402 + can) đi qua fetchSao. Hộp thoại dùng chung
// (components/sao/HopThoaiSao, gắn ở layout) hỏi người dùng: đăng nhập / đồng ý trừ Sao / nạp nhanh.
// Đồng ý trừ Sao → gửi lại đúng yêu cầu kèm header x-dong-y-sao: 1 (máy chủ trừ SAU khi trả lời được).
export type CanSao = "dang_nhap" | "xac_nhan_sao" | "nap";
export type YeuCauSao = {
  can: CanSao; error: string; gia?: number; so_du?: number; tran?: number; thuong?: number | null;
  /** "hoi" = hỏi đáp vượt lượt · "luan_giai" = mở khoá báo cáo */
  nguon: "hoi" | "luan_giai"; mo_dun?: string;
};

type Nghe = (y: YeuCauSao) => Promise<boolean>;
let nghe: Nghe | null = null;

export function dangKyHopThoaiSao(f: Nghe): () => void {
  nghe = f;
  return () => { if (nghe === f) nghe = null; };
}

/** Mở hộp thoại; trả true khi người dùng đồng ý dùng Sao (chỉ có nghĩa với can = xac_nhan_sao). */
export function hoiSao(y: YeuCauSao): Promise<boolean> {
  return nghe ? nghe(y) : Promise.resolve(false);
}

export const TU_DONG_Y = "sao:tu-dong-y";   // "không hỏi lại trong phiên này" (sessionStorage)
export const QUAY_VE = "sao:quay-ve";       // trang cần quay lại sau khi nạp / đăng nhập (sessionStorage)

function doc(k: string): string | null { try { return sessionStorage.getItem(k); } catch { return null; } }

/** fetch có xử lý cửa Sao. Trả Response cuối cùng (402 nếu người dùng chưa đồng ý / cần đăng nhập / cần nạp). */
export async function fetchSao(url: string, init: RequestInit, nguon: YeuCauSao["nguon"]): Promise<Response> {
  const r = await fetch(url, init);
  if (r.status !== 402) return r;
  const d = (await r.clone().json().catch(() => null)) as Omit<YeuCauSao, "nguon"> | null;
  if (!d?.can) return r;
  const dongY = d.can === "xac_nhan_sao" && doc(TU_DONG_Y) === "1" ? true : await hoiSao({ ...d, nguon });
  if (!dongY || d.can !== "xac_nhan_sao") return r;
  const h = new Headers(init.headers);
  h.set("x-dong-y-sao", "1");
  return fetch(url, { ...init, headers: h });
}
