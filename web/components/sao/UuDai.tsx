"use client";
// UD-1 — các mảnh hiển thị đợt ưu đãi có hạn (docs/UU-DAI-CO-HAN.md). Chỉ VẼ dữ liệu máy chủ trả (lib/uu-dai.ts):
// giá gạch là giá thường thật, đồng hồ đếm tới hạn chót thật, số suất đếm từ sổ Sao. Hết giờ → tự ẩn và gọi `khiHet`
// để nơi dùng tải lại giá. Chuyển động tắt khi người dùng chọn giảm chuyển động.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronUp, Flame, LockKeyhole, Sparkles, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { conLai, loiHan, loiTietKiem, type UuDai } from "@/lib/uu-dai";

const hai = (n: number) => String(n).padStart(2, "0");

/** Đồng hồ đếm ngược tới hạn chót. Máy chủ + lần vẽ đầu ở trình duyệt hiện ngày hạn (không lệch hydrate), sau đó chạy từng giây. */
export function DemNguoc({ hetLuc, khiHet, className = "" }: { hetLuc: string; khiHet?: () => void; className?: string }) {
  const [c, setC] = useState<ReturnType<typeof conLai> | undefined>(undefined);
  useEffect(() => {
    let xong = false;
    const chay = () => {
      const moi = conLai(hetLuc);
      setC(moi);
      if (!moi && !xong) { xong = true; khiHet?.(); }
    };
    chay();
    const t = setInterval(chay, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- khiHet không cần theo dõi
  }, [hetLuc]);
  if (c === null) return null;
  const o = (so: number, nhan: string) => (
    <span className="inline-flex min-w-9 flex-col items-center rounded-lg bg-bg/70 px-1.5 py-1 leading-none ring-1 ring-gold/30">
      <span className="font-mono text-base font-semibold tabular-nums text-gold">{hai(so)}</span>
      <span className="mt-0.5 text-[10px] uppercase tracking-wide text-fg-faint">{nhan}</span>
    </span>
  );
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} data-testid="ud-dem-nguoc" role="timer" aria-label={`Ưu đãi ${loiHan(hetLuc)}`}>
      <Timer className="size-4 shrink-0 text-gold" aria-hidden />
      {c === undefined ? <span className="text-sm text-fg-muted">{loiHan(hetLuc)}</span> : (
        <span className="inline-flex items-center gap-1" aria-hidden>
          {c.ngay > 0 && o(c.ngay, "ngày")}{o(c.gio, "giờ")}{o(c.phut, "phút")}{o(c.giay, "giây")}
        </span>
      )}
    </span>
  );
}

/** Giá ưu đãi + giá thường gạch đi + dòng tiết kiệm. */
export function GiaUuDai({ u, lon = false }: { u: UuDai; lon?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2" data-testid="ud-gia">
      <span className={`font-serif text-gold ${lon ? "text-3xl" : "text-xl"}`}>{u.gia} Sao</span>
      <s className="text-sm text-fg-faint" aria-label={`Giá thường ${u.gia_goc} Sao`}>{u.gia_goc} Sao</s>
      <span className="ud-nhan rounded-full bg-cinnabar/15 px-2 py-0.5 text-xs font-semibold text-cinnabar">−{u.giam_pt}%</span>
    </span>
  );
}

/** Thanh suất còn lại (chỉ khi đợt có giới hạn suất và đếm được). */
export function ConSuat({ u, className = "" }: { u: UuDai; className?: string }) {
  if (u.con_suat === null || u.tong_suat === null) return null;
  const daDung = u.tong_suat - u.con_suat;
  return (
    <span className={`block ${className}`} data-testid="ud-con-suat">
      <span className="flex items-center gap-1.5 text-xs text-fg-muted">
        <Flame className="size-3.5 shrink-0 text-cinnabar" aria-hidden />
        <span>Còn <b className="text-fg">{u.con_suat}</b>/{u.tong_suat} suất ưu đãi</span>
      </span>
      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-line" aria-hidden>
        <span className="ud-thanh block h-full rounded-full bg-gradient-to-r from-gold to-cinnabar" style={{ width: `${Math.max(4, (daDung / u.tong_suat) * 100)}%` }} />
      </span>
    </span>
  );
}

/** Dải ưu đãi đầy đủ (trang /goi-xem, khung mời đọc): tên đợt · giá · tiết kiệm · đồng hồ · suất. Hết giờ → ẩn. */
export function DaiUuDai({ u, className = "" }: { u: UuDai; className?: string }) {
  const [het, setHet] = useState(false);
  if (het) return null;
  return (
    <div className={`vien-chay ud-hien rounded-2xl p-[1.5px] ${className}`} data-testid="ud-dai">
      <div className="flex flex-col gap-3 rounded-[calc(1rem-1.5px)] bg-surface/95 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-cinnabar">{u.ten}</p>
          <p className="mt-1 text-fg">Mở trọn một Luận giải toàn bộ: <GiaUuDai u={u} lon /></p>
          <p className="mt-1 text-sm text-fg-muted">{loiTietKiem(u)} · {loiHan(u.het_luc)}, sau đó về {u.gia_goc} Sao.</p>
          <ConSuat u={u} className="mt-2 max-w-xs" />
        </div>
        <DemNguoc hetLuc={u.het_luc} khiHet={() => setHet(true)} />
      </div>
    </div>
  );
}

