"use client";
// Mục lục bài đọc (blog CMS + bài trao đổi NotFair) — tham khảo cách đọc của blog kỹ thuật hiện đại: cột phải DÍNH khi
// cuộn, mục đang đọc sáng lên (scroll-spy), thanh "đang đọc x%" theo vị trí trong thân bài, vạch vàng trượt theo mục.
// Điện thoại (`bien="gon"`): hộp mục lục gập + thanh tiến độ mảnh sát mép trên. Chỉ đọc DOM — không gọi mạng, không lưu gì.
// Tôn trọng prefers-reduced-motion: cuộn tức thì, không chuyển động vạch.
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ListTree } from "lucide-react";
import type { MucLuc } from "@/lib/muc-luc";
import { cn } from "@/lib/utils";

const MOC_DAU = 112;   // px từ mép trên: tiêu đề vượt qua mốc này = "đang đọc" (dưới thanh điều hướng)

function giamChuyenDong(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/** Theo dõi cuộn: mục đang đọc + % tiến độ trong thân bài `thanId`. Dùng rAF để mỗi khung hình tính một lần. */
function useTheoDoiDoc(muc: MucLuc[], thanId: string) {
  const [hoatDong, setHoatDong] = useState<string | null>(muc[0]?.id ?? null);
  const [tienDo, setTienDo] = useState(0);
  useEffect(() => {
    let khung = 0;
    const tinh = () => {
      khung = 0;
      let dang: string | null = null;
      for (const m of muc) {
        const el = document.getElementById(m.id);
        if (el && el.getBoundingClientRect().top <= MOC_DAU) dang = m.id;
      }
      setHoatDong(dang ?? muc[0]?.id ?? null);
      const than = document.getElementById(thanId);
      if (than) {
        const r = than.getBoundingClientRect();
        const dau = r.top + window.scrollY - MOC_DAU;
        const cuoi = r.bottom + window.scrollY - window.innerHeight;
        const pct = cuoi <= dau ? (window.scrollY >= dau ? 100 : 0) : ((window.scrollY - dau) / (cuoi - dau)) * 100;
        setTienDo(Math.max(0, Math.min(100, Math.round(pct))));
      }
    };
    const len = () => { if (!khung) khung = requestAnimationFrame(tinh); };
    tinh();
    window.addEventListener("scroll", len, { passive: true });
    window.addEventListener("resize", len);
    return () => { window.removeEventListener("scroll", len); window.removeEventListener("resize", len); if (khung) cancelAnimationFrame(khung); };
  }, [muc, thanId]);
  return { hoatDong, tienDo };
}

/** Cập nhật #neo trên thanh địa chỉ theo mục đang đọc (replaceState — không thêm lịch sử), như blog kỹ thuật hiện đại:
 *  sao chép link là trỏ đúng đoạn đang đọc. Chỉ khi người đọc đã cuộn (tránh đổi URL lúc vừa mở trang). */
function useDongBoNeo(hoatDong: string | null, bat: boolean) {
  const daCuon = useRef(false);
  useEffect(() => {
    if (!bat) return;
    const danhDau = () => { daCuon.current = true; };
    window.addEventListener("scroll", danhDau, { passive: true, once: true });
    return () => window.removeEventListener("scroll", danhDau);
  }, [bat]);
  useEffect(() => {
    if (!bat || !hoatDong || !daCuon.current) return;
    if (window.location.hash !== `#${hoatDong}`) history.replaceState(null, "", `#${hoatDong}`);
  }, [hoatDong, bat]);
}

/** Phím J / K: nhảy mục sau / trước (bỏ qua khi đang gõ trong ô nhập). */
function usePhimNhay(muc: MucLuc[], hoatDong: string | null, bat: boolean) {
  useEffect(() => {
    if (!bat || muc.length === 0) return;
    const xuLy = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key !== "j" && e.key !== "k") return;
      const i = muc.findIndex((m) => m.id === hoatDong);
      const toi = muc[Math.max(0, Math.min(muc.length - 1, i + (e.key === "j" ? 1 : -1)))];
      const el = toi && document.getElementById(toi.id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: giamChuyenDong() ? "auto" : "smooth", block: "start" });
    };
    window.addEventListener("keydown", xuLy);
    return () => window.removeEventListener("keydown", xuLy);
  }, [muc, hoatDong, bat]);
}

