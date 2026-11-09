// QTE — metadata cho trang /en: canonical + hreflang (en ↔ vi, bản Việt là x-default), Open Graph tiếng Anh, ảnh /og chung.
import type { Metadata } from "next";
import { siteUrl } from "@/lib/seo";

export const TEN_SITE_EN = "Hieu Ban Than";

export function metaEn({ title, description, path, vi, noindex = false }: { title: string; description: string; path: string; vi?: string; noindex?: boolean }): Metadata {
  return {
    metadataBase: new URL(siteUrl()),
    // `absolute`: không nhận mẫu "%s · Hiểu Bản Thân" của layout gốc (bản Anh không mang chữ Việt trong <title>).
    title: { absolute: title }, description, applicationName: TEN_SITE_EN,
    alternates: { canonical: path, languages: vi ? { en: path, vi, "x-default": vi } : { en: path } },
    openGraph: { type: "website", locale: "en_US", siteName: TEN_SITE_EN, url: path, title, description, images: ["/og"] },
    twitter: { card: "summary_large_image", title, description, images: ["/og"] },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true },
  };
}
