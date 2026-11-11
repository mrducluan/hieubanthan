// EN-ALL (docs/PROMPT-EN-TOAN-BO.md mục 3.1) — đổi đường dẫn Việt ↔ Anh theo MỘT bảng (`duong-en.json`). Thuần hàm, dùng
// được ở proxy, máy chủ, trình duyệt và test. MỌI chỗ dựng link nội bộ ở component chạy cả hai ngôn ngữ đi qua `duongTheo`
// (hoặc `useDuong()` / `<Lien>` đã bọc) — không viết cứng "/tu-vi" (e2e quét link rơi khỏi /en).
//
// Bảng là danh sách TIỀN TỐ: "/bat-tu/thap-than" ↔ "/en/bazi/ten-gods"; phần đuôi (năm, slug) đi nguyên. Slug tiếng Anh
// của từng trang kiến thức do engine sinh (`slug_en`) → trang truyền qua `duoi` khi dựng link; chiều ngược lại trang Việt
// nhận slug Anh từ URL và hỏi engine (giai đoạn 2).
import bang from "./duong-en.json";

export type NgonNgu = "vi" | "en";
export interface CapDuong { vi: string; en: string; mo: boolean; rieng?: boolean; la?: boolean }

export const CAP_DUONG: readonly CapDuong[] = bang.trang as CapDuong[];
/** Tiền tố Việt cố ý KHÔNG có bản Anh (mục 6.1 của prompt + trang nội bộ). */
export const KHONG_CO_BAN_ANH: readonly string[] = bang.khong;
/** Slug Anh đã đổi: { tu, den } → 308 một bước. */
export const DOI_SLUG_EN: readonly { tu: string; den: string }[] = bang.doi as { tu: string; den: string }[];

const DAI_TRUOC = (a: string, b: string) => b.length - a.length;
const THEO_VI = [...CAP_DUONG].sort((a, b) => DAI_TRUOC(a.vi, b.vi));
const THEO_EN = [...CAP_DUONG].sort((a, b) => DAI_TRUOC(a.en, b.en));

