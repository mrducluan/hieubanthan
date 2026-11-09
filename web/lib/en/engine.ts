// QTE — gọi engine từ máy chủ (trang kiến thức /en) với header ngôn ngữ; giữ ENGINE key phía server. Lỗi → null (trang 404/5xx tự quyết).
import "server-only";

const ENGINE_URL = process.env.ENGINE_URL ?? "http://localhost:8000";
const ENGINE_API_KEY = process.env.ENGINE_API_KEY;

export async function engineEn<T>(duong: string, revalidate = 21_600): Promise<{ ok: true; data: T } | { ok: false; status: number }> {
  const ban = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "dev";
  const u = `${ENGINE_URL}${duong}${duong.includes("?") ? "&" : "?"}ngon_ngu=en&b=${ban}`;
  try {
    const r = await fetch(u, { headers: { "x-ngon-ngu": "en", ...(ENGINE_API_KEY ? { "x-engine-key": ENGINE_API_KEY } : {}) }, next: { revalidate } });
    if (!r.ok) return { ok: false, status: r.status };
    return { ok: true, data: (await r.json()) as T };
  } catch {
    return { ok: false, status: 502 };
  }
}

/** Tên lá tiếng Anh → slug URL ("The Fool" → "the-fool", "Ace of Wands" → "ace-of-wands"). */
export function slugLa(en: string): string {
  return en.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
