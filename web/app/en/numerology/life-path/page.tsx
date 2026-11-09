// QTE — mục lục 12 trang Life Path (tiếng Anh), dữ liệu từ `/v1/thanso/so/{n}` qua engine (KB phủ tiếng Anh).
import type { Metadata } from "next";
import Lien from "@/components/khung/Lien";
import { engineEn } from "@/lib/en/engine";
import { ldDuongDanEn, metaEn } from "@/lib/en/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { urlDayDu } from "@/lib/seo";

export const metadata: Metadata = metaEn({
  title: "Life Path numbers 1–9, 11, 22, 33: meaning, strengths, blind spots",
  description: "What each Life Path number is often described as in Pythagorean numerology — keywords, shadow side, a counter-question, and how it tends to show up in love, work and money.",
  path: "/en/numerology/life-path", vi: "/than-so/y-nghia-so",
});
export const revalidate = 21600;
const SO = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];

export default async function Page() {
  const ds = await Promise.all(SO.map(async (n) => ({ n, d: await engineEn<{ nghia: { tu_khoa: string } }>(`/v1/thanso/so/${n}`) })));
  return (
    <div className="mx-auto max-w-4xl">
      <JsonLd data={ldDuongDanEn([{ ten: "Numerology", duong: "/en/numerology" }, { ten: "Life Path numbers", duong: "/en/numerology/life-path" }])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "CollectionPage", name: "Life Path numbers", inLanguage: "en", url: urlDayDu("/en/numerology/life-path"),
        mainEntity: { "@type": "ItemList", numberOfItems: SO.length, itemListElement: SO.map((n, i) => ({ "@type": "ListItem", position: i + 1, name: `Life Path ${n}`, url: urlDayDu(`/en/numerology/life-path/${n}`) })) } }} />
      <header className="mb-8"><p className="eyebrow">Numerology reference</p><h1 className="mt-2 font-serif text-4xl">Life Path numbers</h1>
        <p className="mt-3 text-fg-muted">The Life Path comes from your date of birth. Each number below is a set of tendencies to check against yourself — with a shadow side and a counter-question, never a verdict. <Lien href="/en/numerology" className="text-gold hover:underline">Find your own number</Lien>.</p></header>
      <section className="mb-8 grid gap-4 md:grid-cols-2" aria-labelledby="cach-tinh">
        <div className="glass rounded-2xl p-5">
          <h2 id="cach-tinh" className="text-lg">How the Life Path is calculated</h2>
          <p className="mt-2 text-sm text-fg-muted">Add the digits of your date of birth and reduce to one digit, keeping 11, 22 and 33. Two conventions exist and sometimes disagree, so the tool shows both: <b className="text-fg">reduce each part first</b> (day, month, year → add → reduce; the Western book method) or <b className="text-fg">add every digit at once</b>.</p>
          <p className="mt-2 text-sm text-fg-muted">Example, 24 October 1988: 24 → 6, 10 → 1, 1988 → 26 → 8; 6 + 1 + 8 = 15 → <b className="text-fg">6</b>. Adding all digits: 2+4+1+0+1+9+8+8 = 33 → kept as the master number <b className="text-fg">33</b>. Same birthday, two numbers — which is why you choose the convention and we never hide the other.</p>
        </div>
        <div className="glass rounded-2xl p-5">
          <h2 className="text-lg">Master numbers 11, 22, 33</h2>
          <p className="mt-2 text-sm text-fg-muted">Totals of 11, 22 and 33 are not reduced further in the Pythagorean tradition. They carry the themes of 2, 4 and 6 with more voltage — and more strain. Each master-number page also links to its reduced number so you can read both.</p>
          <p className="mt-2 text-sm text-fg-muted">A Life Path is one of four core numbers; Expression, Soul Urge and Personality come from your name. <Lien href="/en/numerology" className="text-gold hover:underline">Calculate all four</Lien>.</p>
        </div>
      </section>
      <h2 className="mb-3 text-2xl">The twelve numbers</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ds.map(({ n, d }) => (
          <li key={n}><Lien href={`/en/numerology/life-path/${n}`} className="glass block rounded-2xl p-4 hover:border-gold/50">
            <span className="font-serif text-3xl text-gold">{n}</span>
            <span className="mt-1 block text-sm text-fg-muted">{d.ok ? d.data.nghia.tu_khoa : `Life Path ${n}`}</span></Lien></li>
        ))}
      </ul>
    </div>
  );
}
