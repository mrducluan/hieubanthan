// QTE-1 tuần 7 — một quẻ (tiếng Anh). Lời viết lại đời thường (nháp ban biên tập, không chép bản dịch có bản quyền).
// Cặp hreflang với /kinh-dich/que/{x}.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, ldTrangWeb } from "@/lib/seo";
import { hexagram, metaEn } from "@/lib/en/trang";
import { duongHexagram } from "@/lib/ngon-ngu";

type P = { params: Promise<{ slug: string }> };

export async function generateMetadata(p: P): Promise<Metadata> {
  const h = await hexagram((await p.params).slug);
  if (!h || h === "khong_co") return {};
  return metaEn({ tieuDe: `Hexagram ${h.number} ${h.pinyin} (${h.han}) — ${h.name}: meaning`,
    moTa: `I Ching hexagram ${h.number}, ${h.pinyin} (${h.han}), ${h.name}: ${h.meaning} ${h.advice}`, duong: duongHexagram(h.slug) });
}

export default async function Page(p: P) {
  const h = await hexagram((await p.params).slug);
  if (h === "khong_co") notFound();
  if (!h) throw new Error("engine không phản hồi");
  const duong = duongHexagram(h.slug);
  return (
    <article className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong, ten: `Hexagram ${h.number} ${h.name}`, tomTat: h.meaning, about: ["I Ching", "Book of Changes"] }),
        ldDuongDan([{ ten: "Home", duong: "/en" }, { ten: "64 hexagrams", duong: "/en/i-ching/hexagrams" }, { ten: `${h.number}. ${h.name}`, duong }]),
      )} />
      <nav aria-label="Breadcrumb" className="text-xs text-fg-faint"><Link href="/en/i-ching/hexagrams" className="hover:text-fg">64 hexagrams</Link> ›</nav>
      <p className="eyebrow mt-4">Hexagram {h.number} · {h.pinyin}</p>
      <h1 className="mt-2 text-4xl sm:text-5xl"><span className="text-gold">{h.han}</span> {h.name}</h1>
      <section aria-label="Quick answer" className="mt-6 rounded-2xl border border-gold/30 bg-gold/5 p-5">
        <p className="eyebrow">In plain words</p>
        <p className="mt-2 leading-relaxed text-fg">{h.meaning}</p>
        <p className="mt-2 text-fg-muted">{h.advice}</p>
      </section>
      <p className="mt-8 flex flex-wrap gap-4 text-sm">
        <Link href="/en/i-ching/hexagrams" className="text-gold underline">All 64 hexagrams</Link>
        <Link href="/en/i-ching" className="text-gold underline">Cast your own hexagram</Link>
      </p>
      <p className="mt-6 text-xs text-fg-faint">Plain-English summary by the Hieuban editorial team; awaiting review by a native-speaking I Ching practitioner. For reflection, not fortune-telling.</p>
    </article>
  );
}
