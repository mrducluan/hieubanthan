// Video nhúng trong bài: CHỈ YouTube, phát qua youtube-nocookie (không cài cookie quảng cáo cho người đọc chưa bấm
// phát). Lấy mã video 11 ký tự từ mọi dạng link YouTube. File không import gì (chạy cả trình duyệt lẫn node --test).
const MA = /^[A-Za-z0-9_-]{11}$/;

export function maYoutube(url: unknown): string | null {
  if (typeof url !== "string") return null;
  const s = url.trim();
  if (MA.test(s)) return s;
  let u: URL;
  try { u = new URL(s); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const host = u.hostname.replace(/^(www\.|m\.)/, "");
  let ma: string | null = null;
  if (host === "youtu.be") ma = u.pathname.slice(1).split("/")[0] ?? null;
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname === "/watch") ma = u.searchParams.get("v");
    else {
      const m = u.pathname.match(/^\/(embed|shorts|live|v)\/([^/?#]+)/);
      ma = m ? m[2]! : null;
    }
  }
  return ma && MA.test(ma) ? ma : null;
}

/** Giây bắt đầu từ ?t=90 / ?t=1m30s / ?start=90 (tuỳ chọn). */
export function giayBatDau(url: unknown): number | null {
  if (typeof url !== "string") return null;
  let u: URL;
  try { u = new URL(url.trim()); } catch { return null; }
  const t = u.searchParams.get("t") ?? u.searchParams.get("start");
  if (!t) return null;
  if (/^\d+$/.test(t)) return Number(t);
  const m = t.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
  if (!m || !m[0]) return null;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}
