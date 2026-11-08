// QTE-1 tuần 3–4 — khung đa ngôn ngữ tự làm (không thư viện, quyết định QTE-1): tiếng Việt giữ URL gốc (không "/vi"),
// tiếng Anh ở thư mục con "/en/…" với slug tiếng Anh. Chỉ trang ĐÃ dịch mới có bản "/en"; cặp Việt ↔ Anh khai ở CAP để gắn
// hreflang hai chiều (Google hiểu là một trang cho hai thị trường, không coi là trùng lặp). Không tự chuyển theo IP.
export type NgonNgu = "vi" | "en";
export const NGON_NGU: readonly NgonNgu[] = ["vi", "en"];
export const HREFLANG: Record<NgonNgu, string> = { vi: "vi-VN", en: "en" };
export const LOCALE_OG: Record<NgonNgu, string> = { vi: "vi_VN", en: "en_US" };

export const ngonNguCuaDuong = (duong: string): NgonNgu => (duong === "/en" || duong.startsWith("/en/") ? "en" : "vi");

// Nhật chủ: slug trang Việt (engine kb/trang `nhat-chu-{can}`) ↔ slug trang Anh (engine chuyen_ngu/battu_en).
export const NHAT_CHU_CAP: readonly [string, string][] = [
  ["giap", "jia-wood"], ["at", "yi-wood"], ["binh", "bing-fire"], ["dinh", "ding-fire"], ["mau", "wu-earth"],
  ["ky", "ji-earth"], ["canh", "geng-metal"], ["tan", "xin-metal"], ["nham", "ren-water"], ["quy", "gui-water"],
];
export const duongDayMaster = (slugEn: string) => `/en/bazi/day-master/${slugEn}`;

/** Cặp trang Việt ↔ Anh đã dịch. Thêm trang dịch mới = thêm một dòng ở đây. */
export const CAP: readonly [string, string][] = [
  ["/", "/en"],
  ["/bat-tu", "/en/bazi-calculator"],
  ["/bat-tu/nhat-chu", "/en/bazi/day-master"],
  ...NHAT_CHU_CAP.map(([vi, en]) => [`/bat-tu/nhat-chu/nhat-chu-${vi}`, duongDayMaster(en)] as [string, string]),
  ["/chinh-sach-rieng-tu", "/en/privacy"],
  ["/dieu-khoan", "/en/terms"],
];
const VI_EN = new Map(CAP);
const EN_VI = new Map(CAP.map(([vi, en]) => [en, vi]));

/** `alternates.languages` cho trang có bản dịch; trang không có cặp → undefined (không gắn hreflang lẻ). */
export function hreflang(duong: string): Record<string, string> | undefined {
  const vi = ngonNguCuaDuong(duong) === "vi" ? duong : EN_VI.get(duong);
  const en = ngonNguCuaDuong(duong) === "en" ? duong : VI_EN.get(duong);
  if (!vi || !en || (duong !== vi && duong !== en)) return undefined;
  if (!VI_EN.has(vi)) return undefined;
  return { [HREFLANG.vi]: vi, [HREFLANG.en]: en, "x-default": vi };
}
