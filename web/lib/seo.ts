// Hằng + dựng JSON-LD dùng chung (schema.org). Chỉ định dạng dữ liệu — không tính gì.
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
  return {
    "@type": "Organization",
    "@id": `${siteUrl()}/#to-chuc`,
    name: TEN_SITE,
    url: siteUrl(),
    logo: urlDayDu("/icon.svg"),
    description: MO_TA_SITE,
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