/** UD-3 — mốc vô hình đặt ở chỗ người đọc gặp chương khoá (cuối chương miễn phí, đầu khung "Cần lưu ý ở từng mảng").
 *  Đọc tới mốc → thẻ ưu đãi nổi `UuDaiTroi` trượt xuống từ trên. Không vẽ gì trong bài. */
export function MocUuDai({ nguon }: { /** chỗ đặt — để đo */ nguon: string }) {
  return <span aria-hidden className="block h-px" data-ud-moc={nguon} data-testid="ud-moc" />;
}

/** Đồng hồ gọn một dòng ("12 ngày 03:32:47") cho thẻ nổi. */
function DemGon({ hetLuc, khiHet }: { hetLuc: string; khiHet: () => void }) {
  const [c, setC] = useState<ReturnType<typeof conLai> | undefined>(undefined);
  useEffect(() => {
    let xong = false;
    const chay = () => { const m = conLai(hetLuc); setC(m); if (!m && !xong) { xong = true; khiHet(); } };
    chay();
    const t = setInterval(chay, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- khiHet không cần theo dõi
  }, [hetLuc]);
  if (!c) return null;
  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs tabular-nums text-gold" role="timer"
      aria-label={`Ưu đãi ${loiHan(hetLuc)}`} data-testid="ud-dem-nguoc">
      <Timer className="size-3.5 shrink-0" aria-hidden />
      {c.ngay > 0 && <span>{c.ngay} ngày</span>}<span>{hai(c.gio)}:{hai(c.phut)}:{hai(c.giay)}</span>
    </span>
  );
}

/** UD-3 — thẻ ưu đãi NỔI: trượt xuống từ trên (dưới thanh đầu trang + thanh chương) khi người đọc tới mốc `MocUuDai`,
 *  dính theo khi cuộn đọc, tự thu thành viên nhỏ sau khi cuộn tiếp ~một màn hình (không che bài), bấm viên để mở lại.
 *  Ẩn khi hộp mở khoá cuối báo cáo (`lg-hop-mo`) đã hiện trong màn hình (không nói hai lần) hoặc khi cuộn ngược lên trên
 *  mốc. Nút "Mở" là cùng hàm mở khoá của báo cáo. Gắn vào body (cha có backdrop-filter làm lệch `position: fixed`). */
