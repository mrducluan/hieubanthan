// SAO-V — ba mảng có "Luận giải toàn bộ" thu Sao (Tử vi · Bát tự · Bản đồ con số). Thuần, không I/O — dùng chung
// máy chủ (công tắc thu Sao từng mảng, quà "Tặng một chương") và trình duyệt (gửi ?mo_dun=, trang /qua).
export const MANG_LUAN_GIAI = ["tuvi", "battu", "thanso"] as const;
export type MangLuanGiai = (typeof MANG_LUAN_GIAI)[number];

/** Mã mô-đun / mã trang khác cùng chỉ một mảng (đo lường Gate, khối gợi chéo CTA-1). */
const BIET_DANH: Record<string, MangLuanGiai> = {
  thanso_sau: "thanso", than_so: "thanso", ban_do_con_so: "thanso", tu_vi: "tuvi", bat_tu: "battu",
};

/** Mã bất kỳ → mảng luận giải; không thuộc ba mảng → null. */
export function mangLuanGiai(x: string | null | undefined): MangLuanGiai | null {
  if (!x) return null;
  if ((MANG_LUAN_GIAI as readonly string[]).includes(x)) return x as MangLuanGiai;
  return BIET_DANH[x] ?? null;
}

/** Tên báo cáo + trang công cụ (nơi báo cáo hiện ra) của từng mảng. */
export const TEN_BAO_CAO: Record<MangLuanGiai, string> = {
  tuvi: "Luận giải Tử vi", battu: "Luận giải Bát tự", thanso: "Bản đồ con số",
};
export const DUONG_BAO_CAO: Record<MangLuanGiai, string> = {
  tuvi: "/tu-vi", battu: "/bat-tu", thanso: "/than-so#ban-do-con-so",
};

/** Mã quà "Tặng một chương" (migration 0025: 10 ký tự a-z0-9). */
export const MA_QUA = /^[a-z0-9]{10}$/;
