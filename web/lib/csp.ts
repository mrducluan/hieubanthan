// CSP-2 — Content-Security-Policy đầy đủ, tạo MỖI lượt tải trang trong proxy.ts (nonce ngẫu nhiên).
//
// Script: chỉ chạy script mang nonce của lượt này, hoặc script do chính script đó nạp ('strict-dynamic' — để Next tải
// các gói JS, GTM tải gtag). Script lạ chèn vào trang (XSS: <img onerror>, <script> không nonce) và script từ tên miền
// lạ đều bị chặn. 'unsafe-inline' + https: chỉ là phương án lùi cho trình duyệt quá cũ (trình duyệt hiểu nonce bỏ qua chúng).
// Dữ liệu (fetch/XHR/beacon) chỉ gửi được tới connect-src → chặn kiểu ăn cắp dữ liệu gửi ra máy chủ lạ.
// 'wasm-unsafe-eval' (ANH-3): chỉ cho phép DỊCH WebAssembly (bộ tìm điểm mốc gương mặt chạy trên máy, tệp tự phục vụ ở
// /mediapipe/) — không mở eval() của JavaScript. Bộ đó có sẵn đoạn gửi số liệu hiệu năng về nhà phát triển: connect-src không có
// tên miền đó nên trình duyệt chặn, không gì rời máy (e2e/anh-tu-dong.spec.ts kiểm).
// Q-I3 (cache HTML ở CDN): trang công khai không query dùng nonce ỔN ĐỊNH theo (bản deploy, đường dẫn) — `nonceOnDinh` —
// để HTML đã cache và header CSP cùng một nonce; trang khác nonce ngẫu nhiên mỗi lượt (`taoNonce`).
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
  // Meta Pixel (2026-11-16): fbevents.js + ping chuyển đổi.
  const meta = ["https://connect.facebook.net", "https://www.facebook.com"];
  const them = (process.env.CSP_THEM_MIEN ?? "").split(",").map((x) => goc(x.trim())).filter((x): x is string => Boolean(x));
  const anhCms = [goc(process.env.CMS_URL), goc(process.env.CMS_ANH_URL)].filter((x): x is string => Boolean(x));
  const ketNoi = ["'self'", posthog, "https://*.posthog.com", ...google, ...them,
    ...meta, "https://*.ingest.sentry.io", "https://*.ingest.us.sentry.io", "https://*.ingest.de.sentry.io",
    ...(supabase ? [supabase, supabase.replace(/^https:/, "wss:")] : []),
    ...(dev ? ["ws:", "http://localhost:*"] : [])];
  return [
    "default-src 'self'",
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'self' https: 'unsafe-inline' 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://fonts.googleapis.com`,
    // notfair.co: ảnh nằm trong thân bài blog NotFair (ảnh bìa đi qua /_next/image = 'self').
    // CMS: ảnh bài viết nằm ở CMS (CMS_URL) hoặc kho ảnh của CMS (CMS_ANH_URL, vd Supabase Storage công khai).
    `img-src 'self' data: blob: https://notfair.co ${[...anhCms, ...google, ...meta, ...them].join(" ")}`,
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src ${ketNoi.join(" ")}`,
    `frame-src 'self' https://www.youtube-nocookie.com https://www.googletagmanager.com https://tagassistant.google.com https://*.doubleclick.net ${them.join(" ")}`.trim(),
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "media-src 'self' blob:",   // blob: = video Story lì xì quay tại máy (xem trước, không tải lên đâu)
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/** Nonce 128 bit, base64. Chạy được ở cả Edge lẫn Node (proxy.ts). */
export function taoNonce(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return btoa(String.fromCharCode(...b));
}

/** Bí mật ký nonce ổn định: env riêng, rồi bí mật máy chủ sẵn có. Ngoài Vercel (máy dev, CI) dùng chuỗi cố định để test
 *  được; trên Vercel mà thiếu → null (không cache HTML, nonce ngẫu nhiên như cũ). */
function biMatNonce(): string | null {
  const s = process.env.CSP_NONCE_SECRET || process.env.LOI_MOI_SECRET || process.env.SAO_KHOA_SECRET;
  if (s && s.length >= 16) return s;
  return process.env.VERCEL ? null : "hbt-csp-nonce-khong-phai-vercel";
}

/** Nonce ổn định = HMAC(bí mật, mã bản deploy | đường dẫn), 128 bit. Cache CDN của Vercel tách theo bản deploy (deploy
 *  mới xoá cache), nên HTML cache và header luôn cùng nonce. Ai đọc trang cũng thấy nonce — giống mọi nonce — nhưng chữ
 *  chèn vào trang (XSS) không biết trước nonce của bản deploy kế tiếp, và thuộc tính sự kiện / javascript: vẫn bị chặn. */
export async function nonceOnDinh(duong: string): Promise<string | null> {
  const bm = biMatNonce();
  if (!bm) return null;
  const ban = process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_BUILD_ID || "local";
  const k = await crypto.subtle.importKey("raw", new TextEncoder().encode(bm), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode(`csp|${ban}|${duong}`)));
  return btoa(String.fromCharCode(...sig.subarray(0, 16)));
}
