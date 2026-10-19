// Mã video YouTube 11 ký tự từ mọi dạng link (watch?v=, youtu.be, shorts, embed) — bản chép của cms/src/lib/video.ts
// (hai app không import chéo). Web chỉ nhúng qua youtube-nocookie (CSP frame-src), mã sai → không nhúng.
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
    else ma = u.pathname.match(/^\/(embed|shorts|live|v)\/([^/?#]+)/)?.[2] ?? null;
  }
  return ma && MA.test(ma) ? ma : null;
}
