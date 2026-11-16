// QTE — sitemap riêng cho bản tiếng Anh (/en/*): trang công cụ, cụm kiến thức (Life Path, 78 lá bài… — GĐ 7 là cụm rewrite), pháp lý. Tách khỏi
// sitemap.xml để luật "mọi URL sitemap.xml thuộc sổ trang CMS" (ND-7) không đụng; khai trong robots. Mỗi URL khai hreflang
// hai chiều (en ↔ bản Việt TƯƠNG ĐƯƠNG — trang cùng lá / cùng số, không trỏ mục lục; bản Việt là x-default) + lastmod thật
// (sổ ngày cập nhật của engine, QTE) cho trang kiến thức.
import { engineEn } from "@/lib/en/engine";
import { BAN_TIENG_ANH } from "@/lib/noi-dung-trang";
import { urlDayDu } from "@/lib/seo";
import { CAP_DUONG } from "@/lib/duong-en";
import { mucSoTrang } from "@/lib/so-trang";
import { banAnhRewrite } from "@/lib/duong-en";
import { CHU_DE, type MucLuc } from "@/lib/kien-thuc";
import { GOC_EN, NGAY_SAU, THANG_SAU, THANG_TRUOC, VIEC_SEO, VIEC_THANG_SAU, congNgay, demViecThang, duoiEn, duongNgay, duongThang,
  duongViecThang, homNayVN } from "@/lib/hoang-lich";
import { duongLichAm } from "@/lib/lich-am";
import { banAnh } from "@/lib/duong-en";
import { duongNamTuoiSitemap } from "@/lib/sitemap-nam-tuoi";

export const revalidate = 21600;

const VI_CUA_EN: Record<string, string> = { ...Object.fromEntries(Object.entries(BAN_TIENG_ANH).map(([vi, en]) => [en, vi])),
  "/en/privacy": "/chinh-sach-rieng-tu", "/en/terms": "/dieu-khoan",
  // EN-ALL: trang công cụ mở bản Anh qua rewrite (một cây component) — lấy từ bảng lib/duong-en.json (cờ `mo`, không `rieng`).
  ...Object.fromEntries(CAP_DUONG.filter((c) => c.mo && !c.rieng && mucSoTrang(c.vi)?.nhom === "cong_cu").map((c) => [c.en, c.vi])) };
// Trang viết riêng dưới app/en (cờ `rieng`: trang vào /en, pháp lý) + trang công cụ rewrite.
const TINH = [...CAP_DUONG.filter((c) => c.mo && c.rieng).map((c) => c.en),
  ...CAP_DUONG.filter((c) => c.mo && !c.rieng && mucSoTrang(c.vi)?.nhom === "cong_cu").map((c) => c.en)];

// EN-ALL GĐ 3d: cụm kiến thức mở bản Anh (rewrite của trang cụm Việt) — trang cụm + mọi trang con có index, slug Anh từ
// mục lục bản Anh của engine, hreflang về trang Việt CÙNG mục.
const CUM_MO = Object.values(CHU_DE).flatMap((cd) => { const en = banAnhRewrite(cd.duong); return en ? [{ ...cd, en }] : []; });

const xmlThoat = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

