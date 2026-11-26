"use client";
// Chặng 1 (nâng cấp) — Công tắc 2 Chế độ: [Đời sống & Hành động] ⇄ [Đối chiếu Cổ điển].
// Bật 'co_dien' tự mở toàn bộ 'Vì sao nói vậy' trên bài luận và hiện khung đối chiếu sách xưa & sơ đồ thật (không bịa màu/giờ/hướng).
import { useEffect, useState, type ReactNode } from "react";
import { BookOpen, Compass, LockKeyhole, Scale, Sparkles } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";
import { useChuBaoCao } from "./chu-bao-cao";
import type { UngDungCoDien } from "./kieu";

export type CheDoDoc = "doi_song" | "co_dien";

const KHOA_LUU = "hbt.che_do_doc.v1";
const SU_KIEN = "hbt:che-do-doc";

export function useCheDoDoc(): [CheDoDoc, (m: CheDoDoc) => void] {
  const [cheDo, setCheDo] = useState<CheDoDoc>("doi_song");

  useEffect(() => {
    try {
      const luu = localStorage.getItem(KHOA_LUU);
      if (luu === "co_dien" || luu === "doi_song") setCheDo(luu);
    } catch { /* chế độ riêng tư */ }
    const nghe = (e: Event) => {
      const m = (e as CustomEvent<CheDoDoc>).detail;
      if (m === "doi_song" || m === "co_dien") setCheDo(m);
    };
    window.addEventListener(SU_KIEN, nghe);
    return () => window.removeEventListener(SU_KIEN, nghe);
  }, []);

  const chon = (m: CheDoDoc) => {
    setCheDo(m);
    try { localStorage.setItem(KHOA_LUU, m); } catch { /* chế độ riêng tư */ }
    try { window.dispatchEvent(new CustomEvent<CheDoDoc>(SU_KIEN, { detail: m })); } catch { /* bỏ qua */ }
  };

  return [cheDo, chon];
}

export function CongTacCheDoDoc({ moDun, nho = false, className }: { moDun: string; nho?: boolean; className?: string }) {
  const [cheDo, chon] = useCheDoDoc();
  const { c: chu } = useChuBaoCao();
  const doi = (m: CheDoDoc) => {
    if (m === cheDo) return;
    chon(m);
    ghi("chart_interacted", { mo_dun: moDun, kind: "che_do_doc", che_do: m });
  };
  return (
    <div role="group" aria-label={chu("cd.nhan")} data-testid="cong-tac-che-do" data-che-do={cheDo}
      className={cn("inline-flex flex-wrap items-center gap-1 rounded-full border border-line/80 bg-surface/40 p-1 print:hidden", className)}>
      <button type="button" aria-pressed={cheDo === "doi_song"} onClick={() => doi("doi_song")} data-testid="che-do-doi-song"
        className={cn("inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-colors",
          nho ? "text-xs" : "text-xs sm:text-sm",
          cheDo === "doi_song" ? "bg-gold/20 text-gold" : "text-fg-muted hover:text-fg")}>
        <Sparkles className="size-3.5 shrink-0" aria-hidden />
        <span>{chu("cd.doi_song")}</span>
      </button>
      <button type="button" aria-pressed={cheDo === "co_dien"} onClick={() => doi("co_dien")} data-testid="che-do-co-dien"
        className={cn("inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 py-1 font-medium transition-colors",
          nho ? "text-xs" : "text-xs sm:text-sm",
          cheDo === "co_dien" ? "bg-gold/20 text-gold" : "text-fg-muted hover:text-fg")}>
        <BookOpen className="size-3.5 shrink-0" aria-hidden />
        <span>{chu("cd.co_dien")}</span>
      </button>
    </div>
  );
}

