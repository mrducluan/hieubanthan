// /blog/{slug} — bài blog. Tra CMS (bài của ban biên tập) TRƯỚC → slug cũ của bài CMS thì chuyển hướng 308 → không có
// mới gọi NotFair → notFound() sau cùng. Bản nháp CMS chỉ hiện trong draft mode (link xem trước có ký, /api/cms/xem-truoc).
// Thân bài là HTML từ xa → luôn lọc (cms-html / sanitizeNotFairArticleHtml), không render HTML thô.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { CalendarDays, Clock } from "lucide-react";
import { NotFairPostHero } from "notfair-nextjs-blog/react";
import { JsonLd } from "@/components/seo/JsonLd";
import { BaiCms } from "@/components/blog/BaiCms";
import { CtaBen, CtaBlog } from "@/components/blog/CtaBlog";
import { KhungBaiDoc, MucLucGon, THAN_BAI_ID } from "@/components/blog/KhungBaiDoc";
import { baiBlog, dsBaiTongHop, duongBlog, slugChuan, slugTuUrl } from "@/lib/blog";
import { baiCungMang, lienKetKienThuc, mangCuaBai, THONG_TIN_MANG } from "@/lib/blog-mang";
import { MocDocXong } from "@/components/khung/CuoiBaiDoc";
import { TheLap } from "@/components/khung/TheLap";
import { DoKhoiCuoi } from "@/components/khung/DoKhoiCuoi";
import { theLapBlog } from "@/lib/the-lap";
import { MANG_HINH } from "@/app/og/hinh";
import { boLap } from "@/lib/the-lap-cms";
import { anhCms, baiCms, baiLienQuan, tinhNangCms } from "@/lib/cms";
import { ganIdMucLuc } from "@/lib/muc-luc";
import { sanitizeNotFairArticleHtml } from "@/lib/notfair-article";
import { duocXemNhap } from "@/lib/noi-dung-trang";
import { catMoTa, goiLd, ldDuongDan, siteUrl, TEN_SITE, tieuDeSeo, urlDayDu } from "@/lib/seo";
import styles from "../notfair-article.module.css";

type Props = { params: Promise<{ slug: string }> };
type BaiNf = NonNullable<Awaited<ReturnType<typeof baiBlog>>>;

const chuThuan = (html: string) => html.replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
const soTu = (html: string) => chuThuan(html).split(" ").filter(Boolean).length;

