// QTE — mục lục 12 trang Life Path (tiếng Anh), dữ liệu từ `/v1/thanso/so/{n}` qua engine (KB phủ tiếng Anh).
import type { Metadata } from "next";
import Lien from "@/components/khung/Lien";
import { engineEn } from "@/lib/en/engine";
import { metaEn } from "@/lib/en/seo";

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
      <header className="mb-8"><p className="eyebrow">Numerology reference</p><h1 className="mt-2 font-serif text-4xl">Life Path numbers</h1>
        <p className="mt-3 text-fg-muted">The Life Path comes from your date of birth. Each number below is a set of tendencies to check against yourself — with a shadow side and a counter-question, never a verdict. <Lien href="/en/numerology" className="text-gold hover:underline">Find your own number</Lien>.</p></header>
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
