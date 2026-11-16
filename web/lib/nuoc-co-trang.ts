// Mã nước có trang "/sinh-o-nuoc-ngoai/{mã}" (khớp engine `MA_NUOC`) — tách riêng để form hồ sơ (client) dùng được mà
// không kéo `next/cache` của lib/sinh-nuoc-ngoai.ts.
export const MA_NUOC_SEO = ["us", "au", "ca", "de", "jp", "kr", "tw", "fr", "cz", "gb", "pl", "ru", "th", "la", "kh"] as const;
export const coTrangNuoc = (ma: string | null | undefined): boolean => Boolean(ma) && (MA_NUOC_SEO as readonly string[]).includes(ma!);
