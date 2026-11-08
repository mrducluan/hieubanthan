// QTE-1 tuần 3–4 — Privacy policy (tiếng Anh) cho phần ĐANG có ở /en (máy tính BaZi). Bản tiếng Việt /chinh-sach-rieng-tu
// là bản gốc; bản Anh đầy đủ chờ luật sư xem trước tuần 9 (KE-HOACH-QUOC-TE mục 7). Mọi câu phải đúng với hệ thống đang chạy.
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { metaEn } from "@/lib/en/trang";

export const metadata: Metadata = metaEn({ tieuDe: "Privacy policy", duong: "/en/privacy",
  moTa: "How Hieuban handles your birth data on the English site: used only to calculate your chart, not stored on our servers, remembered on your device only." });

export default function Page() {
  return (
    <article className="prose-hbt mx-auto max-w-3xl space-y-5 text-fg-muted">
      <h1 className="text-4xl text-fg">Privacy policy</h1>
      <p className="text-sm text-fg-faint">Effective 8 November 2026. This English page covers the tools currently available in English. The <Link href="/chinh-sach-rieng-tu" hrefLang="vi" className="text-gold underline">Vietnamese privacy policy</Link> is the governing version; a full English translation is being prepared with legal review.</p>
      <h2 className="text-2xl text-fg">Who we are</h2>
      <p>Hieuban (hieuban.com) is operated by Hieu Ban Co Ltd, Vietnam. Contact: <a href="mailto:contact@hieuban.com" className="text-gold underline">contact@hieuban.com</a>.</p>
      <h2 className="text-2xl text-fg">What we collect and why</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li><b className="text-fg">Birth date, time, sex at birth and place of birth</b> — sent to our calculation server once, only to calculate your BaZi chart when you press the button. We do not store them on our servers and do not link them to your identity.</li>
        <li><b className="text-fg">On your device</b> — the form remembers what you typed in your browser&apos;s local storage so you can come back. You can clear it at any time by clearing site data in your browser.</li>
        <li><b className="text-fg">Usage statistics</b> — page and event counts (for example, that a chart was calculated) to improve the site, through Google Analytics (uses cookies) and PostHog (no cookies). They never include your birth data. You can block analytics cookies in your browser settings.</li>
      </ul>
      <h2 className="text-2xl text-fg">What we do not do</h2>
      <p>We do not sell your data, do not use your birth data to train AI, and do not send it to advertisers.</p>
      <h2 className="text-2xl text-fg">Where processing happens</h2>
      <p>Our calculation server runs in Singapore; the website is served through a global hosting network. Your data may therefore be processed outside your country, only for the purpose above.</p>
      <h2 className="text-2xl text-fg">Your rights</h2>
      <p>You can ask what we hold about you, ask us to correct or delete it, or withdraw consent, by emailing contact@hieuban.com. Because we do not store birth data on our servers for the English tools, most requests are handled by clearing your browser&apos;s site data.</p>
    </article>
  );
}
