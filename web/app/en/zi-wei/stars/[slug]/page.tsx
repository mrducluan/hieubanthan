// QTE-1 tuần 5 — một chính tinh Tử vi (tiếng Anh). Nội dung KB tiếng Anh (nháp máy) qua engine. Cặp hreflang với
// /tu-vi/chinh-tinh/sao-{x}.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, ldTrangWeb } from "@/lib/seo";
import { metaEn, star } from "@/lib/en/trang";
import { duongStar } from "@/lib/ngon-ngu";

type P = { params: Promise<{ slug: string }> };
const ngan = (s: string) => s.replace(/ \(.*\)$/, "");

export async function generateMetadata(p: P): Promise<Metadata> {
  const d = await star((await p.params).slug);
  if (!d || d === "khong_co") return {};
  return metaEn({ tieuDe: `${ngan(d.name)} (${d.han}) in Zi Wei Dou Shu — meaning, strengths, blind spots`,
    moTa: `${d.name} (${d.han}), ${d.element}: ${d.nature}. Strengths, blind spots and a question for self-reflection.`, duong: duongStar(d.slug) });
}

export default async function Page(p: P) {
  const d = await star((await p.params).slug);
  if (d === "khong_co") notFound();
  if (!d) throw new Error("engine không phản hồi");
  const duong = duongStar(d.slug);
  const tomTat = `${d.name} (${d.han}, ${d.element}) is ${d.nature.charAt(0).toLowerCase()}${d.nature.slice(1)}.`;
  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong, ten: `${ngan(d.name)} star`, tomTat, about: ["Zi Wei Dou Shu", "Purple Star Astrology"] }),
        ldDuongDan([{ ten: "Home", duong: "/en" }, { ten: "Major stars", duong: "/en/zi-wei/stars" }, { ten: ngan(d.name), duong }]),
      )} />
      <nav aria-label="Breadcrumb" className="text-xs text-fg-faint"><Link href="/en/zi-wei/stars" className="hover:text-fg">Major stars</Link> ›</nav>
      <p className="eyebrow mt-4">Major star · {d.element}</p>
      <h1 className="mt-2 text-4xl sm:text-5xl"><span className="text-gold">{d.han}</span> {ngan(d.name)}</h1>
      <section aria-label="Quick answer" className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">Quick answer</p>
        <p className="mt-2 leading-relaxed text-fg">{tomTat}</p>
      </section>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line/70 p-4"><dt className="text-sm text-fg-faint">Strengths</dt><dd className="mt-1 text-fg">{d.strengths}</dd></div>
        <div className="rounded-xl border border-line/70 p-4"><dt className="text-sm text-fg-faint">Watch out for</dt><dd className="mt-1 text-fg">{d.watch_out}</dd></div>
      </dl>
      <p className="mt-8 font-serif text-xl italic text-fg">“{d.question}”</p>
      <p className="mt-8 text-sm text-fg-muted">Which palace is {ngan(d.name)} in for you? <Link href="/en/zi-wei-dou-shu-chart" className="text-gold underline">See your Zi Wei chart</Link>.</p>
      <p className="mt-6 text-xs text-fg-faint">Written by the Hieuban editorial team from classical Zi Wei Dou Shu texts; awaiting review by a native-speaking practitioner. For self-reflection, not prediction.</p>
    </article>
  );
}
