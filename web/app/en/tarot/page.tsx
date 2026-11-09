// QTE — Tarot (English): cùng luồng năm bước của /tarot (xáo bằng tay → rút từ quạt 78 lá → lật → đọc), engine phủ KB tiếng Anh.
import type { Metadata } from "next";
import Lien from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { ldDuongDanEn, metaEn } from "@/lib/en/seo";
import { urlDayDu } from "@/lib/seo";
import { TarotEn } from "./TarotEn";

export const metadata: Metadata = metaEn({
  title: "Free tarot reading: draw your own cards, get a straight answer",
  description: "Type a question, shuffle with your own hand, draw from a fan of 78 cards and flip them. The reading opens with the answer — leaning yes, with a condition or not yet — then each position, how the cards support or block each other, timing hints and three things to do. Waite, Golden Dawn and Marseille sources, no predictions.",
  path: "/en/tarot", vi: "/tarot",
});

const HOI_DAP = [
  ["Is the shuffle really random?", "You shuffle by holding the button and moving your finger; the rhythm is hashed in your browser into a seed, and the server shuffles deterministically from it. Only the hash leaves your device. Or let the machine shuffle."],
  ["Which tarot tradition is used?", "Meanings follow Waite’s Pictorial Key (1910) and Mathers (1888), with Golden Dawn elemental dignities (Book T) for how neighbouring cards affect each other, and Marseille reading of numbers and gaze."],
  ["Do reversed cards mean something bad?", "No. A reversed card means the quality is blocked, inward, delayed or overdone — the reading says so and gives a small step to take."],
  ["Can it read another person?", "No. The cards here read the person asking. Ask “what should I do about this” and the spread can answer."],
] as const;

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={ldDuongDanEn([{ ten: "Tarot", duong: "/en/tarot" }])} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: "en", mainEntity: HOI_DAP.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Tarot reading (English)", url: urlDayDu("/en/tarot"), applicationCategory: "LifestyleApplication", inLanguage: "en", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow">Tarot · free</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">Ask a question. Draw your own cards. Get a straight answer.</h1>
        <p className="mt-3 text-lg text-fg-muted">The reading opens with the answer to what you asked — leaning yes, with a condition, or not yet — then why, what to clear first, and three things to do in 72 hours. No fortune-telling, no scores, nobody else’s cards.</p>
      </header>
      <TarotEn />
      <section className="mt-12 max-w-3xl" aria-labelledby="faq">
        <h2 id="faq" className="text-2xl">Questions people ask</h2>
        <dl className="mt-4 space-y-4">{HOI_DAP.map(([q, a]) => <div key={q}><dt className="font-medium text-fg">{q}</dt><dd className="mt-1 text-fg-muted">{a}</dd></div>)}</dl>
        <p className="mt-6 text-sm text-fg-muted">Reference: <Lien href="/en/tarot/cards" className="text-gold hover:underline">meaning of all 78 cards</Lien> (start with <Lien href="/en/tarot/cards/the-fool" className="text-gold hover:underline">The Fool</Lien> or <Lien href="/en/tarot/cards/the-tower" className="text-gold hover:underline">The Tower</Lien>). Want the longer view instead of one question? <Lien href="/en/numerology" className="text-gold hover:underline">Your numbers</Lien>. The Vietnamese tool is at <Lien href="/tarot" hrefLang="vi" className="text-gold hover:underline">/tarot</Lien>.</p>
      </section>
    </div>
  );
}
