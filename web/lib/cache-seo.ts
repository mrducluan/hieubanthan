// Q-I3 (docs/AUDIT-INDEX-2026-11.md) — allowlist đường dẫn SEO công khai có thể cache HTML trên Vercel CDN.
// Nguyên tắc: CHỈ liệt kê tường minh các trang đọc công khai tiếng Việt (không đọc cookie phiên, không dữ liệu cá nhân).
// Mọi trang công cụ (/than-so, /tu-vi, /bat-tu, /phong-thuy, /kinh-dich, /tarot, /nhan-tuong, /chi-tay, /ky-mon, /hop-doi,
// /doanh-chu, /ban-do-doi-ngu…), trang tài khoản (/tai-khoan, /nap-sao, /hoi-vien, /hoi-chuyen-gia, /ban-than, /gia-dinh),
// /quan-tri, /api/*, /auth/*, /the/*, /qua/*, /en/* (có Vary: Accept-Language) KHÔNG nằm trong danh sách này → luôn giữ
// CSP-2 (nonce ngẫu nhiên mỗi lượt + 'strict-dynamic').

/** Header cache cho trang kiến thức ổn định: giữ 1 giờ ở Vercel Edge, phục vụ bản cũ trong lúc làm mới tới 24 giờ. */
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

// Các cụm kiến thức có trang con. Riêng /nhan-tuong/do-hinh/* loại trừ để an toàn.
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
  // Blog: bài viết, chuyên mục, mảng, phân trang (cả /blog/chuyen-muc/[slug]/trang/[n]), trừ /blog/rss.xml
  /^\/blog\/(?!rss\.xml$)[^/]+(?:\/[^/]+)?$/,
  /^\/blog\/chuyen-muc\/[^/]+\/trang\/\d+$/,
];

/** Kiểm tra đường dẫn có nằm trong allowlist SEO công khai cache được trên CDN không. */
export function laDuongCacheSeo(pathname: string): boolean {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (p.endsWith(".md")) return false;
  if (TRANG_DON.has(p)) return true;
  return MAU_CON.some((re) => re.test(p));
}

/** Số giây còn lại tới 00:00 hôm sau theo giờ Việt Nam (UTC+7), kẹp trong [60, 1800] để trang ngày/lịch không
 *  giữ nhãn "Hôm nay" quá nửa đêm. */
export function headerCacheSeo(pathname: string, nowMs = Date.now()): string {
  const p = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (p.startsWith("/xem-ngay-tot/") || p === "/lich-am" || p.startsWith("/lich-am/")) {
    const vnMs = nowMs + 7 * 3600 * 1000;
    const giayTrongNgay = Math.floor((vnMs % 86_400_000) / 1000);
    const conLai = Math.max(60, Math.min(1800, 86_400 - giayTrongNgay));
    return `public, s-maxage=${conLai}, stale-while-revalidate=60`;
  }
  return CDN_CACHE_SEO;
}

/** Điều kiện đầy đủ để bật CDN cache HTML trong proxy.ts:
 *  - GET/HEAD, không có query string (tránh phân mảnh cache hoặc tham số cá nhân hoá ?nam=/?viec=/?_rsc=);
 *  - KHÔNG phải yêu cầu RSC/prefetch điều hướng nội bộ (chỉ cache tài liệu HTML đầy đủ);
 *  - nằm trong allowlist SEO công khai;
 *  - không ở chế độ xem nháp CMS (__prerender_bypass / __next_preview_data / hbt-xem-truoc);
 *  - không ở bản preview Vercel trừ khi bật rõ `Q_I3_CACHE_PREVIEW=1` để kiểm chứng MISS→HIT;
 *  - không tắt khẩn cấp qua `Q_I3_CACHE_SEO=0`. */
export function duocCacheSeo(opts: {
  method: string;
  pathname: string;
  search: string;
  coCookieNhap: boolean;
  laRsc?: boolean;
  vercelEnv?: string;
  choPreview?: boolean;
  tatCache?: boolean;
}): boolean {
  if (opts.tatCache) return false;
  if (opts.method !== "GET" && opts.method !== "HEAD") return false;
  if (opts.search && opts.search.length > 0) return false;
  if (opts.laRsc) return false;
  if (opts.coCookieNhap) return false;
  if (opts.vercelEnv === "preview" && !opts.choPreview) return false;
  return laDuongCacheSeo(opts.pathname);
}
