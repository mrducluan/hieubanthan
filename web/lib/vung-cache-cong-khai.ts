// Q-I3 — Phân vùng bảo mật & Edge CDN Cache HTML (Phương án C: 2 vùng).
// Vùng 1 (public-edge): allowlist tường minh các trang trụ, trang kiến thức, blog, lịch, từ điển, pháp lý dành cho
// khách vãng lai & bot tìm kiếm/AI → cache HTML tại Vercel Edge (s-maxage=300, SWR=3600), CSP host-allowlist (không nonce).
// Vùng 2 (private-nonce): mọi trang tài khoản, thanh toán, quản trị, lời mời cá nhân, hoặc request có cookie đăng nhập /
// chế độ nháp / tham số query → giữ nguyên 100% CSP-2 per-request nonce + Cache-Control: private, no-store.

const DUONG_CHINH_XAC = new Set([
  "/",
  "/than-so",
  "/tu-vi",
  "/bat-tu",
  "/kinh-dich",
  "/phong-thuy",
  "/nhan-tuong",
  "/tarot",
  "/hop-doi",
  "/chi-tay",
  "/ban-do-doi-ngu",
  "/huyen-hoc",
  "/kien-thuc",
  "/tu-dien",
  "/blog",
  "/nam",
  "/lich-am",
  "/xem-tuoi-lam-nha",
  "/tuoi-xong-dat",
  "/xem-sao-han",
  "/doi-lich-am-duong",
  "/chan-dung",
  "/sinh-o-nuoc-ngoai",
  "/gioi-thieu",
  "/lien-he",
  "/tac-gia",
  "/chinh-sach-rieng-tu",
  "/dieu-khoan",
  "/mien-tru-trach-nhiem",
]);

/** Tiền tố được phép cache cả cây trang con (chỉ các cụm kiến thức / tra cứu công khai, KHÔNG gồm /hop-doi/<mã-mời>
 *  hay /ban-do-doi-ngu/moi). */
const TIEN_TO_CONG_KHAI = [
  "/than-so/",
  "/tu-vi/",
  "/bat-tu/",
  "/kinh-dich/",
  "/phong-thuy/",
  "/nhan-tuong/",
  "/tarot/",
  "/hop-doi/cap-so/",
  "/blog/",
  "/nam/",
  "/lich-am/",
  "/xem-ngay-tot/",
  "/xem-tuoi-lam-nha/",
  "/tuoi-xong-dat/",
  "/xem-sao-han/",
  "/sinh-o-nuoc-ngoai/",
  "/tac-gia/",
];

const COOKIE_BO_QUA_CACHE = [
  /^sb-.*-auth-token/i, // Supabase session cookie (mọi chunk .0, .1…)
  /^__prerender_bypass$/, // Next.js draft mode
  /^__next_preview_data$/,
  /^hbt-nhap-pham-vi$/, // SEC-2 CMS preview scope
];

/** Chuẩn hoá đường dẫn (bỏ dấu / thừa cuối, giữ "/" gốc). */
function chuanDuong(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

/** Đường dẫn có nằm trong allowlist công khai được phép cache tại Edge không? */
export function laDuongCongKhaiCache(pathname: string): boolean {
  const p = chuanDuong(pathname);
  if (p === "/en" || p.startsWith("/en/")) return false;
  if (DUONG_CHINH_XAC.has(p)) return true;
  if (p === "/hop-doi/cap-so") return true;
  return TIEN_TO_CONG_KHAI.some((prefix) => p.startsWith(prefix));
}

/** Trình duyệt ưu tiên tiếng Anh và KHÔNG có tiếng Việt (RootLayout hiện dải GoiYTiengAnh khác HTML mặc định). */
function laTrinhDuyetChiTiengAnh(acceptLanguage: string | null | undefined): boolean {
  if (!acceptLanguage) return false;
  const s = acceptLanguage.toLowerCase();
  const dau = s.split(",")[0]?.trim() ?? "";
  const coViet = /(^|,)\s*vi(-[a-z]{2})?\s*(;|,|$)/.test(s);
  return dau.startsWith("en") && !coViet;
}

export interface KiemTraCacheInput {
  method: string;
  pathname: string;
  search: string;
  cookieNames: readonly string[];
  acceptLanguage?: string | null;
}

/** Quyết định phân vùng: true = Vùng 1 (Edge CDN Cache HTML + CSP công khai), false = Vùng 2 (CSP-2 nonce + no-store). */
export function coTheCacheCongKhai(input: KiemTraCacheInput): boolean {
  const m = input.method.toUpperCase();
  if (m !== "GET" && m !== "HEAD") return false;
  if (!laDuongCongKhaiCache(input.pathname)) return false;
  // Có bất kỳ query string nào (vd ?kw= cho trang đích quảng cáo, ?preview=…) → không cache Edge để tránh lệch biến thể.
  if (input.search && input.search !== "?") return false;
  if (input.cookieNames.some((ten) => COOKIE_BO_QUA_CACHE.some((re) => re.test(ten)))) return false;
  if (laTrinhDuyetChiTiengAnh(input.acceptLanguage)) return false;
  return true;
}

export const HEADER_CACHE_EDGE = "public, s-maxage=300, stale-while-revalidate=3600";
