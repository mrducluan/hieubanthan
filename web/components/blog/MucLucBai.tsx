"use client";
// Mục lục bài đọc (blog CMS + bài trao đổi NotFair) — tham khảo cách đọc của blog kỹ thuật hiện đại: cột phải DÍNH khi
// cuộn, mục đang đọc sáng lên (scroll-spy), thanh "đang đọc x%" theo vị trí trong thân bài, vạch vàng trượt theo mục.
// Điện thoại / máy tính bảng (`bien="gon"`): THANH DÍNH ngay dưới thanh đầu trang (như blog kỹ thuật hiện đại) — tên mục
// đang đọc + dải vạch từng mục + % đã đọc; chạm → bảng mục lục thả xuống. Chỉ đọc DOM — không gọi mạng, không lưu gì.
// Tôn trọng prefers-reduced-motion: cuộn tức thì, không chuyển động vạch.
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, ChevronDown, ListTree } from "lucide-react";
import type { MucLuc } from "@/lib/muc-luc";
import { cn } from "@/lib/utils";

const MOC_DAU = 112;   // px từ mép trên: tiêu đề vượt qua mốc này = "đang đọc" (dưới thanh điều hướng)
/** Điện thoại: thanh đầu trang 64px + thanh mục lục dính ~48px → cuộn tới tiêu đề chừa chỗ này (khỏi bị che). */
const CHUA_GON = 124;
/** Điện thoại: tiêu đề vừa lọt xuống dưới hai thanh (≤ 150px) là đang đọc mục đó. */
const MOC_GON = 150;

