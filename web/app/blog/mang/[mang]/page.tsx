// UI-BLOG — /blog/mang/{slug}: mọi bài của một mảng Huyền học (Thần số · Tử vi · Bát tự · Kinh Dịch · Phong thuỷ · Hợp đôi ·
// Xem ngày tốt · Hiểu bản thân). Mảng = trường `mang` ban biên tập chọn, chưa chọn → luật từ khoá tất định (lib/blog-mang).
// Trang thật có URL riêng (CollectionPage + ItemList + breadcrumb), mảng chưa có bài → noindex. Trang cụm silo cho SEO/GEO:
// gom bài cùng chủ đề + dẫn sang công cụ và kiến thức của đúng mảng.
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { LuoiBai, ThanhMangBlog } from "@/components/blog/LuoiBai";
import { dsBaiTongHop, duongBlog } from "@/lib/blog";
import { duongMangBlog, lienKetKienThuc, mangTuSlug, nhomTheoMang, THONG_TIN_MANG, type MangBlog } from "@/lib/blog-mang";
import { catMoTa, goiLd, ldDuongDan, metaTrang, urlDayDu } from "@/lib/seo";

type P = { params: Promise<{ mang: string }> };

async function duLieu(slug: string) {
  const mang = mangTuSlug(slug);
  if (!mang) return null;
  const tatCa = await dsBaiTongHop();
  const nhom = nhomTheoMang(tatCa);
  return { mang, tatCa, nhom, bai: nhom.find((g) => g.mang === mang)?.bai ?? [] };
}

const moTaMang = (m: MangBlog) => catMoTa(`Bài viết ${THONG_TIN_MANG[m].ten} trên blog Hiểu Bản Thân: ${THONG_TIN_MANG[m].ngan}`);

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const d = await duLieu((await params).mang);
  if (!d) return { title: "Không tìm thấy", robots: { index: false } };
  return {
    ...metaTrang({ tieuDe: `Blog ${THONG_TIN_MANG[d.mang].ten} — bài viết, hướng dẫn`, moTa: moTaMang(d.mang), duong: duongMangBlog(d.mang) }),
    ...(d.bai.length ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function Page({ params }: P) {
  const d = await duLieu((await params).mang);
  if (!d) notFound();
  const tt = THONG_TIN_MANG[d.mang];
  const duong = duongMangBlog(d.mang);
  const kt = lienKetKienThuc(d.mang);
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        {
          "@type": "CollectionPage", "@id": `${urlDayDu(duong)}#trang`, name: `Blog ${tt.ten}`, url: urlDayDu(duong), inLanguage: "vi-VN",
          description: moTaMang(d.mang), about: tt.ten,
          mainEntity: { "@type": "ItemList", numberOfItems: d.bai.length, itemListElement: d.bai.map((b, i) => ({ "@type": "ListItem", position: i + 1, url: urlDayDu(duongBlog(b.slug)), name: b.tieuDe })) },
        },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Blog", duong: "/blog" }, { ten: tt.ten, duong }]),
      )} />
      <nav aria-label="Đường dẫn" className="text-xs text-fg-faint">
        <ol className="flex flex-wrap gap-1.5"><li><Link href="/" className="hover:text-fg">Trang chủ</Link> ›</li><li><Link href="/blog" className="hover:text-fg">Blog</Link> ›</li><li aria-current="page" className="text-fg-muted">{tt.ten}</li></ol>
      </nav>
      <p className="eyebrow mt-4">Chuyên đề</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Blog {tt.ten}</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">{tt.ngan} {d.bai.length ? `${d.bai.length} bài viết.` : ""}</p>
      <ThanhMangBlog ds={d.nhom.map((g) => ({ mang: g.mang, so: g.bai.length }))} dangChon={d.mang} tong={d.tatCa.length} />

      {d.bai.length ? <LuoiBai ds={d.bai} anMang /> : (
        <p className="glass mt-8 rounded-2xl p-6 text-fg-muted">Chuyên đề này chưa có bài. <Link href="/blog" className="text-gold underline underline-offset-4">Xem tất cả bài viết</Link>.</p>
      )}

      {/* Lối đi tiếp trong silo: công cụ + kiến thức của đúng mảng. */}
      <section aria-labelledby="di-tiep" className="glass mt-14 grid gap-6 rounded-2xl p-6 sm:grid-cols-[1.2fr_1fr] sm:p-8">
        <div>
          <h2 id="di-tiep" className="text-2xl">Thử {tt.ten} với chính bạn</h2>
          <p className="mt-2 text-sm text-fg-muted">{tt.loi}</p>
          <Link href={tt.duong} className="mt-5 inline-flex min-h-11 items-center gap-1.5 rounded-full bg-gold px-5 font-medium text-[#1a1406] hover:brightness-110">{tt.nut} <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
        {kt.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-gold/90">Kiến thức {tt.ten}</h3>
            <ul className="mt-3 space-y-2 text-sm">{kt.map((k) => <li key={k.duong}><Link href={k.duong} className="text-fg-muted underline-offset-4 hover:text-fg hover:underline">{k.ten}</Link></li>)}</ul>
          </div>
        )}
      </section>
    </div>
  );
}
