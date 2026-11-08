// QTE-1 tuần 7 — gieo quẻ Kinh Dịch (tiếng Anh). Cặp hreflang với /kinh-dich.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb } from "@/lib/seo";
import { metaEn } from "@/lib/en/trang";
import { CastHexagram } from "./CastHexagram";

const DUONG = "/en/i-ching";
const MO_TA = "Cast an I Ching hexagram online, free: six lines cast securely, your primary and changing hexagrams with plain-English meaning and advice. Your question never leaves your device.";
export const metadata: Metadata = metaEn({ tieuDe: "I Ching online — cast a hexagram, free", moTa: MO_TA, duong: DUONG });

const HOI_DAP = [
  { hoi: "How does an I Ching reading work?", dap: "Six lines are cast from the bottom up, each yin or yang, some of them changing. They form your primary hexagram; changing lines turn into their opposite and form a second hexagram that shows where the situation is heading." },
  { hoi: "How should I ask?", dap: "Ask one clear question about something you can act on, such as \"What should I keep in mind if I take this job?\" rather than a yes/no question about other people." },
  { hoi: "Do you store my question?", dap: "No. You keep the question in mind; only the request to cast is sent, and nothing is stored." },
];

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: "I Ching online", tomTat: MO_TA, about: ["I Ching", "Book of Changes"] }),
        ldDuongDan([{ ten: "Home", duong: "/en" }, { ten: "I Ching", duong: DUONG }]),
        ldHoiDap(HOI_DAP),
      )} />
      <p className="eyebrow">I Ching · Book of Changes</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Cast an I Ching hexagram</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">A short, plain-English reading of your hexagram and where it is changing — for reflection, not fortune-telling.</p>
      <div className="mt-8"><CastHexagram /></div>
      <section className="mt-14" aria-labelledby="faq">
        <h2 id="faq" className="text-2xl">Frequently asked questions</h2>
        <dl className="mt-4 space-y-4">{HOI_DAP.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      <p className="mt-8 text-sm text-fg-muted">Browse all <Link href="/en/i-ching/hexagrams" className="text-gold underline">64 hexagrams</Link>.</p>
    </div>
  );
}
