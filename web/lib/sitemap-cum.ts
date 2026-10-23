// SEO-M (chủ dự án duyệt 2026-10-23) — sitemap riêng theo từng họ trang kiến thức, để Search Console báo "đã lập chỉ
// mục / chưa" theo từng cụm (Search Console tách số liệu theo từng sitemap đã gửi). URL vẫn nằm trong /sitemap.xml —
// một URL có mặt ở nhiều sitemap là hợp lệ. Họ nào sau 90 ngày không có lượt hiển thị → gộp hoặc tạm noindex.
import { CHU_DE, dsTuoiHuong, duongTrang, duongTuoi, mucLuc } from "@/lib/kien-thuc";
import { urlDayDu } from "@/lib/seo";

/** Mã sitemap → nhãn. Mã = khoá chủ đề trong lib/chuyen-huong.json + "huong-hop-tuoi". */
export const CUM_SITEMAP = [...Object.keys(CHU_DE), "huong-hop-tuoi"];
export const duongSitemapCum = (ma: string) => `/sitemap-cum/${ma}.xml`;

export async function urlCum(ma: string): Promise<{ url: string; lastmod?: string }[] | null> {
  if (ma === "huong-hop-tuoi") return (await dsTuoiHuong()).map((t) => ({ url: urlDayDu(duongTuoi(t.slug)) }));
  const cd = CHU_DE[ma];
  if (!cd) return null;
  const ds = (await mucLuc()).filter((t) => t.loai === cd.loai && t.index);
  return [{ url: urlDayDu(cd.duong) }, ...ds.map((t) => ({ url: urlDayDu(duongTrang(t.loai, t.slug)), lastmod: t.cap_nhat }))];
}

export const xmlTraVe = (xml: string) => new Response(xml, {
  headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400" },
});
