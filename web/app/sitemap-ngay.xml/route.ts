// SEO-K (chủ dự án duyệt 2026-10-21) — sitemap riêng cho trang ngày /xem-ngay-tot/{yyyy-mm-dd}: đúng cửa sổ index
// (7 ngày trước → 400 ngày tới, ngayDangIndex) để Google biết sớm trang ngày sắp tới thay vì chỉ tìm qua lịch tháng.
// Khai trong robots.txt cạnh /sitemap.xml. Chỉ dựng danh sách URL — không gọi engine.
import { congNgay, duongNgay, homNayVN, ngayDangIndex } from "@/lib/hoang-lich";
import { urlDayDu } from "@/lib/seo";

export const revalidate = 21600;

function dsNgaySitemap(homNay: string = homNayVN()): string[] {
  const ra: string[] = [];
  for (let i = -7; i <= 400; i++) {
    const iso = congNgay(homNay, i);
    if (ngayDangIndex(iso, homNay)) ra.push(iso);
  }
  return ra;
}

export function GET() {
  const homNay = homNayVN();
  const dong = dsNgaySitemap(homNay).map((iso) => {
    const gan = iso >= homNay && iso <= congNgay(homNay, 60);      // 60 ngày tới: người ta hay tra nhất
    return `<url><loc>${urlDayDu(duongNgay(iso))}</loc><changefreq>${gan ? "weekly" : "monthly"}</changefreq><priority>${gan ? "0.6" : "0.4"}</priority></url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${dong.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400" } });
}
