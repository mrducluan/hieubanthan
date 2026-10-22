// Khung /blog/chuyen-muc/{slug}[/trang/{n}] — bài theo chuyên mục (chuyên mục tạo trong CMS). Trang thật có URL riêng: Google lập chỉ mục
// được cụm chủ đề (CollectionPage + ItemList), người đọc chia sẻ được. Chuyên mục không có bài → noindex.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { ChipChuyenMuc, chuyenMucCoBai, duongChuyenMuc, LuoiBai } from "@/components/blog/LuoiBai";
import { dsBaiTongHop, duongBlog } from "@/lib/blog";
import { dsChuyenMucCms } from "@/lib/cms";
import { catMoTa, goiLd, ldDuongDan, metaTrang, urlDayDu } from "@/lib/seo";
import { PhanTrang } from "@/components/blog/PhanTrang";
import { catTrang, duongTrangSo, soTrang } from "@/lib/phan-trang";

export async function duLieu(slug: string) {
  const [dsCm, ds] = await Promise.all([dsChuyenMucCms(), dsBaiTongHop()]);
  const cm = dsCm.find((c) => c.slug === slug);
  if (!cm) return null;
  return { cm, bai: ds.filter((b) => b.chuyenMuc?.some((c) => c.slug === slug)), tatCa: ds };
}

export async function metaChuyenMuc(slug: string, n: number): Promise<Metadata> {
  const d = await duLieu(slug);
  if (!d) return { title: "Không tìm thấy", robots: { index: false } };
  const moTa = catMoTa(d.cm.mo_ta || `Các bài viết chuyên mục ${d.cm.ten} trên blog Hiểu Bản Thân.`);
  return {
    ...metaTrang({ tieuDe: `${d.cm.ten} — Blog${n > 1 ? ` — trang ${n}` : ""}`, moTa, duong: duongTrangSo(duongChuyenMuc(d.cm.slug), n) }),
    ...(d.bai.length ? {} : { robots: { index: false, follow: true } }),
  };
}

/** SEO-K: khung chung cho /blog/chuyen-muc/{slug} và /blog/chuyen-muc/{slug}/trang/{n}. */
export async function TrangChuyenMuc({ slug, n }: { slug: string; n: number }) {
  const d = await duLieu(slug);
  if (!d) notFound();
  const { cm } = d;
  const tong = soTrang(d.bai.length);
  if (n > tong) notFound();
  const bai = catTrang(d.bai, n);
  const goc = duongChuyenMuc(cm.slug);
  const duong = duongTrangSo(goc, n);
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        {
          "@type": "CollectionPage", name: cm.ten, url: urlDayDu(duong), inLanguage: "vi-VN",
          ...(cm.mo_ta ? { description: cm.mo_ta } : {}),
          mainEntity: { "@type": "ItemList", itemListElement: bai.map((b, i) => ({ "@type": "ListItem", position: i + 1, url: urlDayDu(duongBlog(b.slug)), name: b.tieuDe })) },
        },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Blog", duong: "/blog" }, { ten: cm.ten, duong: goc }, ...(n > 1 ? [{ ten: `Trang ${n}`, duong }] : [])]),
      )} />
      <nav aria-label="Đường dẫn" className="text-xs text-fg-faint">
        <ol className="flex flex-wrap gap-1.5"><li><Link href="/blog" className="hover:text-fg">Blog</Link> ›</li></ol>
      </nav>
      <p className="eyebrow mt-4">Chuyên mục</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">{cm.ten}{n > 1 ? ` — trang ${n}` : ""}</h1>
      {cm.mo_ta && <p className="mt-3 max-w-2xl text-fg-muted">{cm.mo_ta}</p>}
      <ChipChuyenMuc ds={chuyenMucCoBai(d.tatCa)} dangChon={cm.slug} />
      {bai.length ? <LuoiBai ds={bai} noiBat={n === 1} /> : (
        <p className="glass mt-8 rounded-2xl p-6 text-fg-muted">Chuyên mục này chưa có bài. <Link href="/blog" className="text-gold underline underline-offset-4">Xem tất cả bài viết</Link>.</p>
      )}
      <PhanTrang goc={goc} n={n} tong={tong} />
    </div>
  );
}
