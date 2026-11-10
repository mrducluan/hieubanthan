// QTE — khung trang tiếng Anh (/en): thanh trên gọn (Numerology · Tarot · Cards · Tiếng Việt), chân trang với câu ranh giới
// và link chính sách. Không CMS, không Sao, không menu Huyền học — bản Anh hiện chỉ có hai mảng.
import type { ReactNode } from "react";
import Lien from "@/components/khung/Lien";
import { Logo } from "@/components/khung/Logo";
import { NutDoiNgonNgu } from "@/components/khung/NutDoiNgonNgu";
import { banVietCuaTrang } from "@/lib/duong-en";

const MENU = [
  { href: "/en/numerology", ten: "Numerology" },
  { href: "/en/tarot", ten: "Tarot" },
  { href: "/en/tarot/cards", ten: "78 cards" },
  { href: "/en/numerology/life-path", ten: "Life Path numbers" },
];

export function KhungEn({ children, duong = "/en" }: { children: ReactNode; duong?: string }) {
  const banViet = banVietCuaTrang(duong);   // EN-ALL: nút đổi ngôn ngữ về TRANG TƯƠNG ĐƯƠNG
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur">
        <nav className="container flex h-16 items-center justify-between gap-4" aria-label="Main">
          <Lien href="/en" className="flex items-center gap-2 text-fg" aria-label="Hieuban — home (English)">
            <Logo className="h-8 w-auto" />
            <span className="hidden font-serif text-lg sm:inline">Hieuban</span>
          </Lien>
          <ul className="flex items-center gap-1 text-sm">
            {MENU.map((m) => <li key={m.href}><Lien href={m.href} className="rounded-full px-3 py-1.5 text-fg-muted hover:bg-bg-2 hover:text-fg">{m.ten}</Lien></li>)}
            <li><NutDoiNgonNgu href={banViet} sang="vi" className="rounded-full border border-line px-3 py-1.5 text-fg-muted hover:text-fg">Tiếng Việt</NutDoiNgonNgu></li>
          </ul>
        </nav>
      </header>
      <main id="noi-dung" className="container pb-12 pt-6 md:pb-16 md:pt-10" lang="en">{children}</main>
      <footer className="border-t border-line/60 py-8 text-sm text-fg-muted">
        <div className="container grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <p className="font-serif text-fg">Hieuban</p>
            <p className="mt-1 max-w-2xl">Numerology and tarot readings in plain English, built from sourced books (Pythagorean numerology; Waite 1910, Book T, Mathers 1888). A reference for self-reflection — not a prediction, and not a substitute for a doctor, a lawyer or your own decision.</p>
            <p className="mt-1 max-w-2xl">Names and dates of birth are used only to calculate; readings are not stored with your identity. The English edition covers numerology and tarot; the full site is in Vietnamese.</p>
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 sm:flex-col">
            <li><Lien href="/en/privacy" className="hover:text-fg">Privacy</Lien></li>
            <li><Lien href="/en/terms" className="hover:text-fg">Terms</Lien></li>
            <li><Lien href="/" hrefLang="vi" className="hover:text-fg">Vietnamese site</Lien></li>
          </ul>
        </div>
      </footer>
    </>
  );
}
