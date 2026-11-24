// Tách khỏi lib/do-luong.ts (dùng chung cho PostHog và Meta Pixel, tránh import vòng).
/** SEC-2: mã thẻ / lời mời (base64url JSON mang TÊN hiển thị) nằm trong URL (/the/…/<mã>, /hop-doi/<mã>, ?the=, ?ma=)
 *  → PostHog tự gắn $current_url / $pathname vào mọi sự kiện. Thay mã bằng ":ma" trước khi gửi; đo lường chỉ mang mã. */
export const MA_TRONG_URL = /^[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}$/;
export const MA_QUA_URL = /^[a-z0-9]{10}$/;
/** LX-2027: mã bao lì xì /li-xi/<16 hex> — khoá dùng một lần, chưa nhận thì ai có link là nhận được. */
export const MA_LI_XI_URL = /^[a-z0-9]{12,16}$/;
export function lamSachUrl(u: string): string {
  if (!/^(https?:\/\/|\/)/.test(u)) return u;   // "$direct", "" … giữ nguyên
  try {
    const x = new URL(u, "https://hieuban.com");
    // SAO-V: mã quà /qua/<10 ký tự> cũng là khoá dùng một lần — không để lọt lên PostHog.
    x.pathname = x.pathname.split("/").map((d, i, ds) => (MA_TRONG_URL.test(d) || (ds[i - 1] === "qua" && MA_QUA_URL.test(d))
      || (ds[i - 1] === "li-xi" && MA_LI_XI_URL.test(d)) ? ":ma" : d)).join("/");
    for (const k of ["the", "ma"]) if (x.searchParams.has(k)) x.searchParams.set(k, ":ma");
    // Trang đăng nhập mang đường quay về (?tiep=/li-xi/<mã>, /qua/<mã>…) → lọc cả đường đó.
    const tiep = x.searchParams.get("tiep");
    if (tiep && tiep.startsWith("/")) x.searchParams.set("tiep", lamSachUrl(tiep));
    x.hash = "";
    return /^https?:/.test(u) ? x.toString() : x.pathname + x.search;
  } catch {
    return "";
  }
}

/** URL đang mang mã thẻ / lời mời / quà → không gửi cho dịch vụ đo lường không lọc được URL (Meta Pixel). */
export function coMaTrongUrl(u: string): boolean {
  try {
    const x = new URL(u, "https://hieuban.com");
    x.hash = "";
    const sach = lamSachUrl(x.toString());
    return sach !== x.toString();
  } catch {
    return true;
  }
}