export function KhungUngDungCoDien({ u, moKhoa }: { u?: UngDungCoDien; moKhoa?: ReactNode }) {
  const [cheDo] = useCheDoDoc();
  const { c: chu } = useChuBaoCao();
  if (cheDo !== "co_dien" || !u) return null;

  return (
    <section aria-labelledby="lg-ung-dung-co-dien-td" data-testid="lg-ung-dung-co-dien"
      className="mt-6 rounded-2xl border border-gold/40 bg-surface-2/40 p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Compass className="size-4 shrink-0 text-gold" aria-hidden />
        <h3 id="lg-ung-dung-co-dien-td" className="font-serif text-xl text-fg">{u.tieu_de}</h3>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{u.nguyen_tac_uu_tien}</p>

      {u.khoa ? (
        <div className="mt-3 rounded-xl border border-line/70 bg-surface/40 p-3.5 text-sm text-fg-muted" data-testid="lg-ung-dung-co-dien-khoa">
          <p className="flex items-center gap-2 text-fg">
            <LockKeyhole className="size-4 shrink-0 text-gold" aria-hidden />
            <span>{chu("cd.khoa_mo_ta")}</span>
          </p>
          {moKhoa && <div className="mt-3">{moKhoa}</div>}
        </div>
      ) : (
        <>
          {u.diem_hoc_thuat && u.diem_hoc_thuat.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="lg-diem-hoc-thuat">
              {u.diem_hoc_thuat.map((d) => (
                <div key={d.nhan} className="rounded-xl border border-line/70 bg-bg/60 p-3.5 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gold">{d.nhan}</p>
                  <p className="mt-1.5 leading-relaxed text-fg">{d.noi_dung}</p>
                </div>
              ))}
            </div>
          )}

          {u.sach && u.sach.length > 0 && (
            <div className="mt-4 space-y-2.5" data-testid="lg-sach-co-dien">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">{chu("cd.sach_xua")}</p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {u.sach.map((s, idx) => (
                  <div key={`${s.sach}-${idx}`} className="rounded-xl border border-line/70 bg-bg/60 p-3.5 text-sm">
                    <p className="text-xs font-medium text-gold/90">{s.sach}{s.ve ? ` · ${s.ve}` : ""}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-fg">{s.y}</p>
                    {s.nguyen_van && (
                      <details className="mt-2 text-xs text-fg-faint">
                        <summary className="cursor-pointer hover:text-fg-muted">{chu("cd.nguyen_van")}</summary>
                        <p className="mt-1 font-serif text-fg-muted">{s.nguyen_van}</p>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {u.ghi_chu_so_do && (
            <p className="mt-3 rounded-xl border border-moon/30 bg-moon/5 px-3.5 py-2.5 text-xs leading-relaxed text-fg-muted" data-testid="lg-ghi-chu-so-do">
              {u.ghi_chu_so_do}
            </p>
          )}

          {u.khu_vuc_van_9 && u.khu_vuc_van_9.length > 0 && (
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="lg-khu-vuc-van-9">
              {u.khu_vuc_van_9.map((kv) => (
                <div key={kv.khu_vuc} className="rounded-xl border border-line/70 bg-bg/60 p-3.5 text-sm">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-semibold text-fg">{kv.ten_khu_vuc}</p>
                    <span className="font-mono text-xs text-gold">{kv.cap_sao}</span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-gold/90">{kv.ten_phep}</p>
                  <p className="mt-1 text-xs text-fg-faint">{kv.ngu_hanh_dieu_hoa}</p>
                  <p className="mt-2 text-xs leading-relaxed text-fg-muted">{kv.ung_dung}</p>
                </div>
              ))}
            </div>
          )}

          {u.doi_chieu_hai_phai && (
            <div className="mt-4 rounded-xl border border-gold/35 bg-gold/5 p-3.5 text-xs leading-relaxed" data-testid="lg-doi-chieu-hai-phai">
              <p className="flex items-center gap-1.5 font-semibold text-gold">
                <Scale className="size-3.5 shrink-0" aria-hidden />
                <span>{u.doi_chieu_hai_phai.tieu_de ?? chu("cd.doi_chieu")}</span>
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-2">
                <p className="rounded-lg border border-line/60 bg-bg/60 p-2.5 text-fg-muted">{u.doi_chieu_hai_phai.goc_bat_trach}</p>
                <p className="rounded-lg border border-line/60 bg-bg/60 p-2.5 text-fg-muted">
                  {u.doi_chieu_hai_phai.goc_huyen_khong_van_9 ?? u.doi_chieu_hai_phai.goc_huyen_khong}
                </p>
              </div>
              <p className="mt-2 text-fg">{u.doi_chieu_hai_phai.cach_dung_hoa}</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
