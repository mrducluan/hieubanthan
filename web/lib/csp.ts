// CSP-2 — Content-Security-Policy đầy đủ, tạo MỖI lượt tải trang trong middleware (nonce ngẫu nhiên).
//
// Script: chỉ chạy script mang nonce của lượt này, hoặc script do chính script đó nạp ('strict-dynamic' — để Next tải
// các gói JS, GTM tải gtag). Script lạ chèn vào trang (XSS: <img onerror>, <script> không nonce) và script từ tên miền
// lạ đều bị chặn. 'unsafe-inline' + https: chỉ là phương án lùi cho trình duyệt quá cũ (trình duyệt hiểu nonce bỏ qua chúng).
// Dữ liệu (fetch/XHR/beacon) chỉ gửi được tới connect-src → chặn kiểu ăn cắp dữ liệu gửi ra máy chủ lạ.
// Style giữ 'unsafe-inline' (next/font, motion dùng style nội dòng; rủi ro thấp hơn script nhiều).

/** Origin từ biến môi trường (bỏ qua giá trị rỗng/sai). */
function goc(url: string | undefined): string | null {
  if (!url) return null;
  try { return new URL(url).origin; } catch { return null; }
}

export function taoCsp(nonce: string, dev = process.env.NODE_ENV !== "production"): string {
  const supabase = goc(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const posthog = goc(process.env.NEXT_PUBLIC_POSTHOG_HOST) ?? "https://us.i.posthog.com";
  // GTM chạy trên mọi trang (chủ dự án chốt 2026-10-09): mở đủ tên miền của hệ Google mà thẻ GTM hay gọi —
  // Analytics, Ads/chuyển đổi, DoubleClick, Tag Assistant (chế độ Xem trước của GTM).
  const google = ["https://*.google-analytics.com", "https://*.analytics.google.com", "https://*.googletagmanager.com",
    "https://www.google.com", "https://*.google.com", "https://*.doubleclick.net", "https://*.googleadservices.com",
    "https://*.googlesyndication.com", "https://*.gstatic.com", "https://tagassistant.google.com"];
  // Thêm dịch vụ khác qua GTM (vd Meta Pixel: https://connect.facebook.net,https://www.facebook.com) mà không sửa code:
  // env CSP_THEM_MIEN = danh sách origin cách nhau bằng dấu phẩy → được thêm vào img/connect/frame-src.
  const them = (process.env.CSP_THEM_MIEN ?? "").split(",").map((x) => goc(x.trim())).filter((x): x is string => Boolean(x));
  const ketNoi = ["'self'", posthog, "https://*.posthog.com", ...google, ...them,
    "https://*.ingest.sentry.io", "https://*.ingest.us.sentry.io", "https://*.ingest.de.sentry.io",
    ...(supabase ? [supabase, supabase.replace(/^https:/, "wss:")] : []),
    ...(dev ? ["ws:", "http://localhost:*"] : [])];
  return [
    "default-src 'self'",
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'self' https: 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://fonts.googleapis.com`,
    // notfair.co: ảnh nằm trong thân bài blog NotFair (ảnh bìa đi qua /_next/image = 'self').
    `img-src 'self' data: blob: https://notfair.co ${[...google, ...them].join(" ")}`,
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${ketNoi.join(" ")}`,
    `frame-src 'self' https://www.googletagmanager.com https://tagassistant.google.com https://*.doubleclick.net ${them.join(" ")}`.trim(),
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/** Nonce 128 bit, base64. Chạy được ở Edge runtime (middleware). */
export function taoNonce(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b));
}
