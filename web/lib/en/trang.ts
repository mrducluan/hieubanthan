// QTE-1 tuần 3–4 — dùng chung cho trang tiếng Anh: metadata (tiêu đề tuyệt đối "… | Hieuban", hreflang từ lib/ngon-ngu,
// og:locale en_US) + dữ liệu Day Master từ engine. Web chỉ hiển thị.
import type { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { metaTrang } from "@/lib/seo";

export function metaEn({ tieuDe, moTa, duong }: { tieuDe: string; moTa: string; duong: string }): Metadata {
  const m = metaTrang({ tieuDe, moTa, duong });
  return { ...m, title: { absolute: `${tieuDe} | Hieuban` } };
}

export interface DayMaster {
  slug: string; vi: string; pinyin: string; han: string; element: string; yin_yang: string; name: string;
  image: string; nature: string; strengths: string; watch_out: string; question: string;
}

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
  } catch { /* engine bận → null */ }
  noStore();
  return null;
}

export const dayMasters = () => lay<{ day_masters: DayMaster[] }>("/v1/battu/en/day-masters");
export const dayMaster = (slug: string) => lay<DayMaster>(`/v1/battu/en/day-master/${encodeURIComponent(slug)}`);
