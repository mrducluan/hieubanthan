// SEO-M (chủ dự án duyệt 2026-10-23) — sitemap riêng theo từng họ trang kiến thức, để Search Console báo "đã lập chỉ
// mục / chưa" theo từng cụm (Search Console tách số liệu theo từng sitemap đã gửi). URL vẫn nằm trong /sitemap.xml —
// một URL có mặt ở nhiều sitemap là hợp lệ. Họ nào sau 90 ngày không có lượt hiển thị → gộp hoặc tạm noindex.
import { CHU_DE, dsTuoiHuong, duongTrang, duongTuoi, mucLuc } from "@/lib/kien-thuc";
import { urlDayDu } from "@/lib/seo";

/** Mã sitemap → nhãn. Mã = khoá chủ đề trong lib/chuyen-huong.json + "huong-hop-tuoi". */
export const CUM_SITEMAP = [...Object.keys(CHU_DE), "huong-hop-tuoi"];
// Đặt ở gốc site (/sitemap-cum-{mã}.xml → rewrite tới /sitemap-cum/{mã}.xml): sitemap chỉ được liệt kê URL nằm dưới
// thư mục của chính nó (sitemaps.org) — Google bỏ qua luật này với site đã xác minh, Bing thì có thể không.
export const duongSitemapCum = (ma: string) => `/sitemap-cum-${ma}.xml`;

type KetQua = { url: string; lastmod?: string }[] | "khong_co" | "engine_loi";

/** "khong_co" = mã lạ (404) · "engine_loi" = engine chưa trả danh sách (503, Google thử lại) · mảng = urlset (có thể
 *  chỉ còn trang cụm nếu mọi trang con đang noindex — vẫn là sitemap hợp lệ). */
export async function urlCum(ma: string): Promise<KetQua> {
  if (ma === "huong-hop-tuoi") {
    const ds = await dsTuoiHuong();
    return ds.length ? ds.map((t) => ({ url: urlDayDu(duongTuoi(t.slug)) })) : "engine_loi";
  }
  const cd = CHU_DE[ma];
  if (!cd) return "khong_co";
  const tat = await mucLuc();
  if (!tat.length) return "engine_loi";
  const ds = tat.filter((t) => t.loai === cd.loai && t.index);
  return [{ url: urlDayDu(cd.duong) }, ...ds.map((t) => ({ url: urlDayDu(duongTrang(t.loai, t.slug)), lastmod: t.cap_nhat }))];
}

export const xmlTraVe = (xml: string) => new Response(xml, {
  headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400" },
});
