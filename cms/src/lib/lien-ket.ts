// CMS-4 — danh sách trang nội bộ của web (kiến thức, công cụ, từ điển…) để gợi ý liên kết khi viết. Đọc từ web
// GET {WEB_URL}/api/lien-ket-noi-bo (dữ liệu công khai, như sitemap), giữ trong bộ nhớ 1 giờ. Web lỗi → [].
import { webUrl } from "./web";

export type TrangNoiBo = { url: string; tieu_de: string; mo_ta?: string | null };
let nho: { luc: number; ds: TrangNoiBo[] } | null = null;

export async function trangNoiBo(): Promise<TrangNoiBo[]> {
  if (nho && Date.now() - nho.luc < 3_600_000) return nho.ds;
  if (!process.env.WEB_URL) return [];
  try {
    const r = await fetch(`${webUrl()}/api/lien-ket-noi-bo`, { signal: AbortSignal.timeout(5_000) });
    if (!r.ok) return nho?.ds ?? [];
    const d = (await r.json()) as { ds?: TrangNoiBo[] };
    const ds = (d.ds ?? []).filter((t) => typeof t.url === "string" && t.url.startsWith("/") && typeof t.tieu_de === "string").slice(0, 3000);
    nho = { luc: Date.now(), ds };
    return ds;
  } catch {
    return nho?.ds ?? [];
  }
}
