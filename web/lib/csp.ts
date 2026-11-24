// CSP-2 — Content-Security-Policy hai vùng (Q-I3 Phương án C):
// 1) taoCsp(nonce): Vùng 2 (tài khoản, nạp Sao, hội viên, quản trị, người đã đăng nhập, ?kw=, /en) — nonce 128-bit
//    mới mỗi lượt + 'strict-dynamic'. Chặn tuyệt đối XSS chèn script không nonce.
// 2) taoCspCongKhai(): Vùng 1 (allowlist trang công khai cho khách vãng lai & bot tìm kiếm/AI được cache HTML tại
//    Vercel Edge) — KHÔNG dùng nonce (tránh lệch giữa header và HTML đã cache), vẫn giữ chặn tuyệt đối object-src,
//    frame-ancestors, base-uri, form-action và giới hạn chặt script-src / connect-src theo danh sách tên miền cho phép.
// 'wasm-unsafe-eval' (ANH-3): chỉ cho phép dịch WebAssembly (/mediapipe/), không mở eval() của JavaScript.

/** Origin từ biến môi trường (bỏ qua giá trị rỗng/sai). */
function goc(url: string | undefined): string | null {
  if (!url) return null;
  try { return new URL(url).origin; } catch { return null; }
}

function thanhPhanCsp(dev: boolean) {
  const supabase = goc(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const posthog = goc(process.env.NEXT_PUBLIC_POSTHOG_HOST) ?? "https://us.i.posthog.com";
  // GTM chạy trên mọi trang (chủ dự án chốt 2026-10-09): mở đủ tên miền của hệ Google mà thẻ GTM hay gọi —
  // Analytics, Ads/chuyển đổi, DoubleClick, Tag Assistant (chế độ Xem trước của GTM).
  const google = ["https://*.google-analytics.com", "https://*.analytics.google.com", "https://*.googletagmanager.com",
    "https://www.google.com", "https://*.google.com", "https://*.doubleclick.net", "https://*.googleadservices.com",
    "https://*.googlesyndication.com", "https://*.gstatic.com", "https://tagassistant.google.com"];
  // Thêm dịch vụ khác qua GTM (vd Meta Pixel) bằng env CSP_THEM_MIEN mà không sửa code.
  const meta = ["https://connect.facebook.net", "https://www.facebook.com"];
  const them = (process.env.CSP_THEM_MIEN ?? "").split(",").map((x) => goc(x.trim())).filter((x): x is string => Boolean(x));
  const anhCms = [goc(process.env.CMS_URL), goc(process.env.CMS_ANH_URL)].filter((x): x is string => Boolean(x));
  const ketNoi = ["'self'", posthog, "https://*.posthog.com", ...google, ...them,
    ...meta, "https://*.ingest.sentry.io", "https://*.ingest.us.sentry.io", "https://*.ingest.de.sentry.io",
    ...(supabase ? [supabase, supabase.replace(/^https:/, "wss:")] : []),
    ...(dev ? ["ws:", "http://localhost:*"] : [])];
  const phanChung = [
    "default-src 'self'",
    `style-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://fonts.googleapis.com`,
    `img-src 'self' data: blob: https://notfair.co ${[...anhCms, ...google, ...meta, ...them].join(" ")}`,
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${ketNoi.join(" ")}`,
    `frame-src 'self' https://www.youtube-nocookie.com https://www.googletagmanager.com https://tagassistant.google.com https://*.doubleclick.net ${them.join(" ")}`.trim(),
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self'",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ];
  return { google, meta, them, phanChung };
}

/** Vùng 2 — CSP-2 đầy đủ với nonce ngẫu nhiên mỗi lượt tải trang. */
export function taoCsp(nonce: string, dev = process.env.NODE_ENV !== "production"): string {
  const { phanChung } = thanhPhanCsp(dev);
  return [
    phanChung[0]!,
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'self' https: 'unsafe-inline' 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ""}`,
    ...phanChung.slice(1),
  ].join("; ");
}

/** Vùng 1 — CSP cho HTML công khai được cache tại Edge CDN (không nonce; giữ host-allowlist + connect-src chặt). */
export function taoCspCongKhai(dev = process.env.NODE_ENV !== "production"): string {
  const { google, meta, them, phanChung } = thanhPhanCsp(dev);
  const scriptHosts = ["'self'", "'unsafe-inline'", "'wasm-unsafe-eval'", ...google, ...meta, ...them, ...(dev ? ["'unsafe-eval'"] : [])];
  return [
    phanChung[0]!,
    `script-src ${scriptHosts.join(" ")}`,
    ...phanChung.slice(1),
  ].join("; ");
}

/** Nonce 128 bit, base64. Chạy được ở cả Edge lẫn Node (proxy.ts). */
export function taoNonce(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b));
}
