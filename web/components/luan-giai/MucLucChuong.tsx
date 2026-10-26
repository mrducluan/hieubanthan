"use client";
// Trục 1 "Bài đọc dài dễ đi" (2026-10-26) — mục lục DÍNH của báo cáo Luận giải toàn bộ (chương gập), cùng phong cách mục
// lục blog (components/blog/MucLucBai, BLOG-4/4b):
// · Điện thoại / máy tính bảng (< lg): thanh mảnh dính ngay dưới thanh đầu trang — "Chương x/N" + tên chương đang đọc +
//   dải vạch từng chương; chạm → danh sách chương thả xuống (chương khoá có ổ khoá, trỏ tới phần mời mở).
// · Máy tính (≥ lg): cột bên dính — danh sách chương, chương đang đọc sáng lên, chấm màu mức.
// Chỉ đọc DOM để biết chương đang đọc — không gọi mạng, không lưu gì. Tôn trọng prefers-reduced-motion.
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ListTree, LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Muc } from "./kieu";

export interface MucChuong { ma: string; tieu_de: string; khoa: boolean; muc?: Muc | null; mo: boolean }

/** Điện thoại: tiêu đề chương lọt xuống dưới thanh đầu trang (64px) + thanh mục lục (48px) là đang đọc chương đó. */
const MOC_GON = 150;
const MOC_CANH = 120;

