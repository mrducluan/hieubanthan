// /blog — mục lục bài blog: bài của ban biên tập (CMS) + bài trao đổi SEO từ NotFair, gộp bằng gopBaiBlog
// (bài CMS thắng khi trùng slug; mọi link giữ dạng /blog/{slug}).
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock } from "lucide-react";
import { JsonLd } from "@/components/seo/JsonLd";
import { dsBaiTongHop, duongBlog } from "@/lib/blog";
import { goiLd, ldDuongDan, metaTrang, urlDayDu } from "@/lib/seo";

const MO_TA = "Bài viết về hiểu bản thân, thần số học, Tử vi, Kinh Dịch, Bát tự, phong thuỷ và đời sống — đọc thêm ngoài thư viện kiến thức.";
export const metadata: Metadata = metaTrang({ tieuDe: "Blog", moTa: MO_TA, duong: "/blog" });

const ngayVn = (iso: string | null) => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : null);

export default async function Page() {
  const ds = await dsBaiTongHop();
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        {
          "@type": "Blog", name: "Blog", description: MO_TA, url: urlDayDu("/blog"), inLanguage: "vi-VN",
          blogPost: ds.map((p) => ({ "@type": "BlogPosting", headline: p.tieuDe, url: urlDayDu(duongBlog(p.slug)), ...(p.anh ? { image: p.anh.src } : {}), ...(p.ngay ? { datePublished: p.ngay } : {}) })),
        },
        ldDuongDan([{ ten: "Trang chủ", duong: "/" }, { ten: "Blog", duong: "/blog" }]),
      )} />
      <p className="eyebrow">Blog</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Blog</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">{MO_TA}</p>

      {ds.length === 0 ? (
        <p className="glass mt-8 rounded-2xl p-6 text-fg-muted">Chưa có bài viết. Trong lúc chờ, mời bạn đọc <Link href="/kien-thuc" className="text-gold underline underline-offset-4">thư viện kiến thức</Link>.</p>
      ) : (
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {ds.map((p, i) => (
            <li key={p.slug}>
              <Link href={duongBlog(p.slug)} className="glass group flex h-full flex-col overflow-hidden rounded-2xl transition-colors hover:border-gold/50">
                {p.anh && (p.nguon === "notfair" ? (
                  <Image src={p.anh.src} alt={p.anh.alt} width={p.anh.w} height={p.anh.h} priority={i < 2}
                    sizes="(max-width: 640px) 100vw, 480px" className="aspect-video w-full object-cover" />
                ) : (
                  // Ảnh CMS đã có cỡ webp sẵn (nhỏ/vừa) → thẻ img thường, không qua /_next/image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.anh.src} alt={p.anh.alt} width={p.anh.w} height={p.anh.h} loading={i < 2 ? "eager" : "lazy"}
                    className="aspect-video w-full object-cover" />
                ))}
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="text-xl leading-snug sm:text-2xl">{p.tieuDe}</h2>
                  {p.moTa && <p className="mt-2 line-clamp-3 flex-1 text-sm text-fg-muted">{p.moTa}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-fg-faint">
                    {ngayVn(p.ngay) && <span className="inline-flex items-center gap-1"><CalendarDays className="size-3.5" aria-hidden /><time dateTime={p.ngay ?? undefined}>{ngayVn(p.ngay)}</time></span>}
                    {p.phut ? <span className="inline-flex items-center gap-1"><Clock className="size-3.5" aria-hidden />{p.phut} phút đọc</span> : null}
                    <span className="ml-auto inline-flex items-center gap-1 text-gold">Đọc <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
