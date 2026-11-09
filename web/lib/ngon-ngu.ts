// Ý7 (HTT-2 mục 8, 2026-11-09) — biến thể thị trường của bản tiếng Anh: `x-ngon-ngu` = "en-us" khi trình duyệt ưu tiên en-US
// và engine có bản phủ `kb/data/en-us/` (danh sách khoá cứng ở đây — thêm thư mục bản phủ thì thêm mã). Mọi mã khác → "en".
// Chỉ đổi VÀI mẫu câu (chính tả / cách nói); phiếu "Resonates with me" ghi đúng biến thể để khung "Lệch theo ngôn ngữ" so A/B.
export const BIEN_THE_EN: readonly string[] = ["en-us"];

/** Mã ngôn ngữ gửi engine cho trang /en theo Accept-Language ("en-US,en;q=0.9" → "en-us"; "en-GB" / "en" / thiếu → "en"). */
export function maNgonNguEn(acceptLanguage: string | null | undefined): string {
  const dau = (acceptLanguage ?? "").split(",")[0]?.trim().toLowerCase().replace(/_/g, "-") ?? "";
  return BIEN_THE_EN.includes(dau) ? dau : "en";
}

/** Giá trị `lang` của <html> theo mã ngôn ngữ ("en-us" → "en-US"). */
export function langHtml(ma: string): string {
  const [a, b] = ma.split("-");
  return b ? `${a}-${b.toUpperCase()}` : a!;
}

export const LA_MA_EN = /^en(-[a-z]{2})?$/;

/** Trình duyệt: mã ngôn ngữ của trang đang mở (đọc <html lang>) để gửi kèm lời gọi API / phiếu; không phải trang /en → "vi". */
export function maNgonNguTrang(): string {
  if (typeof document === "undefined") return "vi";
  const l = (document.documentElement.lang || "").toLowerCase();
  return LA_MA_EN.test(l) ? l : "vi";
}
