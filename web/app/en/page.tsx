// QTE-1 tuần 3–4 — trang chủ tiếng Anh (/en). Chỉ giới thiệu phần ĐÃ có bản Anh (BaZi); môn khác ghi "coming", không link.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldTrangWeb } from "@/lib/seo";
import { metaEn } from "@/lib/en/trang";

const MO_TA = "Free BaZi (Four Pillars) calculator with every step shown: Day Master, Five Elements balance, Ten Gods and 10-year Luck Pillars. For self-reflection, not prediction.";
export const metadata: Metadata = metaEn({ tieuDe: "Hieuban — Eastern self-reflection tools, every step shown", moTa: MO_TA, duong: "/en" });

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={goiLd(ldTrangWeb({ duong: "/en", ten: "Hieuban", tomTat: MO_TA, about: ["BaZi", "Four Pillars of Destiny"] }))} />
      <p className="eyebrow">Know yourself — the Eastern way</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Eastern self-reflection tools, with every step shown</h1>
      <p className="mt-4 max-w-2xl text-lg text-fg-muted">Hieuban started in Vietnam. Our calculations are deterministic — the same birth data always gives the same chart — and we show how each number is worked out, so you can check it yourself.</p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <Link href="/en/bazi-calculator" className="glass block rounded-2xl p-6 hover:border-gold/50" data-testid="the-bazi-en">
          <p className="eyebrow">BaZi · Four Pillars</p>
          <h2 className="mt-2 text-2xl">BaZi calculator</h2>
          <p className="mt-2 text-sm text-fg-muted">Your Four Pillars, Day Master, Five Elements balance, Ten Gods and Luck Pillars. Time zone and daylight saving worked out for your birthplace.</p>
        </Link>
        <Link href="/en/bazi/day-master" className="glass block rounded-2xl p-6 hover:border-gold/50">
          <p className="eyebrow">Library</p>
          <h2 className="mt-2 text-2xl">The 10 Day Masters</h2>
          <p className="mt-2 text-sm text-fg-muted">What each Heavenly Stem says about your nature, strengths and blind spots.</p>
        </Link>
        <Link href="/en/zi-wei-dou-shu-chart" className="glass block rounded-2xl p-6 hover:border-gold/50">
          <p className="eyebrow">Zi Wei Dou Shu · Purple Star</p>
          <h2 className="mt-2 text-2xl">Zi Wei Dou Shu chart</h2>
          <p className="mt-2 text-sm text-fg-muted">12 palaces, 14 major stars with brightness, the Four Transformations and 10-year Major Periods.</p>
        </Link>
        <Link href="/en/zi-wei/stars" className="glass block rounded-2xl p-6 hover:border-gold/50">
          <p className="eyebrow">Library</p>
          <h2 className="mt-2 text-2xl">The 14 major stars</h2>
          <p className="mt-2 text-sm text-fg-muted">From Zi Wei (Emperor) to Po Jun (Breaker): nature, strengths and blind spots.</p>
        </Link>
      </div>
      <p className="mt-8 text-sm text-fg-faint">Coming next in English: Feng Shui Kua number and Flying Stars, I Ching hexagrams.</p>
    </div>
  );
}
