// QTE — tóm tắt chính sách riêng tư bằng tiếng Anh cho phạm vi bản /en (numerology + tarot). Bản đầy đủ có hiệu lực pháp lý là
// bản tiếng Việt (/chinh-sach-rieng-tu); trang này không hứa thêm gì ngoài điều hệ thống đang làm.
import type { Metadata } from "next";
import Lien from "@/components/khung/Lien";
import { ldDuongDanEn, metaEn } from "@/lib/en/seo";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = metaEn({ title: "Privacy — Hieuban (English)", description: "What the English numerology and tarot pages do with your name, date of birth and questions.", path: "/en/privacy", vi: "/chinh-sach-rieng-tu" });

export default function Page() {
  return (
    <article className="prose-vn mx-auto max-w-3xl">
      <JsonLd data={ldDuongDanEn([{ ten: "Privacy", duong: "/en/privacy" }])} />
      <h1>Privacy — English pages</h1>
      <p className="text-fg-muted">This is a plain-language summary for the English numerology and tarot pages. The complete, legally binding policy is the Vietnamese <Lien href="/chinh-sach-rieng-tu" hrefLang="vi" className="text-gold hover:underline">Privacy Policy</Lien>.</p>
      <h2>What we process</h2>
      <ul>
        <li><b>Name and date of birth</b> (numerology): kept in your browser (localStorage) and sent to our calculation server only to compute your numbers. They are not stored on the server with your identity.</li>
        <li><b>Tarot cards you draw and the question you type</b>: sent only to build the reading. The question is not stored and is not returned by the server. Your drawing history is kept only in your browser.</li>
        <li><b>Questions in the question box</b>: answered from a fixed knowledge base. A filtered copy of the question text (no name, no date) may be kept for quality review of the answers.</li>
        <li><b>Questions you type in the BaZi and Zi Wei Dou Shu question boxes</b>: answers are always built by our own calculation server. When the AI question check is switched on (currently off — the start date will be shown here), the question text alone — no name, no birth data, no chart — may be sent to a third-party AI provider (servers in the United States) only to label it for safety and topic, so that a message asking for help is recognised. It is not stored by us and not used to train AI models.</li>
        <li><b>Usage analytics</b> (Google Tag Manager / Analytics, PostHog): page views and anonymous interaction events. You can opt out of Google Analytics via the cookie settings on the Vietnamese site.</li>
      </ul>
      <h2>What we do not do</h2>
      <ul>
        <li>No account is needed; no profile is built on our servers from the English pages.</li>
        <li>We do not sell personal data and do not use your questions to train AI models.</li>
        <li>Tarot and numerology text is assembled from a knowledge base; no AI writes the English readings.</li>
      </ul>
      <h2>Your choices</h2>
      <p>Use the “Clear” button on the numerology page to delete your saved name and date of birth from your browser. Clearing site data in your browser removes the tarot history. Contact: see the Vietnamese <Lien href="/lien-he" hrefLang="vi" className="text-gold hover:underline">contact page</Lien>.</p>
      <p className="text-xs text-fg-faint">Operator and legal basis: as stated in the Vietnamese policy (Vietnam’s Personal Data Protection Law 91/2025/QH15).</p>
    </article>
  );
}
