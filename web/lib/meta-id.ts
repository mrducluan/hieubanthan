// Meta Pixel ID dùng chung trình duyệt (components/khung/MetaPixel.tsx) + máy chủ (lib/meta-capi.ts).
// Mã công khai (nằm trong HTML mọi trang dùng Pixel); env NEXT_PUBLIC_META_PIXEL_ID ghi đè, đặt "off" để tắt.
const MAC_DINH = "2153819128819535";
export const META_PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? MAC_DINH).trim();
export const META_BAT = /^\d{8,20}$/.test(META_PIXEL_ID);
