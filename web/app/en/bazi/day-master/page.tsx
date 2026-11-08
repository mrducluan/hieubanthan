// QTE-1 tuần 3–4 — mục lục 10 Day Master (tiếng Anh). Cặp hreflang với /bat-tu/nhat-chu.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, ldTrangWeb } from "@/lib/seo";
import { dayMasters, metaEn } from "@/lib/en/trang";
import { duongDayMaster } from "@/lib/ngon-ngu";

const DUONG = "/en/bazi/day-master";
const MO_TA = "The 10 BaZi Day Masters — Jia Wood to Gui Water: the image, nature, strengths and blind spots of each Heavenly Stem, with a question for self-reflection.";
export const metadata: Metadata = metaEn({ tieuDe: "The 10 BaZi Day Masters explained", moTa: MO_TA, duong: DUONG });

export default async function Page() {
  const d = await dayMasters();
  if (!d || d === "khong_co") throw new Error("engine không phản hồi");
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: "The 10 BaZi Day Masters", tomTat: MO_TA, about: ["BaZi", "Day Master"] }),
        ldDuongDan([{ ten: "Home", duong: "/en" }, { ten: "Day Masters", duong: DUONG }]),
      )} />
      <p className="eyebrow">BaZi library</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">The 10 Day Masters</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">Your Day Master is the Heavenly Stem of your day pillar. Find yours with the <Link href="/en/bazi-calculator" className="text-gold underline">BaZi calculator</Link>.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2" data-testid="ds-day-master">
        {d.day_masters.map((m) => (
          <li key={m.slug}><Link href={duongDayMaster(m.slug)} className="glass flex items-center gap-4 rounded-2xl p-5 hover:border-gold/50">
            <span className="font-serif text-4xl text-gold" aria-hidden>{m.han}</span>
            <span><span className="block font-serif text-xl text-fg">{m.name}</span><span className="block text-sm text-fg-muted">{m.yin_yang} {m.element} · {m.image}</span></span>
          </Link></li>
        ))}
      </ul>
    </div>
  );
}
