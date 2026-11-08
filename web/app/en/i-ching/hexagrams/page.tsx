// QTE-1 tuần 7 — mục lục 64 quẻ (tiếng Anh). Cặp hreflang với /kinh-dich/que.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, ldTrangWeb } from "@/lib/seo";
import { hexagrams, metaEn } from "@/lib/en/trang";
import { duongHexagram } from "@/lib/ngon-ngu";

const DUONG = "/en/i-ching/hexagrams";
const MO_TA = "All 64 I Ching hexagrams with their Chinese name, pinyin and plain-English meaning and advice.";
export const metadata: Metadata = metaEn({ tieuDe: "The 64 I Ching hexagrams — meanings in plain English", moTa: MO_TA, duong: DUONG });

export default async function Page() {
  const d = await hexagrams();
  if (!d || d === "khong_co") throw new Error("engine không phản hồi");
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: "The 64 hexagrams", tomTat: MO_TA, about: ["I Ching"] }),
        ldDuongDan([{ ten: "Home", duong: "/en" }, { ten: "I Ching", duong: "/en/i-ching" }, { ten: "64 hexagrams", duong: DUONG }]),
      )} />
      <p className="eyebrow">I Ching library</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">The 64 hexagrams</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">Want your own? <Link href="/en/i-ching" className="text-gold underline">Cast a hexagram</Link>.</p>
      <ul className="mt-8 grid gap-2 sm:grid-cols-2" data-testid="ds-hexagram">
        {d.hexagrams.map((h) => (
          <li key={h.slug}><Link href={duongHexagram(h.slug)} className="flex items-baseline gap-3 rounded-xl border border-line/60 px-4 py-3 hover:border-gold/50">
            <span className="w-7 text-right text-sm text-fg-faint">{h.number}</span><span className="font-serif text-xl text-gold">{h.han}</span>
            <span className="text-fg">{h.pinyin} — {h.name}</span>
          </Link></li>
        ))}
      </ul>
    </div>
  );
}
