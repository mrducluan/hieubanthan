// SEO-M — chỉ mục sitemap theo cụm kiến thức (gửi một lần trong Search Console, xem số liệu từng cụm). Khai trong robots.
import { CUM_SITEMAP, duongSitemapCum, xmlTraVe } from "@/lib/sitemap-cum";
import { urlDayDu } from "@/lib/seo";

export const revalidate = 21600;

export function GET() {
  const dong = CUM_SITEMAP.map((ma) => `<sitemap><loc>${urlDayDu(duongSitemapCum(ma))}</loc></sitemap>`);
  return xmlTraVe(`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${dong.join("\n")}\n</sitemapindex>\n`);
}