export function UuDaiTroi({ u, khoa, dang = false, moKhoa, lamMoi }: {
  u: UuDai; khoa: number; dang?: boolean; moKhoa: (nguon: string) => void; lamMoi?: () => void;
}) {
  const [het, setHet] = useState(false);
  const [hien, setHien] = useState(false);
  const [gon, setGon] = useState(false);
  const [nguon, setNguon] = useState("cuoi_chuong");
  const [goc, setGoc] = useState<HTMLElement | null>(null);
  const moc = useRef<number | null>(null);
  useEffect(() => { setGoc(document.body); }, []);
  useEffect(() => {
    let khung = 0;
    const xet = () => {
      khung = 0;
      const h = window.innerHeight;
      const ds = Array.from(document.querySelectorAll<HTMLElement>("[data-ud-moc]"));
      const toi = ds.filter((m) => m.getBoundingClientRect().top < h * 0.9);
      const hop = document.querySelector<HTMLElement>('[data-testid="lg-hop-mo"]')?.getBoundingClientRect();
      const hopHien = hop ? hop.top < h && hop.bottom > 0 : false;
      const co = toi.length > 0 && !hopHien;
      if (co && toi.length) setNguon(toi[toi.length - 1]!.dataset.udMoc ?? "cuoi_chuong");
      setHien((cu) => {
        if (co && !cu) { moc.current = window.scrollY; setGon(false); }
        return co;
      });
      if (co && moc.current !== null && Math.abs(window.scrollY - moc.current) > h * 0.9) { setGon(true); moc.current = null; }
    };
    const len = () => { if (!khung) khung = requestAnimationFrame(xet); };
    xet();
    window.addEventListener("scroll", len, { passive: true });
    window.addEventListener("resize", len);
    return () => { window.removeEventListener("scroll", len); window.removeEventListener("resize", len); if (khung) cancelAnimationFrame(khung); };
  }, []);
  if (het || !goc) return null;
  const bat = () => { setGon(false); moc.current = window.scrollY; };
  return createPortal(
    <div data-testid="ud-troi" data-hien={hien ? "1" : "0"} data-gon={gon ? "1" : "0"} data-nguon={nguon}
      className={cn("ud-troi pointer-events-none fixed inset-x-0 z-[25] flex justify-center px-3 md:justify-end md:px-6 print:hidden",
        "transition-[transform,opacity] duration-500 motion-reduce:transition-none",
        hien ? "translate-y-0 opacity-100" : "-translate-y-[140%] opacity-0")}
      aria-hidden={!hien}>
      {gon ? (
        <button type="button" onClick={bat} tabIndex={hien ? 0 : -1} data-testid="ud-troi-vien"
          aria-label={`${u.ten}: mở ${khoa} chương còn ${u.gia} Sao, giá thường ${u.gia_goc} Sao. Bấm để xem`}
          className="hop-sao pointer-events-auto ml-auto inline-flex min-h-10 items-center gap-2 rounded-full border border-gold/60 bg-surface/95 px-3.5 text-sm shadow-lg backdrop-blur-md">
          <Sparkles className="size-4 text-gold" aria-hidden />
          <span className="font-semibold text-gold">{u.gia} Sao</span>
          <s className="text-xs text-fg-faint">{u.gia_goc}</s>
          <span className="rounded-full bg-cinnabar/15 px-1.5 py-0.5 text-[11px] font-semibold text-cinnabar">−{u.giam_pt}%</span>
          <ChevronDown className="size-4 text-fg-faint" aria-hidden />
        </button>
      ) : (
        <div role="region" aria-label={u.ten} data-testid="ud-mo-khoa"
          className="glass hop-sao pointer-events-auto w-full max-w-md rounded-2xl border border-gold/50 bg-surface/95 p-3.5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cinnabar">{u.ten}</span>
            <span className="ml-auto"><DemGon hetLuc={u.het_luc} khiHet={() => { setHet(true); lamMoi?.(); }} /></span>
            <button type="button" onClick={() => setGon(true)} tabIndex={hien ? 0 : -1} data-testid="ud-troi-thu"
              aria-label="Thu gọn ưu đãi" className="-mr-1 inline-flex size-8 items-center justify-center rounded-full text-fg-faint hover:bg-fg/5 hover:text-fg">
              <ChevronUp className="size-4" aria-hidden />
            </button>
          </div>
          <div className="mt-1.5 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm text-fg">
                <LockKeyhole className="size-3.5 shrink-0 text-gold" aria-hidden />
                <span className="truncate">{khoa > 0 ? `Mở ${khoa} chương còn lại` : "Mở toàn bộ báo cáo"}</span>
              </p>
              <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5" data-testid="ud-gia">
                <span className="font-serif text-xl text-gold">{u.gia} Sao</span>
                <s className="text-xs text-fg-faint" aria-label={`Giá thường ${u.gia_goc} Sao`}>{u.gia_goc} Sao</s>
                <span className="ud-nhan rounded-full bg-cinnabar/15 px-1.5 py-0.5 text-[11px] font-semibold text-cinnabar">−{u.giam_pt}%</span>
              </p>
            </div>
            <button type="button" onClick={() => moKhoa(nguon)} disabled={dang} tabIndex={hien ? 0 : -1} data-testid="ud-mo-khoa-nut"
              className="nut-sang inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-gold px-4 text-sm font-semibold text-bg hover:opacity-90 disabled:opacity-60">
              <Sparkles className="size-4" aria-hidden /> {dang ? "Đang mở…" : "Mở ngay"}
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-gold/90">{loiTietKiem(u)} · {loiHan(u.het_luc)}, sau đó về {u.gia_goc} Sao.</p>
          <ConSuat u={u} className="mt-1.5" />
        </div>
      )}
    </div>,
    goc,
  );
}

/** Dải ưu đãi gọn trong hộp đăng nhập / nạp Sao: người đọc thấy ngay giá đang giảm khi quyết định nạp. */
export function DaiUuDaiHop({ u }: { u: UuDai }) {
  const [het, setHet] = useState(false);
  if (het) return null;
  return (
    <div className="ud-hien mb-4 rounded-xl border border-cinnabar/40 bg-cinnabar/[0.06] p-3" data-testid="ud-hop-thoai">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-cinnabar">{u.ten}</span>
        <DemNguoc hetLuc={u.het_luc} khiHet={() => setHet(true)} />
      </div>
      <p className="mt-2 text-sm text-fg">Báo cáo này đang <GiaUuDai u={u} /></p>
      <p className="mt-0.5 text-xs text-gold/90">{loiTietKiem(u)} · {loiHan(u.het_luc)}, sau đó về {u.gia_goc} Sao.</p>
      <ConSuat u={u} className="mt-2" />
    </div>
  );
}