/** Tách "/a/b?x=1#y" → ["/a/b", "?x=1#y"]; bỏ gạch chéo cuối (trừ "/"). */
export function tachDuong(d: string): [string, string] {
  const i = d.search(/[?#]/);
  const p = (i < 0 ? d : d.slice(0, i)).replace(/\/+$/, "") || "/";
  return [p, i < 0 ? "" : d.slice(i)];
}

function khop(p: string, tienTo: string, la?: boolean): string | null {
  if (p === tienTo) return "";
  if (la) return null;
  if (tienTo === "/") return null;                     // "/" chỉ khớp chính nó (không làm tiền tố của mọi trang)
  return p.startsWith(tienTo + "/") ? p.slice(tienTo.length) : null;
}

/** Mục của bảng khớp một đường dẫn VIỆT (tiền tố dài nhất) + phần đuôi. */
export function capCuaVi(duongVi: string, ds?: readonly CapDuong[]): { cap: CapDuong; duoi: string } | null {
  const [p] = tachDuong(duongVi);
  for (const c of ds ? [...ds].sort((a, b) => DAI_TRUOC(a.vi, b.vi)) : THEO_VI) {
    const d = khop(p, c.vi, c.la);
    if (d !== null) return { cap: c, duoi: d };
  }
  return null;
}

/** Mục của bảng khớp một đường dẫn ANH ("/en/…") + phần đuôi. */
export function capCuaEn(duongEn: string, ds?: readonly CapDuong[]): { cap: CapDuong; duoi: string } | null {
  const [p] = tachDuong(duongEn);
  for (const c of ds ? [...ds].sort((a, b) => DAI_TRUOC(a.en, b.en)) : THEO_EN) {
    const d = khop(p, c.en, c.la);
    if (d !== null) return { cap: c, duoi: d };
  }
  return null;
}

export const laDuongEn = (d: string) => d === "/en" || d.startsWith("/en/") || d.startsWith("/en?") || d.startsWith("/en#");

/** Bản Anh của một đường dẫn Việt — CHỈ khi trang đã mở (`mo`); chưa mở / không có → null. `duoi` thay phần đuôi
 *  (slug tiếng Anh engine trả, vd "/the-fool"). Query và #neo giữ nguyên. */
export function banAnh(duongVi: string, duoi?: string, ds?: readonly CapDuong[]): string | null {
  const [, sau] = tachDuong(duongVi);
  const k = capCuaVi(duongVi, ds);
  if (!k || !k.cap.mo) return null;
  return k.cap.en + (duoi ?? k.duoi) + sau;
}

/** Bản Việt của một đường dẫn Anh (mọi mục trong bảng, kể cả chưa mở — để nút đổi ngôn ngữ luôn có đích). Không khớp → null. */
export function banViet(duongEn: string, duoi?: string, ds?: readonly CapDuong[]): string | null {
  const [, sau] = tachDuong(duongEn);
  const k = capCuaEn(duongEn, ds);
  if (!k) return null;
  return (k.cap.vi === "/" ? "" : k.cap.vi) + (duoi ?? k.duoi) + sau || "/";
}

/** Link nội bộ theo ngôn ngữ: tiếng Việt → nguyên đường dẫn; tiếng Anh → bản Anh nếu ĐÃ MỞ, chưa mở thì giữ đường dẫn
 *  Việt (link sang bản Việt là đúng chủ đích: "Available in the Vietnamese edition"). Đường dẫn ngoài site, mailto:, #neo
 *  giữ nguyên. Đã là "/en/…" thì giữ. */
export function duongTheo(ngonNgu: NgonNgu, duongVi: string, duoi?: string): string {
  if (ngonNgu !== "en" || !duongVi.startsWith("/") || duongVi.startsWith("//") || laDuongEn(duongVi)) return duongVi;
  return banAnh(duongVi, duoi) ?? duongVi;
}

/** Đường dẫn Việt mà proxy rewrite tới khi người dùng mở một URL Anh đã mở và KHÔNG có trang riêng dưới app/en. */
export function dichRewrite(duongEn: string, ds?: readonly CapDuong[]): string | null {
  const k = capCuaEn(duongEn, ds);
  if (!k || !k.cap.mo || k.cap.rieng) return null;
  return (k.cap.vi === "/" ? "" : k.cap.vi) + k.duoi || "/";
}

/** "/en/<slug-việt>" gõ lạc (vd "/en/tu-vi") → URL Anh đúng nếu trang đã mở; không thì null (để trang 404 tiếng Anh xử lý). */
export function suaDuongLac(duongEn: string, ds?: readonly CapDuong[]): string | null {
  const [p, sau] = tachDuong(duongEn);
  if (!p.startsWith("/en/")) return null;
  for (const d of DOI_SLUG_EN) if (p === d.tu || p.startsWith(d.tu + "/")) return d.den + p.slice(d.tu.length) + sau;
  if (capCuaEn(p, ds)) return null;                     // đã là slug Anh hợp lệ
  const en = banAnh(p.slice(3), undefined, ds);
  return en && en !== p ? en + sau : null;
}

/** Cặp hreflang của một trang (đường dẫn KHÔNG query): chỉ khi bản Anh đã mở. */
export function capHreflang(duongVi: string, duoiEn?: string): { vi: string; en: string } | null {
  const [p] = tachDuong(duongVi);
  const en = banAnh(p, duoiEn);
  return en ? { vi: p, en } : null;
}

/** Trang Việt này cố ý không có bản Anh? (ẩn nút đổi ngôn ngữ / hiện "Available in the Vietnamese edition"). */
export const khongCoBanAnh = (duongVi: string) => KHONG_CO_BAN_ANH.some((t) => duongVi === t || duongVi.startsWith(t + "/"));

/** Bản Việt của trang Anh đang mở cho NÚT ĐỔI NGÔN NGỮ khi trang không tự khai hreflang: bảng + mẫu trang riêng cũ
 *  ("/en/numerology/life-path/7" → "/than-so/y-nghia-so/so-7"); không suy được → trang chủ Việt. */
export function banVietCuaTrang(duongEn: string): string {
  const [p, sau] = tachDuong(duongEn);
  const m = p.match(/^\/en\/numerology\/life-path\/(\d{1,2})$/);
  if (m) return `/than-so/y-nghia-so/so-${m[1]}`;
  if (p.startsWith("/en/tarot/cards/")) return "/tarot/la-bai";
  return banViet(p + sau) ?? "/";
}

/** Đường dẫn Việt "tương đương" của trang đang mở, CHỈ để so khớp (mục menu nào sáng, thanh mảng nào hiện): trang Việt →
 *  nguyên; trang Anh → bản Việt theo bảng, kể cả trang con của mục `la` ("/en/tarot/cards/the-fool" → "/tarot/la-bai/the-fool"
 *  — đuôi là slug Anh, chỉ cần tiền tố đúng). Không suy được → "/". */
export function duongViDeSo(duong: string): string {
  const [p] = tachDuong(duong);
  if (!laDuongEn(p)) return p;
  const m = p.match(/^\/en\/numerology\/life-path\/(\d{1,2})$/);
  if (m) return `/than-so/y-nghia-so/so-${m[1]}`;
  const vi = banViet(p);
  if (vi) return tachDuong(vi)[0];
  // Trang con của mục `la` (bảng chỉ khớp đúng đường dẫn): tìm mục dài nhất là tiền tố rồi nối đuôi.
  const cap = [...CAP_DUONG].sort((a, b) => DAI_TRUOC(a.en, b.en)).find((c) => c.en !== "/en" && p.startsWith(c.en + "/"));
  return cap ? cap.vi + p.slice(cap.en.length) : "/";
}

/** Đường dẫn ANH tương đương của trang đang mở — để so khớp menu bản Anh (mục menu đã là URL Anh). */
export function duongEnDeSo(duong: string): string {
  const [p] = tachDuong(duong);
  return laDuongEn(p) ? p : banAnh(p) ?? p;
}