function toiMuc(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
  const el = document.getElementById(id);
  if (!el) return;            // không có phần tử → để trình duyệt tự theo href
  e.preventDefault();
  el.scrollIntoView({ behavior: giamChuyenDong() ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", `#${id}`);
}

export function MucLucBai({ muc, thanId, tieuDe, bien = "canh", phut }: {
  muc: MucLuc[]; /** id phần tử bọc thân bài — để tính % đã đọc */ thanId: string; tieuDe: string; bien?: "canh" | "gon";
  /** số phút đọc cả bài → "còn ~N phút" theo % đã đọc */ phut?: number | null;
}) {
  const { hoatDong, tienDo } = useTheoDoiDoc(muc, thanId);
  useDongBoNeo(hoatDong, bien === "canh");
  usePhimNhay(muc, hoatDong, bien === "canh");
  const viTri = Math.max(0, muc.findIndex((m) => m.id === hoatDong));
  const khung = useRef<HTMLDivElement>(null);
  const dong = useRef(new Map<string, HTMLLIElement>());
  const [vach, setVach] = useState<{ top: number; height: number } | null>(null);
  const datDong = useCallback((id: string) => (el: HTMLLIElement | null) => { if (el) dong.current.set(id, el); else dong.current.delete(id); }, []);

  // Vạch vàng trượt tới mục đang đọc + giữ mục đó trong tầm nhìn của khung mục lục (chỉ cuộn khung, không cuộn trang).
  useEffect(() => {
    if (bien !== "canh" || !hoatDong) return;
    const li = dong.current.get(hoatDong), k = khung.current;
    if (!li || !k) return;
    setVach({ top: li.offsetTop, height: li.offsetHeight });
    const tren = li.offsetTop - k.scrollTop, duoi = tren + li.offsetHeight;
    if (tren < 0 || duoi > k.clientHeight) k.scrollTo({ top: li.offsetTop - k.clientHeight / 2 + li.offsetHeight / 2, behavior: giamChuyenDong() ? "auto" : "smooth" });
  }, [hoatDong, bien]);

  if (muc.length === 0) return null;

  if (bien === "gon") {
    return (
      <>
        <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-0.5 bg-transparent lg:hidden">
          <div className="h-full bg-gold/90 transition-[width] duration-150 ease-out motion-reduce:transition-none" style={{ width: `${tienDo}%` }} />
        </div>
        <details className="group rounded-2xl border border-line/70 bg-surface/40 p-4 text-sm" data-testid="muc-luc-gon">
          <summary className="flex cursor-pointer list-none items-center gap-2 font-medium text-fg marker:hidden [&::-webkit-details-marker]:hidden">
            <ListTree className="size-4 text-gold" aria-hidden />
            Mục lục bài viết <span className="text-fg-faint">· {muc.length} mục</span>
            <span className="ml-auto text-xs text-fg-faint transition-transform group-open:rotate-180" aria-hidden>⌄</span>
          </summary>
          <ol className="mt-3 space-y-1 border-l border-line/70">
            {muc.map((m) => (
              <li key={m.id}>
                <a href={`#${m.id}`} onClick={(e) => toiMuc(e, m.id)} aria-current={hoatDong === m.id ? "location" : undefined}
                  className={cn("-ml-px block border-l-2 border-transparent py-1 pl-3 leading-snug text-fg-muted hover:text-fg",
                    m.cap === 3 && "pl-6 text-[0.8125rem] text-fg-faint", hoatDong === m.id && "border-gold text-gold")}>
                  {m.text}
                </a>
              </li>
            ))}
          </ol>
        </details>
      </>
    );
  }

  return (
    <nav aria-label="Mục lục" className="text-sm" data-testid="muc-luc" data-tien-do={tienDo}>
      <div className="rounded-2xl border border-line/70 bg-surface/50 p-4" data-testid="dang-doc">
        <div className="flex items-center justify-between">
          <span className="eyebrow">Đang đọc</span>
          <span className="font-mono text-xs tabular-nums text-gold">
            {phut && tienDo < 100 ? <span className="mr-2 font-sans text-fg-faint" data-testid="con-phut">còn ~{Math.max(1, Math.round(phut * (100 - tienDo) / 100))} phút</span> : null}
            <span data-testid="tien-do">{tienDo}%</span>
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-line/70" role="progressbar" aria-label="Đã đọc" aria-valuemin={0} aria-valuemax={100} aria-valuenow={tienDo}>
          <div className="h-full rounded-full bg-gold transition-[width] duration-150 ease-out motion-reduce:transition-none" style={{ width: `${tienDo}%` }} />
        </div>
        <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-fg-muted">{tieuDe}</p>
      </div>

      <p className="eyebrow mt-6 px-1">Mục lục bài viết</p>
      <div ref={khung} className="relative mt-2.5 max-h-[calc(100vh-19rem)] overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [scrollbar-color:rgb(var(--line))_transparent]">
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-px bg-line/70" />
        {vach && (
          <span aria-hidden className="pointer-events-none absolute left-0 w-0.5 rounded-full bg-gold shadow-[0_0_12px_rgb(var(--gold)/0.6)] transition-[top,height] duration-300 ease-out motion-reduce:transition-none"
            style={{ top: vach.top, height: vach.height }} />
        )}
        <ol>
          {muc.map((m) => (
            <li key={m.id} ref={datDong(m.id)}>
              <a href={`#${m.id}`} onClick={(e) => toiMuc(e, m.id)} aria-current={hoatDong === m.id ? "location" : undefined}
                className={cn("block py-1.5 pl-4 leading-snug text-fg-faint transition-colors duration-200 hover:text-fg",
                  m.cap === 3 && "pl-7 text-[0.8125rem]", hoatDong === m.id && "font-medium text-gold")}>
                {m.text}
              </a>
            </li>
          ))}
        </ol>
      </div>
      {/* Dải vạch: mỗi mục một vạch, đã đọc tới đâu sáng tới đó (nhìn một cái biết còn bao nhiêu phần). */}
      <div className="mt-4 flex items-center gap-3 px-1">
        <div className="flex flex-1 gap-0.5" aria-hidden>
          {muc.map((m, i) => (
            <span key={m.id} className={cn("h-1 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none",
              i < viTri ? "bg-gold/70" : i === viTri ? "bg-gold" : "bg-line/80")} />
          ))}
        </div>
        <span className="hidden text-[0.65rem] tracking-wide text-fg-faint xl:inline" title="Phím J: mục sau · K: mục trước">
          <kbd className="rounded border border-line px-1 font-mono">J</kbd> / <kbd className="rounded border border-line px-1 font-mono">K</kbd> nhảy mục
        </span>
      </div>
      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: giamChuyenDong() ? "auto" : "smooth" })}
        className={cn("mt-4 inline-flex items-center gap-1.5 px-1 text-xs text-fg-faint transition-opacity hover:text-fg", tienDo < 8 && "pointer-events-none opacity-0")}
        aria-hidden={tienDo < 8} tabIndex={tienDo < 8 ? -1 : 0}>
        <ArrowUp className="size-3.5" aria-hidden /> Lên đầu bài
      </button>
    </nav>
  );
}
