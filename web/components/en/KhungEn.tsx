// QTE-1 tuần 3–4 — đầu trang + chân trang cho các trang tiếng Anh (/en/…). Gọn, không thanh mảng / tab dưới / hộp Sao của
// bản Việt (các phần đó chưa dịch). Link "Tiếng Việt" luôn có để người dùng tự chọn — không tự chuyển theo IP.
import Link from "@/components/khung/Lien";
import { Logo } from "@/components/khung/Logo";

const MENU: [string, string][] = [
  ["/en/bazi-calculator", "BaZi calculator"],
  ["/en/bazi/day-master", "Day Masters"],
];

export function DauTrangEn() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/85 backdrop-blur" data-testid="dau-trang-en">
      <div className="container flex min-h-16 items-center justify-between gap-4">
        <Link href="/en" className="flex items-center gap-2 font-serif text-lg text-fg" aria-label="Hieuban — home">
          <Logo className="h-7 w-auto" /> <span>Hieuban</span>
        </Link>
        <nav aria-label="Main" className="flex items-center gap-1 text-sm">
          {MENU.map(([href, ten]) => (
            <Link key={href} href={href} className="hidden min-h-10 items-center rounded-full px-3 text-fg-muted hover:text-fg sm:inline-flex">{ten}</Link>
          ))}
          <Link href="/" hrefLang="vi" lang="vi" className="inline-flex min-h-10 items-center rounded-full border border-line/70 px-3 text-fg-muted hover:border-gold/50 hover:text-fg">Tiếng Việt</Link>
        </nav>
      </div>
      <nav aria-label="Main (mobile)" className="container flex gap-1 pb-2 text-sm sm:hidden">
        {MENU.map(([href, ten]) => <Link key={href} href={href} className="inline-flex min-h-10 items-center rounded-full border border-line/60 px-3 text-fg-muted">{ten}</Link>)}
      </nav>
    </header>
  );
}

export function ChanTrangEn() {
  return (
    <footer className="border-t border-line/60 py-10 text-sm text-fg-muted" data-testid="chan-trang-en">
      <div className="container grid gap-6 sm:grid-cols-3">
        <div>
          <p className="font-serif text-lg text-fg">Hieuban</p>
          <p className="mt-2 max-w-xs">Eastern self-reflection tools — BaZi, Zi Wei Dou Shu, Feng Shui, I Ching — with every calculation step shown. For reflection, not prediction.</p>
        </div>
        <ul className="space-y-2">
          {MENU.map(([href, ten]) => <li key={href}><Link href={href} className="hover:text-fg">{ten}</Link></li>)}
        </ul>
        <ul className="space-y-2">
          <li><Link href="/en/privacy" className="hover:text-fg">Privacy policy</Link></li>
          <li><Link href="/en/terms" className="hover:text-fg">Terms of use</Link></li>
          <li><Link href="/" hrefLang="vi" lang="vi" className="hover:text-fg">Tiếng Việt</Link></li>
          <li><a href="mailto:contact@hieuban.com" className="hover:text-fg">contact@hieuban.com</a></li>
        </ul>
      </div>
      <p className="container mt-8 text-xs text-fg-faint">© {new Date().getFullYear()} Hieu Ban Co Ltd. Content is for cultural reference and self-reflection; it does not replace medical, legal or financial advice.</p>
    </footer>
  );
}
