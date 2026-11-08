// QTE-1 tuần 6 — Kua number calculator + bảng 8 Kua (tiếng Anh). Cặp hreflang với /phong-thuy/huong-hop-tuoi.
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { goiLd, ldDuongDan, ldHoiDap, ldTrangWeb } from "@/lib/seo";
import { kuaTable, metaEn } from "@/lib/en/trang";
import { KuaCalculator } from "./KuaCalculator";

const DUONG = "/en/feng-shui/kua-number";
const MO_TA = "Free Kua number calculator: find your Kua number, East or West group and your four favourable and four unfavourable directions, with what each direction is best used for.";
export const metadata: Metadata = metaEn({ tieuDe: "Kua number calculator — your best Feng Shui directions", moTa: MO_TA, duong: DUONG });

const HOI_DAP = [
  { hoi: "What is a Kua number?", dap: "In Eight Mansions Feng Shui, your Kua number (1–9, never 5) comes from your birth year and sex. It places you in the East or West group and gives you four favourable and four unfavourable directions." },
  { hoi: "Why does my birth date matter, not just the year?", dap: "The Feng Shui year starts at the Start of Spring, around 4 February, not on 1 January or Lunar New Year. If you were born before that date, the previous year is used." },
  { hoi: "How do I use my directions?", dap: "Face your best direction at your desk, point the head of your bed towards a favourable direction, and keep storage or bathrooms in the unfavourable ones. Small changes count; you do not need to rebuild your home." },
];

export default async function Page() {
  const t = await kuaTable();
  const bang = t && t !== "khong_co" ? t.kua : [];
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={goiLd(
        ldTrangWeb({ duong: DUONG, ten: "Kua number calculator", tomTat: MO_TA, about: ["Feng Shui", "Eight Mansions", "Kua number"] }),
        ldDuongDan([{ ten: "Home", duong: "/en" }, { ten: "Kua number", duong: DUONG }]),
        ldHoiDap(HOI_DAP),
      )} />
      <p className="eyebrow">Feng Shui · Eight Mansions</p>
      <h1 className="mt-2 text-4xl sm:text-5xl">Kua number calculator</h1>
      <p className="mt-3 max-w-2xl text-fg-muted">Your Kua number, your group and your eight directions — what each one is best used for at home and at work.</p>
      <div className="mt-8"><KuaCalculator /></div>
      {bang.length > 0 && (
        <section className="mt-14" aria-labelledby="kua-chart">
          <h2 id="kua-chart" className="text-2xl">Kua number chart: best directions</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[28rem] text-left text-sm" data-testid="bang-kua">
              <thead className="text-xs text-fg-faint"><tr><th className="py-2 pr-3">Kua</th><th className="pr-3">Trigram</th><th className="pr-3">Group</th><th>Best directions (in order)</th></tr></thead>
              <tbody>{bang.map((k) => (
                <tr key={k.kua} className="border-t border-line/50"><td className="py-2 pr-3 font-serif text-lg text-gold">{k.kua}</td><td className="pr-3">{k.han} {k.trigram}</td><td className="pr-3 text-fg-muted">{k.group}</td><td className="text-fg-muted">{k.best_directions.join(", ")}</td></tr>
              ))}</tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-fg-faint">Kua 5 does not exist on its own: men take 2, women take 8.</p>
        </section>
      )}
      <section className="mt-14" aria-labelledby="faq">
        <h2 id="faq" className="text-2xl">Frequently asked questions</h2>
        <dl className="mt-4 space-y-4">{HOI_DAP.map((h) => (
          <div key={h.hoi} className="rounded-xl border border-line/70 p-4"><dt className="font-medium text-fg">{h.hoi}</dt><dd className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.dap}</dd></div>
        ))}</dl>
      </section>
    </div>
  );
}
