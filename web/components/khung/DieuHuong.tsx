"use client";
// Menu đầu trang — mục cha + menu con quản lý ở CMS "Menu đầu trang" (lib/cms.ts menuDauTrangCms); CMS chưa nối / lỗi
// → MENU_DAU_TRANG trong code. Máy tính: thanh trên, mục có menu con mở bảng thả xuống (rê chuột, bấm mũi tên, hoặc
// Tab + Enter; Esc / bấm ra ngoài để đóng). Điện thoại: tab dưới (mục chọn "Hiện ở tab dưới", tối đa 5) + nút "Menu"
// ở góc phải mở toàn bộ menu (kể cả menu con và mục không có ở tab dưới, vd Blog).
// Bốn trung tâm Bản thân · Hợp đôi · Huyền học · Tài khoản là "nhà" dễ nhận ra (docs/THIET-KE-UI.md §5) — mặc định giữ.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, CalendarDays, ChevronDown, Compass, HeartHandshake, Menu, Newspaper, Sparkles, Star, UserRound,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { dangOMuc, mucDangO, MENU_DAU_DU_PHONG, type BieuTuong, type MucMenu } from "@/lib/menu-dau-trang";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Logo } from "./Logo";

const ICON: Record<BieuTuong, LucideIcon> = {
  lap_lanh: Sparkles, trai_tim: HeartHandshake, la_ban: Compass, sach: BookOpen, bao: Newspaper, sao: Star,
  lich: CalendarDays, nguoi: UserRound,
};

