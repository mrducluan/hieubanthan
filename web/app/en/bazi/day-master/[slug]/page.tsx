// QTE-1 tuần 3–4 — một Day Master (tiếng Anh). Nội dung từ KB tiếng Anh (nháp máy, chờ người bản xứ duyệt) qua engine.
// Cặp hreflang với /bat-tu/nhat-chu/nhat-chu-{can}.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, ldTrangWeb } from "@/lib/seo";
import { dayMaster, metaEn } from "@/lib/en/trang";
import { duongDayMaster } from "@/lib/ngon-ngu";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata(p: P): Promise<Metadata> {
  const d = await dayMaster((await p.params).slug);
  if (!d || d === "khong_co") return {};
  return metaEn({ tieuDe: `${d.name} Day Master (${d.han}) in BaZi — nature, strengths, blind spots`,
    moTa: `${d.name} (${d.han}), the ${d.yin_yang.toLowerCase()} ${d.element.toLowerCase()} Day Master, is ${d.image}: ${d.nature}. Strengths, blind spots and a question for self-reflection.`,
    duong: duongDayMaster(d.slug) });
}

export default async function Page(p: P) {
  const d = await dayMaster((await p.params).slug);
  if (d === "khong_co") notFound();
  if (!d) throw new Error("engine không phản hồi");
  const duong = duongDayMaster(d.slug);
  const tomTat = `${d.name} (${d.han}) is the ${d.yin_yang.toLowerCase()} ${d.element.toLowerCase()} Day Master — ${d.image}. People with this Day Master tend to be ${d.nature}.`;
  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong, ten: `${d.name} Day Master`, tomTat, about: ["BaZi", "Day Master", `${d.element} element`] }),
        ldDuongDan([{ ten: "Home", duong: "/en" }, { ten: "Day Masters", duong: "/en/bazi/day-master" }, { ten: d.name, duong }]),
      )} />
      <nav aria-label="Breadcrumb" className="text-xs text-fg-faint"><Link href="/en/bazi/day-master" className="hover:text-fg">Day Masters</Link> ›</nav>
      <p className="eyebrow mt-4">{d.yin_yang} {d.element} · Heavenly Stem {d.pinyin}</p>
      <h1 className="mt-2 text-4xl sm:text-5xl"><span className="text-gold">{d.han}</span> {d.name} Day Master</h1>
      <section aria-label="Quick answer" className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">Quick answer</p>
        <p className="mt-2 leading-relaxed text-fg">{tomTat}</p>
      </section>
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-line/70 p-4"><dt className="text-sm text-fg-faint">Image</dt><dd className="mt-1 text-fg">{d.image}</dd></div>
        <div className="rounded-xl border border-line/70 p-4"><dt className="text-sm text-fg-faint">Nature</dt><dd className="mt-1 text-fg">{d.nature}</dd></div>
        <div className="rounded-xl border border-line/70 p-4"><dt className="text-sm text-fg-faint">Strengths</dt><dd className="mt-1 text-fg">{d.strengths}</dd></div>
        <div className="rounded-xl border border-line/70 p-4"><dt className="text-sm text-fg-faint">Watch out for</dt><dd className="mt-1 text-fg">{d.watch_out}</dd></div>
      </dl>
      <p className="mt-8 font-serif text-xl italic text-fg">“{d.question}”</p>
      <p className="mt-8 text-sm text-fg-muted">Not sure of your Day Master? <Link href="/en/bazi-calculator" className="text-gold underline">Calculate your Four Pillars</Link> — free, every step shown.</p>
      <p className="mt-6 text-xs text-fg-faint">Written by the Hieuban editorial team from classical BaZi texts; awaiting review by a native-speaking BaZi practitioner. For self-reflection, not prediction.</p>
    </article>
  );
}
