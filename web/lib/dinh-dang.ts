// EN-ALL mục 3.1 — định dạng ngày, giờ, số, tiền, danh sách, số thứ tự, số nhiều theo ngôn ngữ bằng `Intl.*` có sẵn (không
// thư viện). Bản Anh KHÔNG ghép "ngày/tháng/năm" thủ công: mọi ngày hiển thị đi qua đây. Thuần hàm (máy chủ + trình duyệt).
// `ma` = mã ngôn ngữ trang ("vi", "en", "en-us"): "en" = Anh–Anh (10 November 2026, 24 giờ), "en-us" = Mỹ (November 10, 2026, 12 giờ).
const LOCALE: Record<string, string> = { vi: "vi-VN", en: "en-GB", "en-us": "en-US" };
export const localeCua = (ma: string) => LOCALE[ma.toLowerCase()] ?? (ma.toLowerCase().startsWith("en") ? "en-GB" : "vi-VN");

/** Ngày lịch (không múi giờ) từ "yyyy-mm-dd" | Date | {nam, thang, ngay} — dựng ở UTC để không lệch ngày theo máy. */
type NgayVao = string | Date | { nam: number; thang: number; ngay: number };
function utc(n: NgayVao): Date {
  if (n instanceof Date) return new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()));
  if (typeof n === "string") { const [y, m, d] = n.slice(0, 10).split("-").map(Number); return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1)); }
  return new Date(Date.UTC(n.nam, n.thang - 1, n.ngay));
}

export type KieuNgay = "day_du" | "dai" | "ngan" | "so" | "thang_nam" | "ngay_thang" | "ngay_thang_ngan";
const KIEU: Record<KieuNgay, Intl.DateTimeFormatOptions> = {
  day_du: { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  dai: { day: "numeric", month: "long", year: "numeric" },
  ngan: { day: "numeric", month: "short", year: "numeric" },
  so: { day: "2-digit", month: "2-digit", year: "numeric" },
  thang_nam: { month: "long", year: "numeric" },
  ngay_thang: { day: "numeric", month: "long" },
  ngay_thang_ngan: { day: "numeric", month: "short" },
};

/** "2026-11-10" → vi "10 tháng 11, 2026" · en "10 November 2026" · en-us "November 10, 2026". */
export function dinhNgay(n: NgayVao, ma: string, kieu: KieuNgay = "dai"): string {
  return new Intl.DateTimeFormat(localeCua(ma), { ...KIEU[kieu], timeZone: "UTC" }).format(utc(n));
}

/** Khoảng ngày: "4 Feb – 5 Mar 2027" (Intl tự gộp phần chung). */
export function dinhKhoangNgay(tu: NgayVao, den: NgayVao, ma: string, kieu: KieuNgay = "ngan"): string {
  return new Intl.DateTimeFormat(localeCua(ma), { ...KIEU[kieu], timeZone: "UTC" }).formatRange(utc(tu), utc(den));
}

/** Giờ "HH:MM" (24 giờ, như engine nhận) → hiển thị: vi / en "14:05", en-us "2:05 PM". */
export function dinhGio(hhmm: string, ma: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const d = new Date(Date.UTC(2000, 0, 1, h, m));
  return new Intl.DateTimeFormat(localeCua(ma), { hour: "numeric", minute: "2-digit", hour12: localeCua(ma) === "en-US", timeZone: "UTC" }).format(d);
}

export const dinhSo = (x: number, ma: string, o?: Intl.NumberFormatOptions) => new Intl.NumberFormat(localeCua(ma), o).format(x);
export const dinhPhanTram = (tyLe: number, ma: string) => new Intl.NumberFormat(localeCua(ma), { style: "percent", maximumFractionDigits: 0 }).format(tyLe);
export const dinhTien = (x: number, ma: string, tien: "VND" | "USD" = "VND") =>
  new Intl.NumberFormat(localeCua(ma), { style: "currency", currency: tien, maximumFractionDigits: tien === "VND" ? 0 : 2 }).format(x);

/** ["A","B","C"] → vi "A, B và C" · en "A, B and C". */
export const dinhDanhSach = (ds: string[], ma: string, kieu: "va" | "hoac" = "va") =>
  new Intl.ListFormat(localeCua(ma), { style: "long", type: kieu === "va" ? "conjunction" : "disjunction" }).format(ds);

/** Số thứ tự: en 1 → "1st", 2 → "2nd", 11 → "11th", 23 → "23rd"; vi → "thứ 1". */
export function soThuTu(n: number, ma: string): string {
  if (!ma.toLowerCase().startsWith("en")) return `thứ ${n}`;
  const duoi = { one: "st", two: "nd", few: "rd", other: "th" } as Record<string, string>;
  return `${n}${duoi[new Intl.PluralRules("en", { type: "ordinal" }).select(n)] ?? "th"}`;
}

/** Số nhiều: `soNhieu(3, "en", { one: "{n} card", other: "{n} cards" })` → "3 cards"; tiếng Việt dùng `other`. */
export function soNhieu(n: number, ma: string, mau: { one?: string; other: string }): string {
  const loai = ma.toLowerCase().startsWith("en") ? new Intl.PluralRules("en").select(n) : "other";
  return (loai === "one" && mau.one ? mau.one : mau.other).replace(/\{n\}/g, dinhSo(n, ma));
}
