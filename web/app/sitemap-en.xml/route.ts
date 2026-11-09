// QTE — sitemap riêng cho bản tiếng Anh (/en/*): trang công cụ, 12 trang Life Path, 78 trang lá bài, pháp lý. Tách khỏi
// sitemap.xml để luật "mọi URL sitemap.xml thuộc sổ trang CMS" (ND-7) không đụng; khai trong robots.
import { engineEn, slugLa } from "@/lib/en/engine";
import { urlDayDu } from "@/lib/seo";

export const revalidate = 21600;

const TINH = ["/en", "/en/numerology", "/en/numerology/life-path", "/en/tarot", "/en/tarot/cards", "/en/privacy", "/en/terms"];
const SO = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

export async function GET() {
  const bo = await engineEn<{ la: Record<string, { en: string }> }>("/v1/tarot/bo-bai");
  const la = bo.ok ? Object.values(bo.data.la).map((x) => `/en/tarot/cards/${slugLa(x.en)}`) : [];
  const urls = [...TINH, ...SO.map((n) => `/en/numerology/life-path/${n}`), ...la];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.map((u) =>
    `<url><loc>${urlDayDu(u)}</loc><xhtml:link rel="alternate" hreflang="en" href="${urlDayDu(u)}"/></url>`).join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600, s-maxage=21600" } });
}
