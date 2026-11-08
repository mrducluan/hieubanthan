// QTE-1 tuần 3–4 — Terms of use (tiếng Anh) cho phần đang có ở /en. Bản tiếng Việt /dieu-khoan là bản gốc; bản Anh đầy đủ chờ
// luật sư (trước tuần 9). Không "accurate / guaranteed" (ASA, FTC — KE-HOACH-QUOC-TE mục 7).
import type { Metadata } from "next";
import Link from "@/components/khung/Lien";
import { metaEn } from "@/lib/en/trang";

export const metadata: Metadata = metaEn({ tieuDe: "Terms of use", duong: "/en/terms",
  moTa: "Terms of use for Hieuban's English tools: content is for cultural interest and self-reflection, not prediction or professional advice." });

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl space-y-5 text-fg-muted">
      <h1 className="text-4xl text-fg">Terms of use</h1>
      <p className="text-sm text-fg-faint">Effective 8 November 2026. The <Link href="/dieu-khoan" hrefLang="vi" className="text-gold underline">Vietnamese terms</Link> are the governing version; a full English translation is being prepared with legal review.</p>
      <h2 className="text-2xl text-fg">What Hieuban is</h2>
      <p>Hieuban provides tools based on traditional Eastern systems such as BaZi. Calculations follow published classical rules and are shown step by step. Interpretations are offered for cultural interest and self-reflection.</p>
      <h2 className="text-2xl text-fg">What Hieuban is not</h2>
      <p>Nothing on this site is a prediction of future events, and nothing replaces advice from a doctor, lawyer, financial adviser or other professional. Do not make medical, legal, financial or safety decisions based on this content. If you are in crisis, contact local emergency services.</p>
      <h2 className="text-2xl text-fg">Using the site</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>Use the tools for your own personal, non-commercial purposes.</li>
        <li>Do not scrape, copy at scale, reverse-engineer the service or use it to build a competing service.</li>
        <li>Do not use the tools to make decisions about other people, such as hiring.</li>
      </ul>
      <h2 className="text-2xl text-fg">Contact</h2>
      <p>Hieu Ban Co Ltd · <a href="mailto:contact@hieuban.com" className="text-gold underline">contact@hieuban.com</a></p>
    </article>
  );
}
