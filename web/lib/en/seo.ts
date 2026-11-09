// QTE — metadata cho trang /en: canonical + hreflang (en ↔ vi, bản Việt là x-default), Open Graph tiếng Anh, ảnh /og chung.
import type { Metadata } from "next";
import { siteUrl, urlDayDu } from "@/lib/seo";

export const TEN_SITE_EN = "Hieu Ban Than";

/** Ảnh chia sẻ tiếng Anh: cùng khung "trang sách" của /og nhưng chữ tiếng Anh (`lang=en`), QR + hieuban.com như mọi ảnh. */
export function anhOgEn(tieuDe: string): string {
  const q = new URLSearchParams({ lang: "en", tieu_de: tieuDe.slice(0, 110) });
  return `/og?${q.toString()}`;
}

/** Tiêu đề ≤ 70 ký tự: chọn ứng viên đầu tiên vừa (cùng luật bộ rà SEO); không ứng viên nào vừa → cắt ứng viên cuối. */
export function tieuDeVua(ung: string[], toiDa = 70): string {
  return ung.find((t) => t.length <= toiDa) ?? ung[ung.length - 1]!.slice(0, toiDa - 1).replace(/\s+\S*$/, "") + "…";
}

/** Mô tả ≤ 160 ký tự, cắt ở ranh giới từ (bộ rà SEO cảnh báo > 170). */
export function catMoTaEn(s: string, toiDa = 160): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= toiDa) return t;
  const i = t.lastIndexOf(" ", toiDa - 1);
  return `${t.slice(0, i > 60 ? i : toiDa - 1).replace(/[,;:—-]$/, "")}…`;
}

export function metaEn({ title, description, path, vi, noindex = false, ngayDang, capNhat, anh }: {
  title: string; description: string; path: string; vi?: string; noindex?: boolean; ngayDang?: string; capNhat?: string; anh?: string;
}): Metadata {
  const image = anh ?? anhOgEn(title.replace(/ — Hieu Ban Than.*$/, ""));
  description = catMoTaEn(description);
  return {
    metadataBase: new URL(siteUrl()),
    // `absolute`: không nhận mẫu "%s · Hiểu Bản Thân" của layout gốc (bản Anh không mang chữ Việt trong <title>).
    title: { absolute: title }, description, applicationName: TEN_SITE_EN,
    alternates: { canonical: path, languages: vi ? { en: path, vi, "x-default": vi } : { en: path } },
    openGraph: {
      type: ngayDang || capNhat ? "article" : "website", locale: "en_US", siteName: TEN_SITE_EN, url: path, title, description,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
      ...(ngayDang ? { publishedTime: ngayDang } : {}), ...(capNhat ? { modifiedTime: capNhat } : {}),
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    robots: noindex ? { index: false, follow: true } : { index: true, follow: true, googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" } },
  };
}

/** BreadcrumbList cho trang /en (cùng khuôn `ldDuongDan` của bản Việt; cấp đầu luôn là trang vào tiếng Anh). */
export function ldDuongDanEn(cap: { ten: string; duong: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ ten: "Hieu Ban Than (English)", duong: "/en" }, ...cap].map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.ten, item: urlDayDu(c.duong) })),
  };
}

/** Article JSON-LD cho trang kiến thức tiếng Anh: đủ E-E-A-T (tác giả tổ chức, nhà xuất bản, ảnh có kích thước, ngày thật). */
export function ldBaiEn(o: { tieuDe: string; duong: string; moTa: string; ngayDang?: string; capNhat?: string; about?: string[] }) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: o.tieuDe, description: o.moTa, inLanguage: "en", url: urlDayDu(o.duong), mainEntityOfPage: urlDayDu(o.duong),
    author: { "@type": "Organization", name: "Hieu Ban Than editorial team", url: urlDayDu("/en") },
    publisher: { "@id": `${siteUrl()}/#to-chuc` },
    image: { "@type": "ImageObject", url: urlDayDu(anhOgEn(o.tieuDe)), width: 1200, height: 630 },
    ...(o.ngayDang ? { datePublished: o.ngayDang } : {}), ...(o.capNhat ? { dateModified: o.capNhat } : {}),
    ...(o.about?.length ? { about: o.about.map((x) => ({ "@type": "Thing", name: x })) } : {}),
  };
}
