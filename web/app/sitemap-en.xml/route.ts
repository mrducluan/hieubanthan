// QTE — sitemap riêng cho bản tiếng Anh (/en/*): trang công cụ, 12 trang Life Path, 78 trang lá bài, pháp lý. Tách khỏi
// sitemap.xml để luật "mọi URL sitemap.xml thuộc sổ trang CMS" (ND-7) không đụng; khai trong robots. Mỗi URL khai hreflang
// hai chiều (en ↔ bản Việt TƯƠNG ĐƯƠNG — trang cùng lá / cùng số, không trỏ mục lục; bản Việt là x-default) + lastmod thật
// (sổ ngày cập nhật của engine, QTE) cho trang kiến thức.
import { engineEn, slugLa, slugVi } from "@/lib/en/engine";
import { BAN_TIENG_ANH } from "@/lib/noi-dung-trang";
import { urlDayDu } from "@/lib/seo";
import { CAP_DUONG } from "@/lib/duong-en";
import { mucSoTrang } from "@/lib/so-trang";
import { banAnhRewrite } from "@/lib/duong-en";
import { CHU_DE, type MucLuc } from "@/lib/kien-thuc";

export const revalidate = 21600;

const SO = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
const VI_CUA_EN: Record<string, string> = { ...Object.fromEntries(Object.entries(BAN_TIENG_ANH).map(([vi, en]) => [en, vi])),
  "/en/numerology/life-path": "/than-so/y-nghia-so", "/en/privacy": "/chinh-sach-rieng-tu", "/en/terms": "/dieu-khoan",
  // EN-ALL: trang công cụ mở bản Anh qua rewrite (một cây component) — lấy từ bảng lib/duong-en.json (cờ `mo`, không `rieng`).
  ...Object.fromEntries(CAP_DUONG.filter((c) => c.mo && !c.rieng && mucSoTrang(c.vi)?.nhom === "cong_cu").map((c) => [c.en, c.vi])) };
const TINH = ["/en", "/en/numerology", "/en/numerology/life-path", "/en/tarot", "/en/tarot/cards", "/en/privacy", "/en/terms",
  ...CAP_DUONG.filter((c) => c.mo && !c.rieng && mucSoTrang(c.vi)?.nhom === "cong_cu").map((c) => c.en)];

// EN-ALL GĐ 3d: cụm kiến thức mở bản Anh (rewrite của trang cụm Việt) — trang cụm + mọi trang con có index, slug Anh từ
// mục lục bản Anh của engine, hreflang về trang Việt CÙNG mục.
const CUM_MO = Object.values(CHU_DE).flatMap((cd) => { const en = banAnhRewrite(cd.duong); return en ? [{ ...cd, en }] : []; });

const xmlThoat = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

export async function GET() {
  const [bo, boVi, so, ml] = await Promise.all([
    engineEn<{ la: Record<string, { en: string; ten: string }> }>("/v1/tarot/bo-bai"),
    engineEn<{ la: Record<string, { ten: string }> }>("/v1/tarot/bo-bai", 21_600, "vi"),
    Promise.all(SO.map((n) => engineEn<{ cap_nhat?: string }>(`/v1/thanso/so/${n}`))),
    CUM_MO.length ? engineEn<{ trang: MucLuc[] }>("/v1/kb/trang") : null,
  ]);
  const muc: { en: string; vi?: string; lastmod?: string }[] = TINH.map((en) => ({ en, vi: VI_CUA_EN[en] }));
  SO.forEach((n, i) => muc.push({ en: `/en/numerology/life-path/${n}`, vi: `/than-so/y-nghia-so/so-${n}`, lastmod: so[i]?.ok ? so[i].data.cap_nhat : undefined }));
  for (const cd of CUM_MO) {
    muc.push({ en: cd.en, vi: cd.duong });
    if (ml?.ok) for (const t of ml.data.trang) {
      if (t.loai === cd.loai && t.index && t.slug_en) muc.push({ en: `${cd.en}/${t.slug_en}`, vi: `${cd.duong}/${t.slug}`, lastmod: t.cap_nhat });
    }
  }
  if (bo.ok) {
    const ds = Object.entries(bo.data.la);
    // lastmod thật từng lá (sổ ngày cập nhật của engine) — 78 lượt gọi, mỗi lượt cache 6 giờ như trang lá.
    const ngay = await Promise.all(ds.map(([id]) => engineEn<{ cap_nhat?: string }>(`/v1/tarot/la/${id}`)));
    ds.forEach(([id, x], i) => {
      const tenVi = boVi.ok ? boVi.data.la[id]?.ten : undefined;
      muc.push({ en: `/en/tarot/cards/${slugLa(x.en)}`, vi: tenVi ? `/tarot/la-bai/${slugVi(tenVi)}` : undefined, lastmod: ngay[i]?.ok ? ngay[i].data.cap_nhat : undefined });
    });
  }
  const dong = muc.map((m) => {
    const alt = [`<xhtml:link rel="alternate" hreflang="en" href="${xmlThoat(urlDayDu(m.en))}"/>`];
    if (m.vi) alt.push(`<xhtml:link rel="alternate" hreflang="vi" href="${xmlThoat(urlDayDu(m.vi))}"/>`, `<xhtml:link rel="alternate" hreflang="x-default" href="${xmlThoat(urlDayDu(m.vi))}"/>`);
    return `<url><loc>${xmlThoat(urlDayDu(m.en))}</loc>${m.lastmod ? `<lastmod>${m.lastmod}</lastmod>` : ""}${alt.join("")}</url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${dong.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600, s-maxage=21600" } });
}
