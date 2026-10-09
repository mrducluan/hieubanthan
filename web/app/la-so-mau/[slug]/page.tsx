// MAU6 — một lá số minh hoạ đọc từng bước. Server Component: HTML đầy đủ cho máy tìm kiếm; phần lá số SVG +
// thuật ngữ bấm được nằm trong client component (vẫn render sẵn ở server). Web chỉ hiển thị dữ liệu engine.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/JsonLd";
import { laSoMau } from "@/lib/kien-thuc";
import { catMoTa, goiLd, ldDuongDan, siteUrl, TEN_SITE, tieuDeSeo, urlDayDu } from "@/lib/seo";
import { DocLaSoMau } from "./DocLaSoMau";

export const revalidate = 21600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params: thamSo }: Props): Promise<Metadata> {
  const params = await thamSo;
  const m = await laSoMau(params.slug);
  if (!m) return { title: "Không tìm thấy", robots: { index: false } };
  const duong = `/la-so-mau/${m.slug}`;
  return {
    title: tieuDeSeo(`Lá số mẫu: ${m.tieu_de}`),
    description: catMoTa(`${m.mo_ta} Đọc từng bước, có giải nghĩa thuật ngữ.`),
    alternates: { canonical: duong },
    openGraph: { type: "article", title: m.tieu_de, description: catMoTa(m.mo_ta), url: duong, locale: "vi_VN", siteName: TEN_SITE,
      images: [`/og?tieu_de=${encodeURIComponent(m.tieu_de)}`] },
    twitter: { card: "summary_large_image", title: m.tieu_de, description: catMoTa(m.mo_ta) },
  };
}

export default async function Page({ params: thamSo }: Props) {
  const params = await thamSo;
  const m = await laSoMau(params.slug);
  if (!m) notFound();
  const duong = `/la-so-mau/${m.slug}`;
  const ld = goiLd(
    {
      "@type": "Article", "@id": `${urlDayDu(duong)}#bai`, headline: m.tieu_de, description: m.mo_ta, inLanguage: "vi-VN",
      mainEntityOfPage: urlDayDu(duong), author: { "@type": "Organization", name: TEN_SITE, url: siteUrl() },
      publisher: { "@id": `${siteUrl()}/#to-chuc` }, isAccessibleForFree: true, creativeWorkStatus: "Draft",
      about: "Tử vi Đẩu Số", articleSection: m.buoc.map((b) => b.tieu_de),
    },
    ldDuongDan([
      { ten: "Trang chủ", duong: "/" }, { ten: "Lá số mẫu", duong: "/la-so-mau" }, { ten: m.tieu_de, duong },
    ]),
  );
  const [nam, thang, ngay] = m.ngay.split("-");
  return (
    <article className="mx-auto max-w-5xl">
      <JsonLd data={ld} />
      <nav aria-label="Đường dẫn" className="text-xs text-fg-faint">
        <Link href="/la-so-mau" className="hover:text-fg">Lá số mẫu</Link> ›
      </nav>
      <header className="mt-3">
        <p className="eyebrow">{m.ten} · {m.gioi_tinh === "nam" ? "Nam" : "Nữ"} · sinh {ngay}/{thang}/{nam} lúc {m.gio}</p>
        <h1 className="mt-1 text-3xl leading-tight sm:text-5xl">{m.tieu_de}</h1>
        <p className="mt-3 max-w-3xl text-lg text-fg-muted">{m.mo_ta}</p>
        <p className="mt-2 text-xs text-fg-faint">
          Nhân vật hư cấu, dùng để minh hoạ. Lời đọc ghép từ kho tri thức Hiểu Bản Thân, độ sáng sao theo Nam phái.
        </p>
      </header>

      <DocLaSoMau duLieu={m} />

      <aside className="glass mt-12 flex flex-col items-start gap-4 rounded-2xl p-6 sm:flex-row sm:items-center" data-testid="cta-la-so">
        <Sparkles className="size-6 shrink-0 text-gold" aria-hidden />
        <p className="flex-1 text-fg-muted">Đã hiểu cách đọc? Lập <b className="text-fg">lá số của chính bạn</b> và đọc theo đúng bảy bước này.</p>
        <Button asChild><Link href="/tu-vi">Xem lá số của bạn <ArrowRight aria-hidden /></Link></Button>
      </aside>
      <p className="mt-8 border-t border-line/60 pt-5 text-xs leading-relaxed text-fg-faint">
        Tham khảo văn hoá và tự suy ngẫm — không phải dự báo, không thay thế tư vấn y tế, pháp lý, tài chính.
      </p>
    </article>
  );
}
