"use client";
// GN — giải nghĩa thuật ngữ bằng ngôn ngữ đời thường (chủ dự án yêu cầu 2026-10-02). Engine trả danh sách
// thuật ngữ có trong đoạn văn (tra từ điển KB, `thuat_ngu`); web chỉ gạch chân đúng các chữ đã khớp và hiện
// lời giải nghĩa — không tự tìm hay tự viết nghĩa.
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ThuatNgu {
  ma: string;
  ten: string;
  han: string | null;
  mo_dun: string;
  de_hieu: string;
  vi_du: string | null;
  khop: string[];
}

function The({ t, children }: { t: ThuatNgu; children: ReactNode }) {
  const [mo, setMo] = useState(false);
  const goc = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!mo) return;
    const dong = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !goc.current?.contains(e.target as Node)) setMo(false);
    };
    document.addEventListener("mousedown", dong);
    document.addEventListener("keydown", dong);
    return () => { document.removeEventListener("mousedown", dong); document.removeEventListener("keydown", dong); };
  }, [mo]);
  return (
    <span ref={goc} className="relative inline">
      <button type="button" aria-expanded={mo} onClick={() => setMo((v) => !v)} data-thuat-ngu={t.ma}
        className="cursor-help rounded-sm underline decoration-gold/60 decoration-dotted decoration-2 underline-offset-[3px] hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold">
        {children}
      </button>
      {mo && (
        <span role="tooltip" className="absolute left-0 top-full z-30 mt-1.5 block w-72 max-w-[80vw] rounded-xl border border-line bg-surface p-3 text-left text-sm font-normal not-italic text-fg shadow-card">
          <span className="block font-semibold text-gold">{t.ten}{t.han && <span className="ml-1.5 font-normal text-fg-faint" style={{ fontFamily: "var(--font-han), serif" }}>{t.han}</span>}</span>
          <span className="mt-1 block leading-relaxed">{t.de_hieu}</span>
          {t.vi_du && <span className="mt-1 block text-fg-muted">Ví dụ: {t.vi_du}</span>}
          <Link href={`/tu-dien#${t.ma}`} className="mt-1.5 block text-xs text-gold underline">Xem trong Từ điển</Link>
        </span>
      )}
    </span>
  );
}

/** Các đoạn văn (tách bởi dòng trống) với thuật ngữ gạch chân — mỗi thuật ngữ chỉ gạch ở lần xuất hiện đầu tiên. */
export function doanCoThuatNgu(van: string, ds: ThuatNgu[] | undefined, lopDoan?: (doan: string) => string): ReactNode[] {
  const doan = van.split("\n\n");
  const theoChu = new Map<string, ThuatNgu>();
  for (const t of ds ?? []) for (const k of t.khop) theoChu.set(k, t);
  if (!theoChu.size) return doan.map((p, i) => <p key={i} className={cn("whitespace-pre-line", lopDoan?.(p))}>{p}</p>);
  const mau = new RegExp(`(?<![\\p{L}\\p{N}])(${[...theoChu.keys()].sort((a, b) => b.length - a.length)
    .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\p{L}\\p{N}])`, "gu");
  const daGach = new Set<string>();
  return doan.map((p, i) => (
    <p key={i} className={cn("whitespace-pre-line", lopDoan?.(p))}>
      {p.split(mau).map((manh, j) => {
        const t = j % 2 === 1 ? theoChu.get(manh) : undefined;
        if (!t || daGach.has(t.ma)) return manh;
        daGach.add(t.ma);
        return <The key={j} t={t}>{manh}</The>;
      })}
    </p>
  ));
}

/** Khung "Giải nghĩa thuật ngữ" cuối câu trả lời / chương. */
export function KhungGiaiNghia({ ds, moSan = false }: { ds: ThuatNgu[] | undefined; moSan?: boolean }) {
  if (!ds?.length) return null;
  return (
    <details open={moSan} className="group rounded-xl border border-line/70 bg-bg/30 px-4 py-2.5 text-sm" data-testid="giai-nghia">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-fg-muted marker:hidden hover:text-fg">
        <BookOpen className="size-4 text-gold" aria-hidden />
        Giải nghĩa thuật ngữ ({ds.length}) <span className="text-xs text-fg-faint group-open:hidden">· bấm để mở</span>
      </summary>
      <dl className="mt-2.5 space-y-2.5">
        {ds.map((t) => (
          <div key={t.ma}>
            <dt className="font-semibold text-fg">
              {t.ten}{t.han && <span className="ml-1.5 font-normal text-fg-faint" style={{ fontFamily: "var(--font-han), serif" }}>{t.han}</span>}
            </dt>
            <dd className="leading-relaxed text-fg-muted">
              {t.de_hieu}{t.vi_du && <> <span className="text-fg-faint">Ví dụ: {t.vi_du}</span></>}
              {" "}<Link href={`/tu-dien#${t.ma}`} className="text-xs text-gold underline">Từ điển</Link>
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
