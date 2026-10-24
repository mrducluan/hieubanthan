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
import { baiBlog, duongBlog, slugTuUrl } from "@/lib/blog";
import { mangCuaBai } from "@/lib/blog-mang";
import { anhCms, baiCms, baiLienQuan, tinhNangCms } from "@/lib/cms";
import { ganIdMucLuc } from "@/lib/muc-luc";
import { sanitizeNotFairArticleHtml } from "@/lib/notfair-article";
import { duocXemNhap } from "@/lib/noi-dung-trang";
import { catMoTa, goiLd, ldDuongDan, siteUrl, TEN_SITE, tieuDeSeo, urlDayDu } from "@/lib/seo";
import styles from "../notfair-article.module.css";

type Props = { params: Promise<{ slug: string }> };

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
  const duong = duongBlog(p.slug);
  const moTa = catMoTa(p.meta_description ?? p.title);
  return {
    title: tieuDeSeo(p.title),
    description: moTa,
    alternates: { canonical: duong },
    openGraph: {
      type: "article", title: p.title, description: moTa, url: duong, locale: "vi_VN", siteName: TEN_SITE,
      ...(p.published_at ? { publishedTime: p.published_at } : {}), tags: p.tags,
      images: [{ url: p.image_url, width: 1600, height: 900, alt: p.title }],
    },
    twitter: { card: "summary_large_image", title: p.title, description: moTa, images: [p.image_url] },
  };
}

export default async function Page({ params }: Props) {
  const slug = slugTuUrl((await params).slug);
  const nhap = await duocXemNhap(`bai:${slug}`);   // SEC-2: nháp chỉ mở cho đúng bài được ký
  const c = await baiCms(slug, nhap);
  if (c && "chuyen" in c) permanentRedirect(duongBlog(c.chuyen));
  if (c && "bai" in c) {
    const [tn, lienQuan] = await Promise.all([tinhNangCms(), baiLienQuan(c.bai)]);
    return <BaiCms bai={c.bai} tn={tn} lienQuan={lienQuan} nhap={nhap} />;
  }
  const p = await baiBlog(slug);
  if (!p) notFound();
  const duong = duongBlog(p.slug);
  const ngay = p.published_at ?? p.created_at;
  // Mục lục dựng từ H2/H3 của chính bài (mục lục NotFair chèn sẵn đã bỏ khi lọc); mảng của bài → CTA chân bài đổi theo.
  const { html, mucLuc } = ganIdMucLuc(sanitizeNotFairArticleHtml(p.content_html));
  const mang = mangCuaBai({ tieuDe: p.title, slug: p.slug, the: p.tags, moTa: p.meta_description });

  return (
    <KhungBaiDoc mucLuc={mucLuc} tieuDe={p.title} nguon="notfair" ben={<CtaBen mang={mang} />}>
    <article data-mang-bai={mang}>
      <JsonLd data={goiLd(
        {
          "@type": "BlogPosting",
          "@id": `${urlDayDu(duong)}#bai`,
          headline: p.title,
          ...(p.meta_description ? { description: p.meta_description } : {}),
          image: p.image_url,
          inLanguage: "vi-VN",
          datePublished: ngay,
          dateModified: ngay,
          mainEntityOfPage: urlDayDu(duong),
          // BM-1/EEAT-1: bài trao đổi không do chuyên gia viết → tác giả là ban biên tập (tổ chức), không ghi tên người.
          author: { "@type": "Organization", name: `Ban biên tập ${TEN_SITE}`, url: siteUrl() },
          publisher: { "@id": `${siteUrl()}/#to-chuc` },
          isPartOf: { "@id": `${siteUrl()}/#website` },
          ...(p.tags.length ? { keywords: p.tags.join(", ") } : {}),
        },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Blog", duong: "/blog" }, { ten: p.title, duong }]),
      )} />
      <nav aria-label="Đường dẫn" className="text-xs text-fg-faint">
        <ol className="flex flex-wrap gap-1.5">
          <li><Link href="/blog" className="hover:text-fg">Blog</Link> ›</li>
        </ol>
      </nav>

      <NotFairPostHero post={p} className="mt-4 flex flex-col gap-6"
        titleClassName="text-3xl leading-tight sm:text-5xl" imageClassName="rounded-2xl border border-line/80"
        sizes="(max-width: 768px) 100vw, 768px" />
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-fg-faint">
        <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden />
          <time dateTime={ngay}>{ngay.slice(0, 10).split("-").reverse().join("/")}</time></span>
        {p.reading_time_minutes ? <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden />{p.reading_time_minutes} phút đọc</span> : null}
      </div>

      <MucLucGon mucLuc={mucLuc} tieuDe={p.title} />

      <div id={THAN_BAI_ID} className={`mt-8 ${styles.articleContent}`} dangerouslySetInnerHTML={{ __html: html }} />

      <CtaBlog mang={mang} className="mt-12" />

      <footer className="mt-10 border-t border-line/60 pt-5 text-xs leading-relaxed text-fg-faint">
        <p>Nội dung mang tính tham khảo văn hoá, giúp tự soi — không phải lời phán định mệnh, không thay lời khuyên y tế, pháp lý, tài chính.</p>
        <Link href="/blog" className="mt-2 inline-block text-gold hover:underline">← Tất cả bài viết</Link>
      </footer>
    </article>
    </KhungBaiDoc>
  );
}
