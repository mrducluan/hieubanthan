// /blog/rss.xml — RSS 2.0 cho trình đọc tin, công cụ tổng hợp tin, bot chia sẻ. Bài CMS + NotFair (đã gộp), bỏ bài noindex.
import { dsBaiTongHop, duongBlog } from "@/lib/blog";
import { TEN_SITE, urlDayDu } from "@/lib/seo";

export const revalidate = 3600;

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const ds = (await dsBaiTongHop()).filter((b) => !b.noindex).slice(0, 50);
  const muc = ds.map((b) => {
    const url = urlDayDu(duongBlog(b.slug));
    return [
      "<item>",
      `<title>${xml(b.tieuDe)}</title>`,
      `<link>${xml(url)}</link>`,
      `<guid isPermaLink="true">${xml(url)}</guid>`,
      b.ngay ? `<pubDate>${new Date(b.ngay).toUTCString()}</pubDate>` : "",
      b.moTa ? `<description>${xml(b.moTa)}</description>` : "",
      ...(b.chuyenMuc ?? []).map((c) => `<category>${xml(c.ten)}</category>`),
      b.anh ? `<enclosure url="${xml(b.anh.src)}" type="image/${/\.png(\?|$)/i.test(b.anh.src) ? "png" : /\.jpe?g(\?|$)/i.test(b.anh.src) ? "jpeg" : "webp"}" length="0"/>` : "",
      "</item>",
    ].filter(Boolean).join("");
  }).join("\n");
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${xml(`Blog ${TEN_SITE}`)}</title>
<link>${xml(urlDayDu("/blog"))}</link>
<atom:link href="${xml(urlDayDu("/blog/rss.xml"))}" rel="self" type="application/rss+xml"/>
<description>Bài viết về hiểu bản thân, thần số học, Tử vi, Kinh Dịch, Bát tự, phong thuỷ.</description>
<language>vi-VN</language>
${ds[0]?.ngay ? `<lastBuildDate>${new Date(ds[0].ngay).toUTCString()}</lastBuildDate>` : ""}
${muc}
</channel>
</rss>
`;
  return new Response(body, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
