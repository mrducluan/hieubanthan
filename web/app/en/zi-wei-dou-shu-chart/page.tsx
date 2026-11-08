// QTE-1 tuần 5 — Zi Wei Dou Shu chart (tiếng Anh). Cặp hreflang với /tu-vi.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb } from "@/lib/seo";
import { metaEn } from "@/lib/en/trang";
import { ZiWeiChart } from "./ZiWeiChart";

const DUONG = "/en/zi-wei-dou-shu-chart";
const MO_TA = "Free Zi Wei Dou Shu (Purple Star Astrology) chart: 12 palaces, 14 major stars with brightness, the Four Transformations and 10-year Major Periods — calculated locally, every star shown.";
export const metadata: Metadata = metaEn({ tieuDe: "Zi Wei Dou Shu chart — Purple Star Astrology, free", moTa: MO_TA, duong: DUONG });

const HOI_DAP = [
  { hoi: "What is Zi Wei Dou Shu?", dap: "Zi Wei Dou Shu (Purple Star Astrology) places stars into 12 palaces — Life, Siblings, Spouse, Children, Wealth, Health, Travel, Friends, Career, Property, Fortune and Parents — from your lunar birth date and two-hour birth period." },
  { hoi: "Why does my birthplace matter?", dap: "The chart uses the local birth hour. We work out the time zone and daylight saving time at your birthplace so the right two-hour period is used." },
  { hoi: "Why might my chart differ from other sites?", dap: "Schools differ on star brightness and some secondary stars, and Chinese and Vietnamese lunar calendars occasionally differ by a day. We use the Vietnamese lunar calendar and Southern-school brightness, and say so on the chart." },
  { hoi: "Is this a prediction?", dap: "No. Zi Wei Dou Shu is a traditional framework for self-reflection, not a forecast, and it does not replace professional advice." },
];

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: "Zi Wei Dou Shu chart", tomTat: MO_TA, about: ["Zi Wei Dou Shu", "Purple Star Astrology"] }),
        ldDuongDan([{ ten: "Home", duong: "/en" }, { ten: "Zi Wei Dou Shu chart", duong: DUONG }]),
        ldHoiDap(HOI_DAP),
      )} />
      <p className="eyebrow">Zi Wei Dou Shu · Purple Star Astrology</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Zi Wei Dou Shu chart</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">Your 12 palaces, 14 major stars, the Four Transformations and 10-year Major Periods. Time zone and daylight saving worked out for your birthplace.</p>
      <div className="mt-8"><ZiWeiChart /></div>
      <section className="mt-14" aria-labelledby="faq">
        <h2 id="faq" className="text-2xl">Frequently asked questions</h2>
        <dl className="mt-4 space-y-4">{HOI_DAP.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
      <p className="mt-8 text-sm text-fg-muted">The meaning of each major star: <Link href="/en/zi-wei/stars" className="text-gold underline">the 14 major stars</Link>.</p>
    </div>
  );
}