function giamChuyenDong(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/** Theo dõi cuộn: mục đang đọc + % tiến độ trong thân bài `thanId`. Dùng rAF để mỗi khung hình tính một lần. */
function useTheoDoiDoc(muc: MucLuc[], thanId: string, moc = MOC_DAU) {
  const [hoatDong, setHoatDong] = useState<string | null>(muc[0]?.id ?? null);
  const [tienDo, setTienDo] = useState(0);
  const [chuaToi, setChuaToi] = useState(true);   // chưa cuộn tới tiêu đề mục đầu tiên
  useEffect(() => {
    let khung = 0;
    const tinh = () => {
      khung = 0;
      let dang: string | null = null;
      for (const m of muc) {
        const el = document.getElementById(m.id);
        if (el && el.getBoundingClientRect().top <= moc) dang = m.id;
      }
      setHoatDong(dang ?? muc[0]?.id ?? null);
      setChuaToi(dang === null);
      const than = document.getElementById(thanId);
      if (than) {
        const r = than.getBoundingClientRect();
        const dau = r.top + window.scrollY - moc;
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
  }, [muc, thanId, moc]);
  return { hoatDong, tienDo, chuaToi };
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

function toiMuc(e: React.MouseEvent<HTMLAnchorElement>, id: string, chua?: number) {
  const el = document.getElementById(id);
  if (!el) return;            // không có phần tử → để trình duyệt tự theo href
  e.preventDefault();
  const hanh = giamChuyenDong() ? "auto" : "smooth";
  if (chua) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - chua, behavior: hanh });
  else el.scrollIntoView({ behavior: hanh, block: "start" });
  history.replaceState(null, "", `#${id}`);
}

/** Dải vạch: mỗi mục một vạch, đã đọc tới đâu sáng tới đó. Quá nhiều mục → một thanh liền theo %. */
function DaiVach({ muc, viTri, tienDo, className }: { muc: MucLuc[]; viTri: number; tienDo: number; className?: string }) {
  if (muc.length > 16) {
    return (
      <div className={cn("h-1 overflow-hidden rounded-full bg-line/80", className)} aria-hidden>
        <div className="h-full rounded-full bg-gold transition-[width] duration-150 motion-reduce:transition-none" style={{ width: `${tienDo}%` }} />
      </div>
    );
  }
  return (
    <div className={cn("flex gap-0.5", className)} aria-hidden>
      {muc.map((m, i) => (
        <span key={m.id} className={cn("h-1 min-w-1 flex-1 rounded-full transition-colors duration-300 motion-reduce:transition-none",
          i < viTri ? "bg-gold/70" : i === viTri ? "bg-gold shadow-[0_0_6px_rgb(var(--gold)/0.7)]" : "bg-line/80")} />
      ))}
    </div>
  );
}

/** Thanh mục lục dính cho màn hình nhỏ: đặt trong cột bài (cột dài bằng bài → dính suốt bài), ngay dưới thanh đầu trang. */
function ThanhMucLucGon({ muc, tieuDe, hoatDong, tienDo, chuaToi: dauMuc, phut }: {
  muc: MucLuc[]; tieuDe: string; hoatDong: string | null; tienDo: number; chuaToi: boolean; phut?: number | null;
}) {
  const [mo, setMo] = useState(false);
  const [dinh, setDinh] = useState(false);
  const goc = useRef<HTMLDivElement>(null);
  const bang = useRef<HTMLOListElement>(null);
  const viTri = Math.max(0, muc.findIndex((m) => m.id === hoatDong));
  // Chưa cuộn tới mục đầu tiên → thanh hiện "Mục lục bài viết" thay vì tên mục.
  const ten = dauMuc ? "Mục lục bài viết" : muc[viTri]?.text ?? tieuDe;
  const conPhut = phut && tienDo < 100 ? Math.max(1, Math.round(phut * (100 - tienDo) / 100)) : null;

  // Đã dính chưa (để đổi nền đậm + bo góc): đo vị trí so với mốc 64px của thanh đầu trang.
  useEffect(() => {
    let khung = 0;
    const tinh = () => { khung = 0; const el = goc.current; if (el) setDinh(el.getBoundingClientRect().top <= 65); };
    const len = () => { if (!khung) khung = requestAnimationFrame(tinh); };
    tinh();
    window.addEventListener("scroll", len, { passive: true });
    return () => { window.removeEventListener("scroll", len); if (khung) cancelAnimationFrame(khung); };
  }, []);

  // Mở bảng: giữ mục đang đọc trong tầm nhìn; Esc / chạm ngoài để đóng.
  useEffect(() => {
    if (!mo) return;
    // Chỉ cuộn trong bảng (scrollIntoView cuộn cả trang → đổi mục đang đọc).
    const ol = bang.current, a = ol?.querySelector<HTMLElement>("[aria-current=location]");
    if (ol && a) ol.scrollTop = a.offsetTop - ol.clientHeight / 2 + a.offsetHeight / 2;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setMo(false); };
    const ngoai = (e: PointerEvent) => { if (goc.current && !goc.current.contains(e.target as Node)) setMo(false); };
    window.addEventListener("keydown", esc);
    window.addEventListener("pointerdown", ngoai);
    return () => { window.removeEventListener("keydown", esc); window.removeEventListener("pointerdown", ngoai); };
  }, [mo]);

  return (
    <div ref={goc} className="sticky top-16 z-30 -mx-4 mt-6 sm:mx-0 lg:hidden" data-testid="muc-luc-gon" data-mo={mo ? "1" : "0"} data-tien-do={tienDo}>
      <button type="button" onClick={() => setMo((x) => !x)} aria-expanded={mo} aria-controls="muc-luc-gon-bang"
        aria-label={`Mục lục — đang đọc: ${ten}, đã đọc ${tienDo}%`}
        className={cn("relative flex h-12 w-full items-center gap-2.5 border-y px-4 text-left backdrop-blur-lg transition-[background-color,border-color,border-radius] duration-200 sm:rounded-xl sm:border",
          dinh || mo ? "border-line/70 bg-bg/90 shadow-[0_8px_24px_-12px_rgb(0_0_0/0.6)]" : "border-line/50 bg-surface/50")}>
        <ListTree className="size-[1.125rem] shrink-0 text-gold" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium text-fg" data-testid="muc-luc-gon-ten">
          <span key={ten} className="inline animate-[muc-hien_220ms_ease-out] motion-reduce:animate-none">{ten}</span>
        </span>
        <DaiVach muc={muc} viTri={dauMuc ? -1 : viTri} tienDo={tienDo} className="hidden w-[4.5rem] shrink-0 min-[360px]:flex sm:w-28" />
        <span className="w-9 shrink-0 text-right font-mono text-xs tabular-nums text-gold" data-testid="muc-luc-gon-pct">{tienDo}%</span>
        <ChevronDown className={cn("size-4 shrink-0 text-fg-faint transition-transform duration-200 motion-reduce:transition-none", mo && "rotate-180")} aria-hidden />
        {/* Vạch tiến độ mảnh sát mép dưới thanh */}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-px h-0.5 sm:inset-x-3">
          <span className="block h-full bg-gold/90 transition-[width] duration-150 ease-out motion-reduce:transition-none" style={{ width: `${tienDo}%` }} />
        </span>
      </button>

      <div id="muc-luc-gon-bang" role="region" aria-label="Mục lục bài viết" hidden={!mo}
        className="absolute inset-x-0 top-full origin-top border-b border-line/70 bg-bg/95 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.75)] backdrop-blur-xl animate-[muc-mo_180ms_ease-out] motion-reduce:animate-none sm:mt-1.5 sm:rounded-xl sm:border">
        <div className="flex items-center justify-between px-4 pb-1 pt-3 text-xs text-fg-faint">
          <span>{muc.length} mục{conPhut ? ` · còn ~${conPhut} phút` : ""}</span>
          <button type="button" onClick={() => { setMo(false); window.scrollTo({ top: 0, behavior: giamChuyenDong() ? "auto" : "smooth" }); }}
            className="inline-flex min-h-9 items-center gap-1 hover:text-fg">
            <ArrowUp className="size-3.5" aria-hidden /> Lên đầu bài
          </button>
        </div>
        <ol ref={bang} className="relative max-h-[min(60vh,28rem)] overflow-y-auto overscroll-contain px-2 pb-3">
          {muc.map((m, i) => {
            const dang = !dauMuc && hoatDong === m.id;
            return (
              <li key={m.id}>
                <a href={`#${m.id}`} aria-current={dang ? "location" : undefined}
                  onClick={(e) => { toiMuc(e, m.id, CHUA_GON); setMo(false); }}
                  className={cn("flex min-h-11 items-center gap-3 rounded-lg px-2 py-2 leading-snug transition-colors active:bg-surface",
                    m.cap === 3 ? "pl-9 text-[0.875rem] text-fg-faint" : "text-[0.9375rem] text-fg-muted",
                    dang && "bg-gold/10 font-medium text-gold")}>
                  {m.cap !== 3 && (
                    <span aria-hidden className={cn("grid size-5 shrink-0 place-items-center rounded-full border font-mono text-[0.625rem] tabular-nums",
                      dang ? "border-gold bg-gold text-bg" : !dauMuc && i < viTri ? "border-gold/60 text-gold/80" : "border-line text-fg-faint")}>
                      {muc.slice(0, i + 1).filter((x) => x.cap !== 3).length}
                    </span>
                  )}
                  <span className="min-w-0">{m.text}</span>
                </a>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/** Bản này có đang là bản hiện trên màn hình không (cả hai bản cùng gắn, CSS ẩn một bản ở mốc lg = 1024px). */
function useManHinh(bien: "canh" | "gon") {
  const [dung, setDung] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const doi = () => setDung(bien === "canh" ? mq.matches : !mq.matches);
    doi();
    mq.addEventListener("change", doi);
    return () => mq.removeEventListener("change", doi);
  }, [bien]);
  return dung;
}

export function MucLucBai({ muc, thanId, tieuDe, bien = "canh", phut }: {
  muc: MucLuc[]; /** id phần tử bọc thân bài — để tính % đã đọc */ thanId: string; tieuDe: string; bien?: "canh" | "gon";
  /** số phút đọc cả bài → "còn ~N phút" theo % đã đọc */ phut?: number | null;
}) {
  const { hoatDong, tienDo, chuaToi } = useTheoDoiDoc(muc, thanId, bien === "gon" ? MOC_GON : MOC_DAU);
  // #neo theo mục đang đọc ở cả điện thoại (thanh địa chỉ đổi theo) — mỗi bản chỉ chạy ở màn hình của nó.
  const dungManHinh = useManHinh(bien);
  useDongBoNeo(hoatDong, dungManHinh);
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

  if (bien === "gon") return <ThanhMucLucGon muc={muc} tieuDe={tieuDe} hoatDong={hoatDong} tienDo={tienDo} chuaToi={chuaToi} phut={phut} />;

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
