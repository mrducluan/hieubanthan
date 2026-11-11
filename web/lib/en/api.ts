"use client";
// QTE — gọi route handler của web từ các trang /en: luôn kèm `x-ngon-ngu: en` để route chuyển tiếp cho engine (engine phủ
// KB tiếng Anh). Không gọi engine trực tiếp; lỗi trả câu tiếng Anh.
import { maNgonNguTrang } from "@/lib/ngon-ngu";

/** Mã ngôn ngữ gửi kèm: biến thể của trang đang mở ("en-us") hoặc "en" (Ý7). */
const nn = () => { const m = maNgonNguTrang(); return m === "vi" ? "en" : m; };

export async function postEn<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json", "x-ngon-ngu": nn() }, body: JSON.stringify(body) });
  const d = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(loiEn(r.status, d.error));
  return d;
}
/** GET có thể bị CDN đệm (`cache-control: public`) → ngôn ngữ đi trong URL (`?ngon_ngu=`), không chỉ trong header. */
export async function getEn<T>(url: string): Promise<T> {
  const r = await fetch(`${url}${url.includes("?") ? "&" : "?"}ngon_ngu=${nn()}`, { headers: { "x-ngon-ngu": nn() } });
  const d = (await r.json().catch(() => ({}))) as T & { error?: string };
  if (!r.ok) throw new Error(loiEn(r.status, d.error));
  return d;
}
/** Route handler viết lỗi tiếng Việt → đổi sang câu tiếng Anh chung (không lộ chữ kỹ thuật). */
export function loiEn(status: number, _vi?: string): string {
  if (status === 422) return "Please check the details you entered (date of birth, name).";
  if (status === 429 || status === 402) return "You have reached today's limit for questions. Please try again later.";
  if (status === 503) return "The calculation service is being updated. Please try again in a few minutes.";
  return "We could not reach the calculation service. Please try again shortly.";
}

/** Lời đáp hỏi đáp của engine (bản Anh): Numerology `/api/thanso/hoi`, Tarot `/api/tarot/hoi`. */
export interface TraLoiEn { cau_tra_loi: string; can_cu?: string[]; hoi_tiep?: string[]; xu_ly?: string; phan_loai?: { xu_ly?: string } }
