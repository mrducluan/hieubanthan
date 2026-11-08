// QTE-1 tuần 3–4 — BaZi calculator (tiếng Anh): giới thiệu + công cụ + câu hỏi thường gặp. Cặp hreflang với /bat-tu.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb } from "@/lib/seo";
import { metaEn } from "@/lib/en/trang";
import { BaziCalculator } from "./BaziCalculator";

const DUONG = "/en/bazi-calculator";
const MO_TA = "Free BaZi calculator: enter your birth date, time and place to see your Four Pillars, Day Master, Five Elements balance, Ten Gods and 10-year Luck Pillars — every step shown.";
export const metadata: Metadata = metaEn({ tieuDe: "BaZi calculator — Four Pillars of Destiny, free", moTa: MO_TA, duong: DUONG });

const HOI_DAP = [
  { hoi: "What is BaZi?", dap: "BaZi (\"eight characters\"), also called the Four Pillars of Destiny, writes your birth year, month, day and hour as four pairs of Chinese characters — a Heavenly Stem and an Earthly Branch each. The stem of your day pillar is your Day Master, the starting point for reading the chart." },
  { hoi: "Why do you ask where I was born?", dap: "Month pillars change at the solar terms, which happen at a precise moment. We use your birthplace to work out the time zone and whether daylight saving time was in effect, so a birth close to the start of a month lands in the right pillar." },
  { hoi: "Why do you show two useful elements?", dap: "Classic texts give two main ways to choose the useful element: balancing a strong or weak Day Master, and adjusting for the climate of the birth season. They can disagree. We show both and do not choose for you." },
  { hoi: "Is this a prediction?", dap: "No. BaZi is a traditional framework for self-reflection. It is not a forecast and does not replace medical, legal or financial advice." },
];

export default function Page() {
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: "BaZi calculator", tomTat: MO_TA, about: ["BaZi", "Four Pillars of Destiny"] }),
        ldDuongDan([{ ten: "Home", duong: "/en" }, { ten: "BaZi calculator", duong: DUONG }]),
        ldHoiDap(HOI_DAP),
      )} />
      <p className="eyebrow">BaZi · Four Pillars of Destiny</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">BaZi calculator</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">See your Four Pillars, Day Master and Five Elements balance. We work out the time zone and daylight saving for your birthplace, and show every step.</p>
      <div className="mt-8"><BaziCalculator /></div>
      <section className="mt-14" aria-labelledby="faq">
        <h2 id="faq" className="text-2xl">Frequently asked questions</h2>
        <dl className="mt-4 space-y-4">{HOI_DAP.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      <p className="mt-8 text-sm text-fg-muted">Learn about each Day Master: <Link href="/en/bazi/day-master" className="text-gold underline">the 10 Day Masters</Link>.</p>
    </div>
  );
}
