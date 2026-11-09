// QTE — Numerology (English): form trên trang → bài đọc `/v1/thanso/luan-giai` (engine phủ KB tiếng Anh) + hỏi đáp gọn.
import type { Metadata } from "next";
import Lien from "@/components/khung/Lien";
import { JsonLd } from "@/components/seo/JsonLd";
import { metaEn } from "@/lib/en/seo";
import { urlDayDu } from "@/lib/seo";
import { Numerology } from "./Numerology";

export const metadata: Metadata = metaEn({
  title: "Numerology reading: Life Path, Expression, Soul Urge, Personality — free",
  description: "Enter your name and date of birth. Get your four core numbers with their shadow side and a counter-question, a four-sided portrait you tick yourself, your personal year and month, and a question box. Pythagorean tradition, no sign-up.",
  path: "/en/numerology", vi: "/than-so",
});

const HOI_DAP = [
  ["Is this free?", "Yes. Everything on the English numerology page is free and needs no account."],
  ["Which numerology is this?", "Pythagorean numerology in the Balliett → Jordan line (USA, 1905–1965): letters A–Z map to 1–9, master numbers 11, 22 and 33 are kept."],
  ["Why are there two ways to add my Life Path?", "Western books reduce the day, month and year separately before adding; many sites add every digit at once. For some dates the two give different numbers, so you choose and we show both."],
  ["Does it predict anything?", "No. Each number comes with a shadow side and a counter-question so you can test whether it fits you. Personal years are a rhythm to compare with your life, not a forecast."],
] as const;

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", inLanguage: "en", mainEntity: HOI_DAP.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Numerology reading (English)", url: urlDayDu("/en/numerology"), applicationCategory: "LifestyleApplication", inLanguage: "en", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow">Numerology · free</p>
        <h1 className="mt-2 font-serif text-4xl sm:text-5xl">What do your numbers say about you?</h1>
        <p className="mt-3 text-lg text-fg-muted">Type your name and date of birth. In a few seconds you get your four core numbers, where you are strong, where you tend to trip, and what this year leans towards — and you tick what is true.</p>
      </header>
      <Numerology />
      <section className="mt-12 max-w-3xl" aria-labelledby="faq">
        <h2 id="faq" className="text-2xl">Questions people ask</h2>
        <dl className="mt-4 space-y-4">
          {HOI_DAP.map(([q, a]) => <div key={q}><dt className="font-medium text-fg">{q}</dt><dd className="mt-1 text-fg-muted">{a}</dd></div>)}
        </dl>
        <p className="mt-6 text-sm text-fg-muted">Reference: <Lien href="/en/numerology/life-path" className="text-gold hover:underline">meaning of each Life Path number</Lien>. The full Vietnamese tool is at <Lien href="/than-so" hrefLang="vi" className="text-gold hover:underline">/than-so</Lien>.</p>
      </section>
    </div>
  );
}
