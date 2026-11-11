// QTE — trang vào bản tiếng Anh: hai mảng đã có (Numerology, Tarot), nói rõ phạm vi và ranh giới; link sang bản Việt đầy đủ.
import type { Metadata } from "next";
import Lien from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { metaEn } from "@/lib/en/seo";
import { urlDayDu } from "@/lib/seo";

export const metadata: Metadata = metaEn({
  title: "Free numerology and tarot readings in plain English — Hieuban",
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
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebPage", name: "Hieuban — English", url: urlDayDu("/en"), inLanguage: "en", isPartOf: { "@type": "WebSite", name: "Hieuban", url: urlDayDu("/") } }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: "en", mainEntity: [
        ["Is any of this a prediction?", "No. Numbers describe tendencies to test against your own life; cards describe the situation you asked about and suggest a next step. Neither tells you what will happen on a date."],
        ["Why is the Vietnamese site so much bigger?", "Hieuban started in Vietnam, where Vietnamese astrology, Four Pillars, I Ching and feng shui are everyday references. The English edition opens with numerology and tarot; the rest stays in Vietnamese for now."],
        ["Does it cost anything?", "Everything on the English pages is free and needs no account. Your name and date of birth stay in your browser."],
      ].map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
      <header className="mb-10 max-w-3xl">
        <p className="eyebrow">Hieuban · English edition</p>
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
      <section className="mt-12 max-w-3xl" aria-labelledby="cach-lam">
        <h2 id="cach-lam" className="text-2xl">How a reading is built</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-fg-muted">
          <li><b className="text-fg">Calculate.</b> Your numbers, or the cards you drew, are computed by one deterministic engine. The same input always gives the same result, and every step is shown under “How this was calculated”.</li>
          <li><b className="text-fg">Look it up.</b> Each number and card has a written meaning with its source: the Pythagorean tradition for numerology; Waite’s <i>Pictorial Key</i> (1910), the Golden Dawn’s <i>Book T</i> and Mathers (1888) for tarot. Nothing is invented on the spot.</li>
          <li><b className="text-fg">Assemble.</b> Fixed rules decide which boxes appear and in what order — for tarot, how neighbouring cards strengthen or block each other and which card answers your question. No language model writes the reading.</li>
          <li><b className="text-fg">You check.</b> Every portrait comes with strengths and blind spots you tick yourself, and a “Resonates with me / Not quite me” button. That feedback only ever carries a code, never your name or date of birth.</li>
        </ol>
      </section>
      <section className="mt-10 max-w-3xl" aria-labelledby="ai-nen-dung">
        <h2 id="ai-nen-dung" className="text-2xl">Who this is for</h2>
        <p className="mt-3 text-fg-muted">People who like a structured way to think about themselves or a decision — and who want to see the reasoning, not just a verdict. If you are in crisis, these pages will point you to real help instead of a reading. If your question is medical, legal or financial, the reading will say so and send you to a professional.</p>
        <dl className="mt-4 space-y-3 text-fg-muted">
          <div><dt className="font-medium text-fg">Is any of this a prediction?</dt><dd className="mt-1">No. Numbers describe tendencies to test against your own life; cards describe the situation you asked about and suggest a next step. Neither tells you what will happen on a date.</dd></div>
          <div><dt className="font-medium text-fg">Why is the Vietnamese site so much bigger?</dt><dd className="mt-1">Hieuban started in Vietnam, where Vietnamese astrology (Tử vi), Four Pillars, I Ching and feng shui are everyday references. The English edition opens with the two systems that translate cleanly; the rest stays in Vietnamese for now.</dd></div>
          <div><dt className="font-medium text-fg">Does it cost anything?</dt><dd className="mt-1">Everything on the English pages is free and needs no account. Your name and date of birth stay in your browser.</dd></div>
        </dl>
      </section>
      <p className="mt-8 text-xs text-fg-faint">Browse the reference pages: <Lien href="/en/numerology/life-path" className="text-gold hover:underline">Life Path numbers 1–33</Lien> · <Lien href="/en/tarot/cards" className="text-gold hover:underline">all 78 tarot cards</Lien>.</p>
    </div>
  );
}