export async function GET() {
  const ml = CUM_MO.length ? await engineEn<{ trang: MucLuc[] }>("/v1/kb/trang") : null;
  const muc: { en: string; vi?: string; lastmod?: string }[] = TINH.map((en) => ({ en, vi: VI_CUA_EN[en] }));
  for (const cd of CUM_MO) {
    muc.push({ en: cd.en, vi: cd.duong });
    if (ml?.ok) for (const t of ml.data.trang) {
      if (t.loai === cd.loai && t.index && t.slug_en) muc.push({ en: `${cd.en}/${t.slug_en}`, vi: `${cd.duong}/${t.slug}`, lastmod: t.cap_nhat });
    }
  }
  // EN-ALL GĐ 4: lá số mẫu Tử vi (không phải cụm KB — engine /v1/tuvi/la-so-mau, slug giống bản Việt).
  const lsm = banAnhRewrite("/tu-vi/la-so-mau");
  if (lsm) {
    const ds = await engineEn<{ ds: { slug: string }[] }>("/v1/tuvi/la-so-mau");
    muc.push({ en: lsm, vi: "/tu-vi/la-so-mau" });
    if (ds.ok) for (const x of ds.data.ds) muc.push({ en: `${lsm}/${x.slug}`, vi: `/tu-vi/la-so-mau/${x.slug}` });
  }
  // EN-ALL GĐ 8: lịch âm (trang "tinh", không phải công cụ) + năm ±10; Xem ngày tốt theo cùng cửa sổ index bản Việt:
  // ngày −7…+NGAY_SAU, tháng −THANG_TRUOC…+THANG_SAU, việc trong tháng tháng này…+VIEC_THANG_SAU (tháng 0 ngày tốt bỏ).
  if (CAP_DUONG.some((c) => c.vi === "/lich-am" && c.mo)) {
    const namNay = Number(homNayVN().slice(0, 4));
    muc.push({ en: "/en/lunar-calendar", vi: "/lich-am" });
    for (let n = namNay - 10; n <= namNay + 10; n++) muc.push({ en: duongLichAm(n, true), vi: duongLichAm(n) });
  }
  if (CAP_DUONG.some((c) => c.vi === "/xem-ngay-tot" && c.mo)) {
    const h = homNayVN();
    for (let i = -7; i <= NGAY_SAU; i++) { const iso = congNgay(h, i); muc.push({ en: duongNgay(iso, true), vi: duongNgay(iso) }); }
    const y = Number(h.slice(0, 4)), m = Number(h.slice(5, 7));
    const thang = (l: number) => { const t = y * 12 + (m - 1) + l; return { nam: Math.floor(t / 12), thang: (t % 12) + 1 }; };
    for (let l = -THANG_TRUOC; l <= THANG_SAU; l++) { const x = thang(l); muc.push({ en: duongThang(x.nam, x.thang, true), vi: duongThang(x.nam, x.thang) }); }
    const dau = thang(0);
    const dem = await demViecThang(dau.nam, dau.thang, VIEC_THANG_SAU + 1);
    for (let l = 0; l <= VIEC_THANG_SAU; l++) {
      const x = thang(l);
      for (const v of VIEC_SEO) {
        const so = dem?.find((z) => z.ma === v.ma && z.nam === x.nam && z.thang === x.thang)?.so_ngay;
        if (so === 0) continue;
        muc.push({ en: `${GOC_EN}/${duoiEn({ loai: "viec", viec: v, nam: x.nam, thang: x.thang })}`, vi: duongViecThang(v.slug, x.nam, x.thang) });
      }
    }
  }
  // EN-ALL GĐ 8: trang năm & tuổi (mục lục năm, trang năm, theo tuổi, sinh ở nước ngoài…) — cùng luật index bản Việt.
  for (const vi of await duongNamTuoiSitemap().catch(() => [] as string[])) {
    const en = banAnh(vi);
    if (en && !muc.some((m) => m.en === en)) muc.push({ en, vi });
  }
  const dong = muc.map((m) => {
    const alt = [`<xhtml:link rel="alternate" hreflang="en" href="${xmlThoat(urlDayDu(m.en))}"/>`];
    if (m.vi) alt.push(`<xhtml:link rel="alternate" hreflang="vi" href="${xmlThoat(urlDayDu(m.vi))}"/>`, `<xhtml:link rel="alternate" hreflang="x-default" href="${xmlThoat(urlDayDu(m.vi))}"/>`);
    return `<url><loc>${xmlThoat(urlDayDu(m.en))}</loc>${m.lastmod ? `<lastmod>${m.lastmod}</lastmod>` : ""}${alt.join("")}</url>`;
  });
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${dong.join("\n")}\n</urlset>\n`;
  return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600, s-maxage=21600" } });
}
