// Mã đo lường Google — module thường (không "use client") để cả component máy chủ (noscript GTM) lẫn trình duyệt dùng.
/** Container GTM của chủ dự án (2026-10-08). Mã này công khai trong mã nguồn trang. Env ghi đè; "off" = tắt. */
const GTM_MAC_DINH = "GTM-KNZL39CS";
const env = (v: string | undefined, macDinh = "") => (v === "off" ? "" : v?.trim() || macDinh);
export const GTM_ID = env(process.env.NEXT_PUBLIC_GTM_ID, GTM_MAC_DINH);
export const GA_ID = env(process.env.NEXT_PUBLIC_GA_ID);
/** Khoá localStorage lưu lựa chọn cookie (đọc cả trong đoạn khởi động GTM). */
export const KHOA_DONG_Y = "hbt.dong-y-cookie.v1";
/** Hỏi đồng ý cookie khi mở trang? Chủ dự án chốt 2026-10-09: TẮT khi traffic còn thấp — đo lường Google bật mặc định,
 *  người dùng vẫn tắt được ở "Tuỳ chọn cookie" (chân trang). Bật lại (NEXT_PUBLIC_HOI_DONG_Y_COOKIE=1) khi web vượt
 *  ~100.000 người dùng/tháng. */
export const HOI_DONG_Y = process.env.NEXT_PUBLIC_HOI_DONG_Y_COOKIE === "1";
