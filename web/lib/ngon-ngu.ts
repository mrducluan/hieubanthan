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

// 14 chính tinh: slug trang Việt (/tu-vi/chinh-tinh/sao-{x}) ↔ slug trang Anh (engine chuyen_ngu/tuvi_en).
export const CHINH_TINH_CAP: readonly [string, string][] = [
  ["tu-vi", "zi-wei"], ["thien-co", "tian-ji"], ["thai-duong", "tai-yang"], ["vu-khuc", "wu-qu"], ["thien-dong", "tian-tong"],
  ["liem-trinh", "lian-zhen"], ["thien-phu", "tian-fu"], ["thai-am", "tai-yin"], ["tham-lang", "tan-lang"], ["cu-mon", "ju-men"],
  ["thien-tuong", "tian-xiang"], ["thien-luong", "tian-liang"], ["that-sat", "qi-sha"], ["pha-quan", "po-jun"],
];
export const duongStar = (slugEn: string) => `/en/zi-wei/stars/${slugEn}`;

// 64 quẻ: slug trang Việt (/kinh-dich/que/{x}) ↔ slug trang Anh (engine chuyen_ngu/kinhdich_en: "{số}-{pinyin}").
export const QUE_CAP: readonly [string, string][] = [
  ["que-1-can", "1-qian"],
  ["que-2-khon", "2-kun"],
  ["que-3-truan", "3-zhun"],
  ["que-4-mong", "4-meng"],
  ["que-5-nhu", "5-xu"],
  ["que-6-tung", "6-song"],
  ["que-7-su", "7-shi"],
  ["que-8-ty", "8-bi"],
  ["que-9-tieu-suc", "9-xiao-chu"],
  ["que-10-ly", "10-lu"],
  ["que-11-thai", "11-tai"],
  ["que-12-bi", "12-pi"],
  ["que-13-dong-nhan", "13-tong-ren"],
  ["que-14-dai-huu", "14-da-you"],
  ["que-15-khiem", "15-qian"],
  ["que-16-du", "16-yu"],
  ["que-17-tuy", "17-sui"],
  ["que-18-co", "18-gu"],
  ["que-19-lam", "19-lin"],
  ["que-20-quan", "20-guan"],
  ["que-21-phe-hap", "21-shi-he"],
  ["que-22-bi", "22-bi"],
  ["que-23-bac", "23-bo"],
  ["que-24-phuc", "24-fu"],
  ["que-25-vo-vong", "25-wu-wang"],
  ["que-26-dai-suc", "26-da-chu"],
  ["que-27-di", "27-yi"],
  ["que-28-dai-qua", "28-da-guo"],
  ["que-29-kham", "29-kan"],
  ["que-30-ly", "30-li"],
  ["que-31-ham", "31-xian"],
  ["que-32-hang", "32-heng"],
  ["que-33-don", "33-dun"],
  ["que-34-dai-trang", "34-da-zhuang"],
  ["que-35-tan", "35-jin"],
  ["que-36-minh-di", "36-ming-yi"],
  ["que-37-gia-nhan", "37-jia-ren"],
  ["que-38-khue", "38-kui"],
  ["que-39-kien", "39-jian"],
  ["que-40-giai", "40-xie"],
  ["que-41-ton", "41-sun"],
  ["que-42-ich", "42-yi"],
  ["que-43-quai", "43-guai"],
  ["que-44-cau", "44-gou"],
  ["que-45-tuy", "45-cui"],
  ["que-46-thang", "46-sheng"],
  ["que-47-khon", "47-kun"],
  ["que-48-tinh", "48-jing"],
  ["que-49-cach", "49-ge"],
  ["que-50-dinh", "50-ding"],
  ["que-51-chan", "51-zhen"],
  ["que-52-can", "52-gen"],
  ["que-53-tiem", "53-jian"],
  ["que-54-quy-muoi", "54-gui-mei"],
  ["que-55-phong", "55-feng"],
  ["que-56-lu", "56-lu"],
  ["que-57-ton", "57-xun"],
  ["que-58-doai", "58-dui"],
  ["que-59-hoan", "59-huan"],
  ["que-60-tiet", "60-jie"],
  ["que-61-trung-phu", "61-zhong-fu"],
  ["que-62-tieu-qua", "62-xiao-guo"],
  ["que-63-ky-te", "63-ji-ji"],
  ["que-64-vi-te", "64-wei-ji"],
];
export const duongHexagram = (slugEn: string) => `/en/i-ching/hexagrams/${slugEn}`;

/** Cặp trang Việt ↔ Anh đã dịch. Thêm trang dịch mới = thêm một dòng ở đây. */
export const CAP: readonly [string, string][] = [
  ["/", "/en"],
  ["/bat-tu", "/en/bazi-calculator"],
  ["/bat-tu/nhat-chu", "/en/bazi/day-master"],
  ...NHAT_CHU_CAP.map(([vi, en]) => [`/bat-tu/nhat-chu/nhat-chu-${vi}`, duongDayMaster(en)] as [string, string]),
  ["/tu-vi", "/en/zi-wei-dou-shu-chart"],
  ["/tu-vi/chinh-tinh", "/en/zi-wei/stars"],
  ...CHINH_TINH_CAP.map(([vi, en]) => [`/tu-vi/chinh-tinh/sao-${vi}`, duongStar(en)] as [string, string]),
  ["/phong-thuy/huong-hop-tuoi", "/en/feng-shui/kua-number"],
  ["/kinh-dich", "/en/i-ching"],
  ["/kinh-dich/que", "/en/i-ching/hexagrams"],
  ...QUE_CAP.map(([vi, en]) => [`/kinh-dich/que/${vi}`, duongHexagram(en)] as [string, string]),
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
