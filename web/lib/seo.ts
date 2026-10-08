// Hằng + dựng JSON-LD dùng chung (schema.org). Chỉ định dạng dữ liệu — không tính gì.
import { vanHanh } from "@/lib/van-hanh";

export const TEN_SITE = "Hiểu Bản Thân";
export const MO_TA_SITE =
  "Khám phá bản thân qua thần số học và huyền học phương Đông (Tử vi, Bát tự, Kinh Dịch, Phong thuỷ) — tính toán minh bạch, diễn giải có nguồn, câu hỏi để tự soi. Tham khảo văn hoá, không phải dự báo.";

// Bản chạy thật mặc định hieuban.com (kể cả khi quên đặt NEXT_PUBLIC_SITE_URL) để canonical/sitemap/OG
// không bao giờ trỏ về localhost; dev/E2E (next dev) vẫn là localhost.
export const SITE_CHINH = "https://hieuban.com";

export function siteUrl(): string {
  const mac = process.env.NODE_ENV === "production" ? SITE_CHINH : "http://localhost:3000";
  return (process.env.NEXT_PUBLIC_SITE_URL || mac).replace(/\/$/, "");
}

export function urlDayDu(duong: string): string {
  return `${siteUrl()}${duong.startsWith("/") ? duong : `/${duong}`}`;
}

export function ldToChuc() {
  const vh = vanHanh();
  return {
    "@type": "Organization",
    "@id": `${siteUrl()}/#to-chuc`,
    name: TEN_SITE,
    ...(vh.chuSoHuu ? { legalName: vh.chuSoHuu } : {}),
    url: siteUrl(),
    logo: { "@type": "ImageObject", url: urlDayDu("/icon.svg") },
    description: MO_TA_SITE,
    ...(vh.email ? {
      email: vh.email,
      contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: vh.email, availableLanguage: ["vi"] },
    } : {}),
    ...(vh.diaChi ? { address: vh.diaChi } : {}),
    ...(vh.mangXaHoi.length ? { sameAs: vh.mangXaHoi.map((m) => m.url) } : {}),
    knowsAbout: ["Thần số học Pythagoras", "Tử vi Đẩu Số", "Bát tự Tứ trụ", "Kinh Dịch", "Phong thuỷ Bát trạch", "Huyền Không phi tinh"],
    areaServed: "VN",
  };
}

export function ldWebsite() {
  return {
    "@type": "WebSite",
    "@id": `${siteUrl()}/#website`,
    name: TEN_SITE,
    url: siteUrl(),
    inLanguage: "vi-VN",
    description: MO_TA_SITE,
    publisher: { "@id": `${siteUrl()}/#to-chuc` },
  };
}

export function ldUngDung() {
  return {
    "@type": "WebApplication",
    "@id": `${siteUrl()}/#ung-dung`,
    name: TEN_SITE,
    url: siteUrl(),
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    inLanguage: "vi-VN",
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: "0", priceCurrency: "VND" },
    featureList: [
      "Thần số học: đường đời, sứ mệnh, linh hồn, nhân cách, năm cá nhân, biểu đồ ngày sinh",
      "Tử vi: lá số 12 cung, đại hạn, lưu niên, tiểu hạn",
      "Bát tự: tứ trụ, ngũ hành, dụng thần, đại vận",
      "Kinh Dịch: gieo quẻ, 64 quẻ",
      "Phong thuỷ: mệnh quái, tám hướng",
      "Hợp đôi theo thần số (không chấm điểm hợp khắc)",
    ],
    publisher: { "@id": `${siteUrl()}/#to-chuc` },
  };
}

export function ldDuongDan(cap: { ten: string; duong: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: cap.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.ten, item: urlDayDu(c.duong) })),
  };
}

export function ldHoiDap(hd: { hoi: string; dap: string }[]) {
  return {
    "@type": "FAQPage",
    mainEntity: hd.map((h) => ({ "@type": "Question", name: h.hoi, acceptedAnswer: { "@type": "Answer", text: h.dap } })),
  };
}

export function goiLd(...nut: object[]) {
  return { "@context": "https://schema.org", "@graph": nut };
}

/** Google cắt tiêu đề ~60 ký tự: tiêu đề dài thì bỏ hậu tố " · Hiểu Bản Thân" (dùng title.absolute). */
export function tieuDeSeo(t: string): string | { absolute: string } {
  return t.length > 52 ? { absolute: t } : t;
}

/** Mô tả meta ≤ 160 ký tự, cắt ở ranh giới từ. */
export function catMoTa(s: string, toiDa = 160): string {
  if (s.length <= toiDa) return s;
  const cat = s.slice(0, toiDa - 1);
  return `${cat.slice(0, cat.lastIndexOf(" ")).replace(/[,;:—–-]\s*$/, "")}…`;
}

/** Metadata chuẩn cho trang tĩnh: title, description, canonical, Open Graph + Twitter có ảnh. */
export function metaTrang({ tieuDe, moTa, duong, md }: { tieuDe: string; moTa: string; duong: string; md?: string }) {
  const d = catMoTa(moTa);
  const anh = `/og?tieu_de=${encodeURIComponent(tieuDe)}`;
  return {
    title: tieuDeSeo(tieuDe),
    description: d,
    alternates: { canonical: duong, ...(md ? { types: { "text/markdown": md } } : {}) },
    openGraph: { type: "website" as const, title: tieuDe, description: d, url: duong, locale: "vi_VN", siteName: TEN_SITE, images: [anh] },
    twitter: { card: "summary_large_image" as const, title: tieuDe, description: d, images: [anh] },
  };
}
