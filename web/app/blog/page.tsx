// /blog — mục lục bài blog: bài của ban biên tập (CMS) + bài trao đổi SEO từ NotFair, gộp bằng gopBaiBlog
// (bài CMS thắng khi trùng slug; mọi link giữ dạng /blog/{slug}). Chip chuyên mục dẫn tới /blog/chuyen-muc/{slug}.
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { ChipChuyenMuc, chuyenMucCoBai, LuoiBai } from "@/components/blog/LuoiBai";
import { dsBaiTongHop, duongBlog } from "@/lib/blog";
import { goiLd, ldDuongDan, metaTrang, urlDayDu } from "@/lib/seo";

const MO_TA = "Bài viết về hiểu bản thân, thần số học, Tử vi, Kinh Dịch, Bát tự, phong thuỷ và đời sống — đọc thêm ngoài thư viện kiến thức.";
const META = metaTrang({ tieuDe: "Blog", moTa: MO_TA, duong: "/blog" });
export const metadata: Metadata = { ...META, alternates: { ...META.alternates, types: { "application/rss+xml": "/blog/rss.xml" } } };

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
      <ChipChuyenMuc ds={chuyenMucCoBai(ds)} />

      {ds.length === 0 ? (
        <p className="glass mt-8 rounded-2xl p-6 text-fg-muted">Chưa có bài viết. Trong lúc chờ, mời bạn đọc <Link href="/kien-thuc" className="text-gold underline underline-offset-4">thư viện kiến thức</Link>.</p>
      ) : <LuoiBai ds={ds} />}
    </div>
  );
}
