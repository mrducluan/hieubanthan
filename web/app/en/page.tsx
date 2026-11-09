// QTE — trang vào bản tiếng Anh: hai mảng đã có (Numerology, Tarot), nói rõ phạm vi và ranh giới; link sang bản Việt đầy đủ.
import type { Metadata } from "next";
import Lien from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { metaEn } from "@/lib/en/seo";
import { urlDayDu } from "@/lib/seo";

export const metadata: Metadata = metaEn({
  title: "Free numerology and tarot readings in plain English — Hieu Ban Than",
  description: "Your Life Path, Expression, Soul Urge and Personality numbers with a portrait you can check against yourself, plus a tarot spread that answers the question you actually asked. No predictions, no sign-up.",
  path: "/en", vi: "/",
});

const MANG = [
  { href: "/en/numerology", ten: "Numerology", mo_ta: "Four core numbers from your name and date of birth, a four-sided portrait with strengths and blind spots you tick yourself, your personal year and month, and a question box.", nut: "Get my numbers" },
  { href: "/en/tarot", ten: "Tarot", mo_ta: "Type a question, shuffle, draw your own cards and flip them. The reading opens with the answer to your question — leaning yes, with a condition or not yet — then each position, how the cards flow and what to do in 72 hours.", nut: "Draw a spread" },
];

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: "Hieu Ban Than — English", url: urlDayDu("/en"), inLanguage: "en", isPartOf: { "@type": "WebSite", name: "Hieu Ban Than", url: urlDayDu("/") } }} />
      <header className="mb-10 max-w-3xl">
        <p className="eyebrow">Hieu Ban Than · English edition</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Know yourself through numbers and cards — without being told your future.</h1>
        <p className="mt-4 text-lg text-fg-muted">Every reading here is built from sourced books and shows its reasoning. You decide what rings true. Nothing is a prediction, and nothing replaces a doctor, a lawyer or your own judgement.</p>
      </header>
      <div className="grid gap-5 sm:grid-cols-2">
        {MANG.map((m) => (
          <section key={m.href} className="glass rounded-2xl p-6">
            <h2 className="text-2xl">{m.ten}</h2>
            <p className="mt-2 text-fg-muted">{m.mo_ta}</p>
            <Lien href={m.href} className="mt-4 inline-flex rounded-full bg-gold px-5 py-2 text-sm font-medium text-bg hover:opacity-90" data-testid={`vao-${m.ten.toLowerCase()}`}>{m.nut}</Lien>
          </section>
        ))}
      </div>
      <section className="mt-10 grid gap-4 text-sm text-fg-muted sm:grid-cols-3">
        <div><h3 className="text-fg">Shows its work</h3><p className="mt-1">Each box has a “Why we say this” with the source: Waite 1910, Book T, Mathers 1888 for tarot; the Pythagorean tradition for numerology.</p></div>
        <div><h3 className="text-fg">You keep the data</h3><p className="mt-1">Your name and date of birth stay in your browser and are sent only to compute. Readings are not stored with your identity.</p></div>
        <div><h3 className="text-fg">More in Vietnamese</h3><p className="mt-1">The full site — Vietnamese astrology, Four Pillars, I Ching, feng shui, face reading — is available in <Lien href="/" hrefLang="vi" className="text-gold hover:underline">Vietnamese</Lien>.</p></div>
      </section>
      <p className="mt-8 text-xs text-fg-faint">Browse the reference pages: <Lien href="/en/numerology/life-path" className="text-gold hover:underline">Life Path numbers 1–33</Lien> · <Lien href="/en/tarot/cards" className="text-gold hover:underline">all 78 tarot cards</Lien>.</p>
    </div>
  );
}
