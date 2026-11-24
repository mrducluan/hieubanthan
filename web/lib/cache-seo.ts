// Q-I3 (docs/AUDIT-INDEX-2026-11.md) — allowlist đường dẫn SEO công khai có thể cache HTML trên Vercel CDN.
// Nguyên tắc: CHỈ liệt kê tường minh các trang đọc công khai tiếng Việt (không đọc cookie phiên, không dữ liệu cá nhân).
// Mọi trang công cụ (/than-so, /tu-vi, /bat-tu, /phong-thuy, /kinh-dich, /tarot, /nhan-tuong, /chi-tay, /ky-mon, /hop-doi,
// /doanh-chu, /ban-do-doi-ngu…), trang tài khoản (/tai-khoan, /nap-sao, /hoi-vien, /hoi-chuyen-gia, /ban-than, /gia-dinh),
// /quan-tri, /api/*, /auth/*, /the/*, /qua/*, /en/* (có Vary: Accept-Language) KHÔNG nằm trong danh sách này → luôn giữ
// CSP-2 (nonce ngẫu nhiên mỗi lượt + 'strict-dynamic').

/** Header cache cho Vercel Edge CDN: giữ 1 giờ ở Edge, phục vụ bản cũ trong lúc làm mới tới 24 giờ;
 *  trình duyệt vẫn kiểm tra lại (max-age=0) để khi cập nhật nội dung không bị kẹt cache cục bộ. */
export const CDN_CACHE_SEO = "public, s-maxage=3600, stale-while-revalidate=86400";

const TRANG_DON = new Set([
  "/tu-dien",
  "/kien-thuc",
  "/blog",
  "/tac-gia",
  "/lich-am",
  "/hop-doi/cap-so",
  "/sinh-o-nuoc-ngoai",
  "/gioi-thieu",
  "/chinh-sach-rieng-tu",
  "/dieu-khoan",
  "/mien-tru-trach-nhiem",
  "/lien-he",
]);

// Các cụm kiến thức có trang con (2+ đoạn sau gốc mảng). Riêng /nhan-tuong/do-hinh/* loại trừ để an toàn.
const MAU_CON: RegExp[] = [
  /^\/than-so\/[^/]+(?:\/[^/]+)?$/,
  /^\/tu-vi\/[^/]+(?:\/[^/]+)?$/,
  /^\/bat-tu\/[^/]+(?:\/[^/]+)?$/,
  /^\/kinh-dich\/que(?:\/[^/]+)?$/,
  /^\/phong-thuy\/[^/]+(?:\/[^/]+)?$/,
  /^\/tarot\/[^/]+(?:\/[^/]+)?$/,
  /^\/nhan-tuong\/(?!do-hinh(?:\/|$))[^/]+(?:\/[^/]+)?$/,
  /^\/xem-ngay-tot\/[^/]+$/,
  /^\/lich-am\/\d{4}$/,
  /^\/nam\/\d{4}(?:\/[^/]+)?$/,
  /^\/tuoi-xong-dat\/\d{4}(?:\/[^/]+)?$/,
  /^\/xem-tuoi-lam-nha\/\d{4}(?:\/[^/]+)?$/,
  /^\/xem-sao-han\/\d{4}$/,
  /^\/hop-doi\/cap-so\/[^/]+$/,
  /^\/sinh-o-nuoc-ngoai\/[^/]+$/,
  /^\/su-kien\/[^/]+$/,
  /^\/tac-gia\/[^/]+$/,
  // Blog: trừ /blog/rss.xml
  /^\/blog\/(?!rss\.xml$)[^/]+(?:\/[^/]+)?$/,
];

/** Kiểm tra đường dẫn có nằm trong allowlist SEO công khai cache được trên CDN không. */
export function laDuongCacheSeo(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (p.endsWith(".md")) return false;
  if (TRANG_DON.has(p)) return true;
  return MAU_CON.some((re) => re.test(p));
}

/** Điều kiện đầy đủ để bật CDN cache HTML trong proxy.ts:
 *  - GET/HEAD, không có query string (tránh phân mảnh cache hoặc tham số cá nhân hoá ?nam=/?viec=);
 *  - nằm trong allowlist SEO công khai;
 *  - không ở chế độ xem nháp CMS (__prerender_bypass / __next_preview_data);
 *  - không phải bản preview Vercel (VERCEL_ENV === "preview"). */
export function duocCacheSeo(opts: {
  method: string;
  pathname: string;
  search: string;
  coCookieNhap: boolean;
  vercelEnv?: string;
  tatCache?: boolean;
}): boolean {
  if (opts.tatCache) return false;
  if (opts.method !== "GET" && opts.method !== "HEAD") return false;
  if (opts.search && opts.search.length > 0) return false;
  if (opts.coCookieNhap) return false;
  if (opts.vercelEnv === "preview") return false;
  return laDuongCacheSeo(opts.pathname);
}
