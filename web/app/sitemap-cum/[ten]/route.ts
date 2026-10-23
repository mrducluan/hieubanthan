// SEO-M — sitemap một cụm kiến thức: /sitemap-cum/{mã}.xml (mã trong lib/sitemap-cum.ts). Engine lỗi → 503 (không trả rỗng).
import { urlCum, xmlTraVe } from "@/lib/sitemap-cum";

export const revalidate = 21600;

export async function GET(_: Request, { params }: { params: Promise<{ ten: string }> }) {
  const m = /^([a-z-]+)\.xml$/.exec((await params).ten);
  const ds = m ? await urlCum(m[1]!) : null;
  if (!ds) return new Response("Không có sitemap này", { status: 404 });
  if (ds.length <= 1 && m![1] !== "huong-hop-tuoi") return new Response("Engine chưa sẵn sàng", { status: 503 });
  const dong = ds.map((x) => `<url><loc>${x.url}</loc>${x.lastmod ? `<lastmod>${x.lastmod}</lastmod>` : ""}</url>`);
  return xmlTraVe(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${dong.join("\n")}\n</urlset>\n`);
}
