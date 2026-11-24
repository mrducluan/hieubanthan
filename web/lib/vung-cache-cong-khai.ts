// Q-I3 — Phân vùng bảo mật & Edge CDN Cache HTML (Phương án C: 2 vùng).
// Vùng 1 (public-edge): allowlist tường minh trang trụ, kiến thức, blog, lịch, từ điển, pháp lý → cache HTML ở CDN Vercel
// (tối đa 5 phút + phục vụ bản cũ trong lúc làm mới ≤ 1 giờ, KHÔNG BAO GIỜ vượt qua nửa đêm giờ Việt Nam — trang lịch, "hôm
// nay" đổi theo ngày). CSP vẫn là CSP-2 có nonce, nonce ổn định theo (bản deploy, đường dẫn) — xem `nonceOnDinh`.
// Vùng 2 (private-nonce): tài khoản, thanh toán, quản trị, lời mời, /en → nonce ngẫu nhiên mỗi lượt, không cache.
// Trang công khai có query (?kw=, ?fbclid=…) hoặc cookie đăng nhập / xem nháp → không ghi vào cache (public-bypass).

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
  /^hbt-xem-truoc$/, // SEC-2: cookie phạm vi xem trước CMS (COOKIE_PHAM_VI)
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

const S_MAXAGE = 300;
const SWR = 3600;

/** Giây còn lại tới 00:00 giờ Việt Nam (UTC+7, không giờ mùa hè). */
function giayToiNuaDemVn(nowMs: number): number {
  const ngay = 86_400_000, lech = 7 * 3_600_000;
  return Math.floor((ngay - ((nowMs + lech) % ngay)) / 1000);
}

/** Cache-Control cho CDN: bản cache (kể cả bản cũ phục vụ trong lúc làm mới) hết hạn trước nửa đêm giờ Việt Nam.
 *  Còn dưới 60 giây tới nửa đêm → null (không cache lượt này). */
export function headerCacheEdge(nowMs = Date.now()): string | null {
  const con = giayToiNuaDemVn(nowMs);
  if (con < 60) return null;
  const sMaxage = Math.min(S_MAXAGE, con);
  const swr = Math.min(SWR, con - sMaxage);
  return `public, s-maxage=${sMaxage}${swr > 0 ? `, stale-while-revalidate=${swr}` : ""}`;
}