function MucCoCon({ m, on, i }: { m: MucMenu; on: boolean; i: number }) {
  // Rê chuột và bấm giữ trạng thái riêng: rê vào (đã mở) rồi bấm mũi tên không làm bảng đóng lại.
  const [re, setRe] = useState(false);
  const [bam, setBam] = useState(false);
  const mo = re || bam;
  const setMo = (v: boolean) => { setRe(v); setBam(v); };
  const goc = useRef<HTMLDivElement>(null);
  const nut = useRef<HTMLButtonElement>(null);
  const path = usePathname();
  useEffect(() => setMo(false), [path]);
  useEffect(() => {
    if (!mo) return;
    const ngoai = (e: PointerEvent) => { if (!goc.current?.contains(e.target as Node)) setMo(false); };
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (goc.current?.contains(document.activeElement)) nut.current?.focus();   // không để con trỏ bàn phím rơi về đầu trang
      setMo(false);
    };
    document.addEventListener("pointerdown", ngoai);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", ngoai); document.removeEventListener("keydown", esc); };
  }, [mo]);
  const id = `menu-con-${i}`;
  return (
    <div ref={goc} className="relative" onMouseEnter={() => setRe(true)} onMouseLeave={() => setRe(false)}
      onBlur={(e) => { if (!goc.current?.contains(e.relatedTarget as Node | null)) setMo(false); }}>
      <div className={cn(
        "flex items-center rounded-full text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2/60 hover:text-fg",
        on && "bg-surface-2 text-gold shadow-[inset_0_0_0_1px_rgb(var(--gold)/0.25)] hover:text-gold",
      )}>
        <Link href={m.href} aria-current={on ? "page" : undefined} className="py-2.5 pl-4 pr-1">{m.ten}</Link>
        <button ref={nut} type="button" aria-expanded={mo} aria-controls={id} aria-label={`Mở menu ${m.ten}`}
          onClick={() => (bam ? setMo(false) : setBam(true))} className="grid min-h-10 place-items-center rounded-full pl-0.5 pr-3">
          <ChevronDown className={cn("size-3.5 transition-transform", mo && "rotate-180")} aria-hidden />
        </button>
      </div>
      {/* pt-2 nối khoảng trống giữa nút và bảng để rê chuột xuống không bị đóng */}
      <div id={id} hidden={!mo} className="absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 pt-2">
        <ul className="rounded-2xl border border-line bg-surface/95 p-2 shadow-card backdrop-blur-lg" data-testid="menu-con">
          {m.con.map((c) => (
            <li key={c.href + c.ten}>
              <Link href={c.href} onClick={() => setMo(false)} className="block rounded-xl px-3 py-2.5 transition-colors hover:bg-surface-2/70 focus-visible:bg-surface-2/70">
                <span className="block text-sm font-medium text-fg">{c.ten}</span>
                {c.mo_ta ? <span className="mt-0.5 block text-xs leading-snug text-fg-muted">{c.mo_ta}</span> : null}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function MenuDiDong({ muc }: { muc: MucMenu[] }) {
  const [mo, setMo] = useState(false);
  const path = usePathname();
  useEffect(() => setMo(false), [path]);
  return (
    <>
      <button type="button" onClick={() => setMo(true)} aria-label="Mở menu" aria-haspopup="dialog" aria-expanded={mo} data-testid="nut-menu"
        className="grid size-11 place-items-center rounded-full text-fg-muted hover:bg-surface-2/60 hover:text-fg md:hidden">
        <Menu className="size-5" aria-hidden />
      </button>
      <Sheet open={mo} onOpenChange={setMo}>
        <SheetContent title="Menu">
          <nav aria-label="Menu đầy đủ" data-testid="menu-di-dong">
            <ul className="space-y-4">
              {muc.map((m) => {
                const Icon = ICON[m.bieu_tuong] ?? Compass;
                return (
                  <li key={m.href + m.ten}>
                    <Link href={m.href} onClick={() => setMo(false)} className={cn("flex min-h-11 items-center gap-3 rounded-xl px-2 font-medium",
                      dangOMuc(path, m) ? "text-gold" : "text-fg")}>
                      <Icon className="size-5" aria-hidden />{m.ten}
                    </Link>
                    {m.con.length ? (
                      <ul className="ml-10 mt-1 grid grid-cols-2 gap-x-3">
                        {m.con.map((c) => (
                          <li key={c.href + c.ten}>
                            <Link href={c.href} onClick={() => setMo(false)} className="flex min-h-11 items-center text-sm text-fg-muted hover:text-fg">{c.ten}</Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

export function ThanhTren({ muc = MENU_DAU_DU_PHONG }: { muc?: MucMenu[] }) {
  const path = usePathname();
  const sang = mucDangO(path, muc);
  return (
    <header data-thanh-dau className="vach-sang sticky top-0 z-40 border-b border-line/50 bg-bg/70 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="group flex min-h-11 items-center gap-2.5" aria-label="Hiểu Bản Thân — trang chủ">
          <Logo className="h-7 w-auto transition-transform duration-500 group-hover:scale-105" />
          <span className="font-serif text-xl tracking-tight">Hiểu Bản Thân</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Điều hướng chính" data-testid="menu-dau-trang">
          {muc.map((m, i) => {
            const on = i === sang;
            return m.con.length ? <MucCoCon key={i} m={m} on={on} i={i} /> : (
              <Link
                key={i}
                href={m.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2.5 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-2/60 hover:text-fg",
                  on && "bg-surface-2 text-gold shadow-[inset_0_0_0_1px_rgb(var(--gold)/0.25)] hover:text-gold",
                )}
              >
                {m.ten}
              </Link>
            );
          })}
        </nav>
        <MenuDiDong muc={muc} />
      </div>
    </header>
  );
}

export function TabDuoi({ muc = MENU_DAU_DU_PHONG }: { muc?: MucMenu[] }) {
  const path = usePathname();
  const tab = muc.filter((m) => m.di_dong).slice(0, 5);
  const sang = mucDangO(path, tab);
  if (!tab.length) return null;
  return (
    <nav
      data-thanh-duoi
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/60 bg-bg/85 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Điều hướng chính"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${Math.max(tab.length, 1)}, minmax(0, 1fr))` }}>
        {tab.map((m, i) => {
          const on = i === sang;
          const Icon = ICON[m.bieu_tuong] ?? Compass;
          return (
            <li key={i}>
              <Link
                href={m.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium text-fg-muted transition-[color,transform] active:scale-95",
                  on && "text-gold before:absolute before:inset-x-6 before:top-0 before:h-0.5 before:rounded-full before:bg-gold before:shadow-[0_0_12px_rgb(var(--gold)/0.8)]",
                )}
              >
                <Icon className={cn("size-5", on && "drop-shadow-[0_0_8px_rgb(var(--gold)/0.6)]")} aria-hidden />
                {m.ten}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
