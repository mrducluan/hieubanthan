// QTE — mục lục 78 lá (tiếng Anh) từ `/v1/tarot/bo-bai` với header ngôn ngữ; hình lá vẽ SVG như bản Việt.
import type { Metadata } from "next";
import Lien from "@/components/khung/Lien";
import { MatTruoc } from "@/components/tarot/LaBai";
import { engineEn, slugLa } from "@/lib/en/engine";
import { ldDuongDanEn, metaEn } from "@/lib/en/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { urlDayDu } from "@/lib/seo";
import type { BoBai } from "@/lib/tarot-chung";

export const metadata: Metadata = metaEn({
  title: "78 tarot card meanings: upright, reversed, love, work, money",
  description: "The 22 Major Arcana and 56 Minor Arcana (Wands, Cups, Swords, Pentacles) with plain-English meanings from Waite 1910 and Mathers 1888, keywords, and one thing to do.",
  path: "/en/tarot/cards", vi: "/tarot/la-bai",
});
export const revalidate = 21600;
const NHOM: [string, string, (x: BoBai["la"][string]) => boolean][] = [
  ["Major Arcana", "The 22 big chapters — forces and stages beyond daily control.", (x) => x.loai === "an_chinh"],
  ["Wands", "Will, work, passion, beginnings.", (x) => x.bo === "gay"], ["Cups", "Feelings, relationships, intuition.", (x) => x.bo === "coc"],
  ["Swords", "Thinking, words, decisions, conflict.", (x) => x.bo === "kiem"], ["Pentacles", "Money, body, home, skill.", (x) => x.bo === "tien"],
];

export default async function Page() {
  const r = await engineEn<BoBai>("/v1/tarot/bo-bai");
  if (!r.ok) throw new Error("The card list is unavailable right now.");
  const la = r.data.thu_tu.map((id) => r.data.la[id]!).filter(Boolean);
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={ldDuongDanEn([{ ten: "Tarot", duong: "/en/tarot" }, { ten: "78 cards", duong: "/en/tarot/cards" }])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "All 78 tarot cards", inLanguage: "en", url: urlDayDu("/en/tarot/cards"),
        mainEntity: { "@type": "ItemList", numberOfItems: la.length, itemListElement: la.slice(0, 78).map((x, i) => ({ "@type": "ListItem", position: i + 1, name: x.en, url: urlDayDu(`/en/tarot/cards/${slugLa(x.en)}`) })) } }} />
      <header className="mb-8"><p className="eyebrow">Tarot reference</p><h1 className="mt-2 font-serif text-4xl">All 78 tarot cards</h1>
        <p className="mt-3 max-w-3xl text-fg-muted">Each card has its upright and reversed meaning, how it reads in love, work, money and daily rhythm, and one small thing to do — written in plain English from public-domain sources (Waite 1910, Mathers 1888, Book T). <Lien href="/en/tarot" className="text-gold hover:underline">Draw your own spread</Lien>.</p></header>
      {NHOM.map(([ten, mo, loc]) => (
        <section key={ten} className="mb-10"><h2 className="text-2xl">{ten}</h2><p className="mt-1 text-sm text-fg-muted">{mo}</p>
          <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7">
            {la.filter(loc).map((x) => (
              <li key={x.id}><Lien href={`/en/tarot/cards/${slugLa(x.en)}`} className="group block" data-testid="the-la-en">
                <div className="overflow-hidden rounded-[9px] shadow-card transition-transform group-hover:-translate-y-1"><MatTruoc la={x} /></div>
                <span className="mt-1 block text-center text-xs text-fg-muted group-hover:text-fg">{x.en}</span></Lien></li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