export function giamChuyenDong(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/** Chương đang đọc = chương cuối cùng có đầu mục đã vượt mốc (chỉ xét chương có trên trang — chương khoá không có). */
export function useChuongDangDoc(ds: MucChuong[]): string | null {
  const [dang, setDang] = useState<string | null>(null);
  const khoa = ds.map((c) => c.ma).join(",");
  useEffect(() => {
    let khung = 0;
    const tinh = () => {
      khung = 0;
      const moc = window.matchMedia("(min-width: 1024px)").matches ? MOC_CANH : MOC_GON;
      let d: string | null = null;
      for (const c of ds) {
        const el = document.getElementById(`lg-${c.ma}`);
        if (el && el.getBoundingClientRect().top <= moc) d = c.ma;
      }
      setDang(d);
    };
    const len = () => { if (!khung) khung = requestAnimationFrame(tinh); };
    tinh();
    window.addEventListener("scroll", len, { passive: true });
    window.addEventListener("resize", len);
    return () => { window.removeEventListener("scroll", len); window.removeEventListener("resize", len); if (khung) cancelAnimationFrame(khung); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ theo danh sách mã chương
  }, [khoa]);
  return dang;
}

function DaiVachChuong({ ds, viTri, className }: { ds: MucChuong[]; viTri: number; className?: string }) {
  return (
    <div className={cn("flex gap-0.5", className)} aria-hidden>
      {ds.map((c, i) => (
        <span key={c.ma} className={cn("h-1 min-w-1 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none",
          c.khoa ? "bg-line/40" : i < viTri ? "bg-gold/70" : i === viTri ? "bg-gold shadow-[0_0_6px_rgb(var(--gold)/0.7)]" : "bg-line/80")} />
      ))}
    </div>
  );
}

function DongChuong({ c, i, dang, onChon, gon }: { c: MucChuong; i: number; dang: boolean; onChon: (ma: string) => void; gon: boolean }) {
  return (
    <a href={c.khoa ? "#lg-khoa" : `#lg-${c.ma}`} aria-current={dang ? "location" : undefined}
      onClick={(e) => { if (!c.khoa) { e.preventDefault(); onChon(c.ma); } }}
      className={cn("flex items-center gap-2.5 rounded-lg leading-snug transition-colors",
        gon ? "min-h-11 px-2 py-2 text-[0.9375rem] active:bg-surface" : "px-2 py-1.5 text-[0.8125rem] hover:text-fg",
        dang ? "bg-gold/10 font-medium text-gold" : "text-fg-muted")}>
      <span aria-hidden className={cn("grid size-5 shrink-0 place-items-center rounded-full border font-mono text-[0.625rem] tabular-nums",
        dang ? "border-gold bg-gold text-bg" : c.mo ? "border-gold/60 text-gold/80" : "border-line text-fg-faint")}>{i + 1}</span>
      <span className="min-w-0 flex-1">{c.tieu_de}</span>
      {c.khoa ? <LockKeyhole className="size-3.5 shrink-0 text-gold" aria-label="đang khoá" />
        : c.muc ? <span data-muc={c.muc} className="cham-muc size-2 shrink-0 rounded-full" aria-hidden /> : null}
    </a>
  );
}

/** Thanh dính cho màn hình nhỏ. Đặt làm con đầu của khối chứa các chương → dính suốt phần chương. */
export function ThanhChuongGon({ ds, dang, onChon }: { ds: MucChuong[]; dang: string | null; onChon: (ma: string) => void }) {
  const [mo, setMo] = useState(false);
  const goc = useRef<HTMLDivElement>(null);
  const bang = useRef<HTMLOListElement>(null);
  const viTri = Math.max(0, ds.findIndex((c) => c.ma === dang));
  const hien = ds[viTri];
  useEffect(() => {
    if (!mo) return;
    const ol = bang.current, a = ol?.querySelector<HTMLElement>("[aria-current=location]");
    if (ol && a) ol.scrollTop = a.offsetTop - ol.clientHeight / 2 + a.offsetHeight / 2;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setMo(false); };
    const ngoai = (e: PointerEvent) => { if (goc.current && !goc.current.contains(e.target as Node)) setMo(false); };
    window.addEventListener("keydown", esc);
    window.addEventListener("pointerdown", ngoai);
    return () => { window.removeEventListener("keydown", esc); window.removeEventListener("pointerdown", ngoai); };
  }, [mo]);
  return (
    <div ref={goc} className="sticky top-16 z-20 -mx-5 mb-6 sm:-mx-8 lg:hidden print:hidden" data-testid="lg-thanh-chuong" data-mo={mo ? "1" : "0"}>
      <button type="button" onClick={() => setMo((x) => !x)} aria-expanded={mo} aria-controls="lg-thanh-chuong-bang"
        aria-label={`Mục lục chương — đang đọc chương ${viTri + 1}/${ds.length}: ${hien?.tieu_de ?? ""}`}
        className="relative flex h-12 w-full items-center gap-2.5 border-y border-line/70 bg-bg/90 px-4 text-left shadow-[0_8px_24px_-12px_rgb(0_0_0/0.6)] backdrop-blur-lg sm:px-6">
        <ListTree className="size-[1.125rem] shrink-0 text-gold" aria-hidden />
        <span className="shrink-0 font-mono text-xs tabular-nums text-gold" data-testid="lg-chuong-x">Chương {viTri + 1}/{ds.length}</span>
        <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium text-fg">
          <span key={hien?.ma} className="inline animate-[muc-hien_220ms_ease-out] motion-reduce:animate-none">{hien?.tieu_de}</span>
        </span>
        <DaiVachChuong ds={ds} viTri={viTri} className="hidden w-16 shrink-0 min-[400px]:flex sm:w-28" />
        <ChevronDown className={cn("size-4 shrink-0 text-fg-faint transition-transform duration-200 motion-reduce:transition-none", mo && "rotate-180")} aria-hidden />
      </button>
      <div id="lg-thanh-chuong-bang" role="region" aria-label="Danh sách chương" hidden={!mo}
        className="absolute inset-x-0 top-full origin-top border-b border-line/70 bg-bg/95 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.75)] backdrop-blur-xl animate-[muc-mo_180ms_ease-out] motion-reduce:animate-none">
        <ol ref={bang} className="max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain px-2 py-2">
          {ds.map((c, i) => (
            <li key={c.ma}><DongChuong c={c} i={i} dang={c.ma === dang} gon onChon={(ma) => { setMo(false); onChon(ma); }} /></li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Cột bên dính cho máy tính. */
export function CotChuong({ ds, dang, onChon, moTatCa }: {
  ds: MucChuong[]; dang: string | null; onChon: (ma: string) => void; moTatCa: () => void;
}) {
  const viTri = Math.max(0, ds.findIndex((c) => c.ma === dang));
  const daMo = ds.filter((c) => c.mo).length, coThe = ds.filter((c) => !c.khoa).length;
  return (
    <nav aria-label="Các chương" className="sticky top-24 hidden self-start text-sm lg:block print:hidden" data-testid="lg-cot-chuong">
      <div className="rounded-2xl border border-line/70 bg-surface/50 p-3">
        <div className="flex items-center justify-between px-2">
          <span className="eyebrow">Chương {viTri + 1}/{ds.length}</span>
          {daMo < coThe && (
            <button type="button" onClick={moTatCa} className="text-xs text-fg-faint underline-offset-4 hover:text-fg hover:underline">Mở hết</button>
          )}
        </div>
        <DaiVachChuong ds={ds} viTri={viTri} className="mx-2 mt-2" />
        <ol className="mt-2 max-h-[calc(100vh-10rem)] overflow-y-auto overscroll-contain">
          {ds.map((c, i) => <li key={c.ma}><DongChuong c={c} i={i} dang={c.ma === dang} gon={false} onChon={onChon} /></li>)}
        </ol>
      </div>
    </nav>
  );
}
