// /blog/{slug} — bài blog. Chưa có nguồn bài riêng nên chỉ tra NotFair; khi thêm nguồn riêng: tra nguồn riêng TRƯỚC,
// chỉ khi không có mới gọi NotFair (getBlogPostWithSeoFallback), notFound() sau cùng.
// Thân bài là HTML từ xa → luôn qua sanitizeNotFairArticleHtml, không render content_html thô.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, BookOpen, CalendarDays, Clock } from "lucide-react";
import { NotFairPostHero } from "notfair-nextjs-blog/react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/JsonLd";
import { baiBlog, duongBlog } from "@/lib/blog";
import { sanitizeNotFairArticleHtml } from "@/lib/notfair-article";
import { catMoTa, goiLd, ldDuongDan, siteUrl, TEN_SITE, tieuDeSeo, urlDayDu } from "@/lib/seo";
import styles from "../notfair-article.module.css";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
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
  const { slug } = await params;
  const p = await baiBlog(slug);
  if (!p) notFound();
  const duong = duongBlog(p.slug);
  const ngay = p.published_at ?? p.created_at;

  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        {
          "@type": "BlogPosting",
          "@id": `${urlDayDu(duong)}#bai`,
          headline: p.title,
          ...(p.meta_description ? { description: p.meta_description } : {}),
          image: p.image_url,
          inLanguage: "vi-VN",
          datePublished: ngay,
          mainEntityOfPage: urlDayDu(duong),
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

      <div className={`mt-8 ${styles.articleContent}`}
        dangerouslySetInnerHTML={{ __html: sanitizeNotFairArticleHtml(p.content_html) }} />

      <aside className="glass mt-10 flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center">
        <BookOpen className="size-6 shrink-0 text-gold" aria-hidden />
        <p className="flex-1 text-fg-muted">Muốn hiểu <b className="text-fg">chính bạn</b>? Xem con số chủ đạo và các chỉ số thần số học từ ngày sinh — miễn phí, có từng bước tính.</p>
        <Button asChild><Link href="/than-so">Xem của tôi <ArrowRight aria-hidden /></Link></Button>
      </aside>

      <footer className="mt-10 border-t border-line/60 pt-5 text-xs leading-relaxed text-fg-faint">
        <Link href="/blog" className="text-gold hover:underline">← Tất cả bài viết</Link>
      </footer>
    </article>
  );
}
