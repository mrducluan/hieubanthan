// QTE-1 tuần 5 — mục lục 14 chính tinh (tiếng Anh). Cặp hreflang với /tu-vi/chinh-tinh.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, ldTrangWeb } from "@/lib/seo";
import { metaEn, stars } from "@/lib/en/trang";
import { duongStar } from "@/lib/ngon-ngu";

const DUONG = "/en/zi-wei/stars";
const MO_TA = "The 14 major stars of Zi Wei Dou Shu — from Zi Wei (Emperor) to Po Jun (Breaker): nature, strengths, blind spots and a question for self-reflection.";
export const metadata: Metadata = metaEn({ tieuDe: "The 14 major stars of Zi Wei Dou Shu", moTa: MO_TA, duong: DUONG });
const ngan = (s: string) => s.replace(/ \(.*\)$/, "");

export default async function Page() {
  const d = await stars();
  if (!d || d === "khong_co") throw new Error("engine không phản hồi");
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: "The 14 major stars", tomTat: MO_TA, about: ["Zi Wei Dou Shu"] }),
        ldDuongDan([{ ten: "Home", duong: "/en" }, { ten: "Major stars", duong: DUONG }]),
      )} />
      <p className="eyebrow">Zi Wei Dou Shu library</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">The 14 major stars</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">See which stars sit in your Life Palace with the <Link href="/en/zi-wei-dou-shu-chart" className="text-gold underline">Zi Wei chart</Link>.</p>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2" data-testid="ds-star">
        {d.stars.map((s) => (
          <li key={s.slug}><Link href={duongStar(s.slug)} className="glass flex items-center gap-4 rounded-2xl p-5 hover:border-gold/50">
            <span className="font-serif text-3xl text-gold" aria-hidden>{s.han}</span>
            <span><span className="block font-serif text-xl text-fg">{ngan(s.name)}</span><span className="block text-sm text-fg-muted">{s.element} · {s.nature.split(":")[0]}</span></span>
          </Link></li>
        ))}
      </ul>
    </div>
  );
}
