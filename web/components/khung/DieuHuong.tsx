"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, HeartHandshake, Sparkles, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";

// Bốn trung tâm cố định (bài học CHANI: người dùng cần "nhà" dễ nhận ra) — docs/THIET-KE-UI.md §5.
export const MUC = [
  { href: "/ban-than", ten: "Bản thân", Icon: Sparkles, khop: ["/ban-than", "/than-so"] },
  { href: "/hop-doi", ten: "Hợp đôi", Icon: HeartHandshake, khop: ["/hop-doi"] },
  { href: "/kham-pha", ten: "Khám phá", Icon: Compass, khop: ["/kham-pha", "/tu-vi", "/kinh-dich", "/bat-tu", "/phong-thuy"] },
  { href: "/tai-khoan", ten: "Tài khoản", Icon: UserRound, khop: ["/tai-khoan", "/dang-nhap"] },
] as const;

function dangO(path: string, khop: readonly string[]) {
  return khop.some((k) => path === k || path.startsWith(k + "/"));
}

export function ThanhTren() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line/50 bg-bg/70 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Hiểu Bản Thân — trang chủ">
          <Logo />
          <span className="font-serif text-xl tracking-tight">Hiểu Bản Thân</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính">
          {MUC.map(({ href, ten, khop }) => (
            <Link
              key={href}
              href={href}
              aria-current={dangO(path, khop) ? "page" : undefined}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium text-fg-muted transition-colors hover:text-fg",
                dangO(path, khop) && "bg-surface-2 text-gold",
              )}
            >
              {ten}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function TabDuoi() {
  const path = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/60 bg-bg/85 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Điều hướng chính"
    >
      <ul className="grid grid-cols-4">
        {MUC.map(({ href, ten, Icon, khop }) => {
          const on = dangO(path, khop);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-medium text-fg-faint transition-colors",
                  on && "text-gold",
                )}
              >
                <Icon className={cn("size-5", on && "drop-shadow-[0_0_8px_rgb(var(--gold)/0.6)]")} aria-hidden />
                {ten}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