/** BLOG-7: bài NotFair thiếu meta description → lấy đoạn văn đầu tiên đủ dài của thân bài (không để Google tự cắt). */
function moTaNotFair(p: BaiNf): string {
  if (p.meta_description?.trim()) return catMoTa(p.meta_description);
  const doan = [...(p.content_html ?? "").matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => chuThuan(m[1] ?? "")).find((t) => t.length >= 80);
  return catMoTa(doan ?? p.title);
}
/** Ảnh chia sẻ: ảnh bìa NotFair, thiếu thì ảnh đại diện theo mảng của site (tiêu đề bài trên ảnh). */
function anhNotFair(p: BaiNf): string {
  if (p.image_url) return p.image_url;
  const m = mangCuaBai({ tieuDe: p.title, slug: p.slug, the: p.tags });
  const h = m === "xem_ngay" ? "lich" : m.replace(/_/g, "-");
  return `/og?tieu_de=${encodeURIComponent(p.title.slice(0, 110))}${(MANG_HINH as readonly string[]).includes(h) ? `&mang=${h}` : ""}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = slugTuUrl((await params).slug);
  const nhap = await duocXemNhap(`bai:${slug}`);   // SEC-2: nháp chỉ mở cho đúng bài được ký
  const c = await baiCms(slug, nhap);
  if (c && "bai" in c) {
    const b = c.bai;
    const duong = duongBlog(b.slug);
    const tieuDe = b.meta?.title || b.tieu_de;
    const moTa = catMoTa(b.meta?.description || b.mo_ta_ngan || b.tra_loi_nhanh || b.tieu_de);
    const og = anhCms(b.meta?.image ?? b.anh_bia, "og");
    return {
      title: tieuDeSeo(tieuDe),
      description: moTa,
      // Bản .md chỉ khai khi route /md trả được (tắt ban_markdown hoặc noindex → route 404, không khai link chết).
      alternates: { canonical: b.canonical || duong,
        ...((await tinhNangCms()).ban_markdown && !b.noindex ? { types: { "text/markdown": `${duong}.md` } } : {}) },
      ...(nhap || b.noindex ? { robots: { index: false, follow: !nhap } } : {}),
      openGraph: {
        type: "article", title: tieuDe, description: moTa, url: duong, locale: "vi_VN", siteName: TEN_SITE,
        ...(b.publishedAt ? { publishedTime: b.publishedAt } : {}), modifiedTime: b.updatedAt,
        ...(b.the?.length ? { tags: b.the } : {}),
        images: og ? [{ url: og.src, width: og.w, height: og.h, alt: og.alt || b.tieu_de }] : ["/og"],
      },
      twitter: { card: "summary_large_image", title: tieuDe, description: moTa, images: [og ? og.src : "/og"] },
    };
  }
  const p = await baiBlog(slug);
  if (!p) return { title: "Không tìm thấy", robots: { index: false } };
  const duong = duongBlog(slugChuan(p.slug));
  const moTa = moTaNotFair(p);
  const anh = anhNotFair(p);
  return {
    title: tieuDeSeo(p.title),
    description: moTa,
    alternates: { canonical: duong },
    ...(p.tags.length ? { keywords: p.tags } : {}),
    openGraph: {
      type: "article", title: p.title, description: moTa, url: duong, locale: "vi_VN", siteName: TEN_SITE,
      ...(p.published_at ? { publishedTime: p.published_at, modifiedTime: p.published_at } : {}), tags: p.tags,
      images: [{ url: anh, width: 1600, height: 900, alt: p.title }],
    },
    twitter: { card: "summary_large_image", title: p.title, description: moTa, images: [anh] },
  };
}

export default async function Page({ params }: Props) {
  const slug = slugTuUrl((await params).slug);
  const nhap = await duocXemNhap(`bai:${slug}`);   // SEC-2: nháp chỉ mở cho đúng bài được ký
  const c = await baiCms(slug, nhap);
  if (c && "chuyen" in c) permanentRedirect(duongBlog(c.chuyen));
  if (c && "bai" in c) {
    const [tn, lienQuan] = await Promise.all([tinhNangCms(), baiLienQuan(c.bai)]);
    return <BaiCms bai={c.bai} tn={tn} lienQuan={lienQuan} nhap={nhap} lapCms={await boLap()} />;
  }
  const p = await baiBlog(slug);
  if (!p) notFound();
  // BLOG-7: đường dẫn lệch chuẩn (slug gốc NotFair còn "đ", chữ hoa…) → 308 về đường dẫn không dấu, một bước.
  const chuan = slugChuan(p.slug);
  if (slug !== chuan) permanentRedirect(duongBlog(chuan));
  const duong = duongBlog(chuan);
  const moTa = moTaNotFair(p);
  const ngay = p.published_at ?? p.created_at;
  // Mục lục dựng từ H2/H3 của chính bài (mục lục NotFair chèn sẵn đã bỏ khi lọc); mảng của bài → CTA chân bài đổi theo.
  const { html, mucLuc } = ganIdMucLuc(sanitizeNotFairArticleHtml(p.content_html));
  const mang = mangCuaBai({ tieuDe: p.title, slug: p.slug, the: p.tags, moTa: moTa });
  const [docTiep, lapCms] = await Promise.all([dsBaiTongHop().then((ds) => baiCungMang(ds, p.slug, mang)), boLap()]);

  return (
    <KhungBaiDoc mucLuc={mucLuc} tieuDe={p.title} nguon="notfair" phut={p.reading_time_minutes} ben={<CtaBen mang={mang} />}>
    <article data-mang-bai={mang}>
      <JsonLd data={goiLd(
        {
          "@type": "BlogPosting",
          "@id": `${urlDayDu(duong)}#bai`,
          headline: p.title,
          description: moTa,
          image: { "@type": "ImageObject", url: urlDayDu(anhNotFair(p)), width: 1600, height: 900 },
          inLanguage: "vi-VN",
          datePublished: ngay,
          dateModified: ngay,
          mainEntityOfPage: urlDayDu(duong),
          // BM-1/EEAT-1: bài trao đổi không do chuyên gia viết → tác giả là ban biên tập (tổ chức), không ghi tên người.
          author: { "@type": "Organization", name: `Ban biên tập ${TEN_SITE}`, url: siteUrl() },
          publisher: { "@id": `${siteUrl()}/#to-chuc` },
          isPartOf: { "@id": `${siteUrl()}/#website` },
          ...(p.tags.length ? { keywords: p.tags.join(", ") } : {}),
          wordCount: soTu(html),
          ...(p.reading_time_minutes ? { timeRequired: `PT${p.reading_time_minutes}M` } : {}),
          articleSection: THONG_TIN_MANG[mang].ten,
        },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Blog", duong: "/blog" }, { ten: p.title, duong }]),
      )} />
      <nav aria-label="Đường dẫn" className="text-xs text-fg-faint">
        <ol className="flex flex-wrap gap-1.5">
          <li><Link href="/blog" className="hover:text-fg">Blog</Link> ›</li>
        </ol>
      </nav>

      <NotFairPostHero post={p} className="mt-4 flex flex-col gap-6"
        titleClassName="text-3xl leading-tight sm:text-5xl" imageClassName="anh-sang rounded-2xl"
        sizes="(max-width: 768px) 100vw, 768px" />
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-fg-faint">
        <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden />
          <time dateTime={ngay}>{ngay.slice(0, 10).split("-").reverse().join("/")}</time></span>
        {p.reading_time_minutes ? <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden />{p.reading_time_minutes} phút đọc</span> : null}
      </div>

      <MucLucGon mucLuc={mucLuc} tieuDe={p.title} phut={p.reading_time_minutes} />

      <div id={THAN_BAI_ID} className={`mt-8 ${styles.articleContent}`} dangerouslySetInnerHTML={{ __html: html }} />
      {/* GATE-DO: reading_completed{mo_dun: blog} khi cuộn hết thân bài (đã cuộn + ≥ 10 giây) — đo tỉ lệ đọc hết → bấm CTA. */}
      <MocDocXong moDun="blog" them={{ mang }} />

      <CtaBlog mang={mang} className="mt-12" />

      {/* CTA-2: ít bài khác (blog mới) → bù cụm kiến thức cùng mảng / lối chung, không để ô trống. */}
      <section aria-labelledby="doc-tiep" className="mt-12" data-testid="doc-tiep">
        <h2 id="doc-tiep" className="text-2xl">Đọc tiếp</h2>
        <DoKhoiCuoi khoi="doc_tiep" />
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {docTiep.map((b) => (
            <li key={b.slug}>
              <Link href={duongBlog(b.slug)} className="glass block h-full rounded-2xl p-4 text-sm hover:border-gold/50">
                <span className="font-medium text-fg">{b.tieuDe}</span>
                {b.moTa && <span className="mt-1 line-clamp-2 block text-fg-faint">{b.moTa}</span>}
              </Link>
            </li>
          ))}
          {theLapBlog(docTiep.length, mang, lienKetKienThuc(mang).map((x) => x.duong), lapCms).map((t) => <TheLap key={t.duong} t={t} kieu="chu-nho" />)}
        </ul>
      </section>

      <footer className="mt-10 border-t border-line/60 pt-5 text-xs leading-relaxed text-fg-faint">
        <p>Nội dung mang tính tham khảo văn hoá, giúp tự soi — không phải lời phán định mệnh, không thay lời khuyên y tế, pháp lý, tài chính.</p>
        <Link href="/blog" className="mt-2 inline-block text-gold hover:underline">← Tất cả bài viết</Link>
      </footer>
    </article>
    </KhungBaiDoc>
  );
}
