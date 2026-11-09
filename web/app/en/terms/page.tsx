// QTE — điều khoản tóm tắt bằng tiếng Anh cho bản /en; bản ràng buộc là tiếng Việt (/dieu-khoan, /mien-tru-trach-nhiem).
import type { Metadata } from "next";
import Lien from "@/components/khung/Lien";
import { metaEn } from "@/lib/en/seo";

export const metadata: Metadata = metaEn({ title: "Terms and disclaimer — Hieu Ban Than (English)", description: "Terms of use and disclaimer for the English numerology and tarot pages.", path: "/en/terms", vi: "/dieu-khoan" });

export default function Page() {
  return (
    <article className="prose-vn mx-auto max-w-3xl">
      <h1>Terms and disclaimer — English pages</h1>
      <p className="text-fg-muted">Summary for the English pages. The binding versions are the Vietnamese <Lien href="/dieu-khoan" hrefLang="vi" className="text-gold hover:underline">Terms</Lien> and <Lien href="/mien-tru-trach-nhiem" hrefLang="vi" className="text-gold hover:underline">Disclaimer</Lien>.</p>
      <h2>Nature of the content</h2>
      <p>Numerology and tarot here are cultural and reflective references. Nothing on these pages predicts the future, diagnoses health, or gives financial, legal or medical advice. Where a reading touches health, money or legal matters it says so and points you to a professional.</p>
      <h2>Your responsibility</h2>
      <p>Decisions you make remain yours. If you are in crisis or thinking of harming yourself, please contact local emergency services or a crisis line right away (in the US call or text 988; in the UK call 116 123).</p>
      <h2>Use of the service</h2>
      <ul>
        <li>Personal, non-commercial use. Do not scrape, reverse-engineer or resell the content.</li>
        <li>Readings are for the person asking; the tarot does not read other people.</li>
        <li>The service is provided as is; we may change or withdraw features.</li>
      </ul>
      <p className="text-xs text-fg-faint">Governing law and operator details: as stated in the Vietnamese Terms.</p>
    </article>
  );
}
