"use client";
import type { LaSoOutputT } from "@/app/api/tuvi/schema";
import { cn } from "@/lib/utils";

// Lá số 12 cung theo bố cục truyền thống (vòng 4×4, giữa là thông tin chung). Chỉ vẽ dữ liệu iztro/engine.
const VI_TRI: Record<string, [number, number]> = {
  "Tỵ": [1, 1], "Ngọ": [1, 2], "Mùi": [1, 3], "Thân": [1, 4],
  "Thìn": [2, 1], "Dậu": [2, 4],
  "Mão": [3, 1], "Tuất": [3, 4],
  "Dần": [4, 1], "Sửu": [4, 2], "Tý": [4, 3], "Hợi": [4, 4],
};

export function LaSoTuVi({ ls, onChonCung }: { ls: LaSoOutputT; onChonCung?: (ten: string) => void }) {
  return (
    <div className="grid grid-cols-4 grid-rows-4 gap-1 text-[0.65rem] leading-tight sm:gap-1.5 sm:text-xs" role="list" aria-label="Lá số Tử vi 12 cung">
      {ls.cung.map((c) => {
        const [r, col] = VI_TRI[c.chi] ?? [1, 1];
        return (
          <button key={c.chi} type="button" role="listitem" onClick={() => onChonCung?.(c.ten)}
            style={{ gridRow: r, gridColumn: col }}
            aria-label={`Cung ${c.ten} (${c.can} ${c.chi}): ${c.chinh_tinh.map((s) => s.ten).join(", ") || "vô chính diệu"}`}
            className={cn("flex min-h-[5.5rem] flex-col rounded-lg border bg-bg/50 p-1.5 text-left transition-colors hover:border-gold/60 sm:min-h-[7rem] sm:p-2",
              c.la_menh ? "border-gold/70 bg-gold/[0.07]" : "border-line/70")}>
            <span className="flex items-baseline justify-between gap-1">
              <b className={cn("font-semibold", c.la_menh ? "text-gold" : "text-fg")}>{c.ten}{c.la_than ? " · Thân" : ""}</b>
            </span>
            <span className="mt-1 space-y-0.5">
              {c.chinh_tinh.length ? c.chinh_tinh.map((s) => (
                <span key={s.ten} className="block text-moon">
                  {s.ten}{s.do_sang ? <span className="text-fg-faint"> ({s.do_sang})</span> : null}
                  {s.tu_hoa ? <span className="ml-0.5 rounded bg-jade/20 px-0.5 text-jade">{s.tu_hoa}</span> : null}
                </span>
              )) : <span className="block italic text-fg-faint">vô chính diệu</span>}
            </span>
            <span className="mt-auto flex justify-between pt-1 text-fg-faint">
              <span>{c.can} {c.chi}</span>
              <span>{c.dai_han.tu_tuoi}–{c.dai_han.den_tuoi}</span>
            </span>
          </button>
        );
      })}
      <div className="col-start-2 col-end-4 row-start-2 row-end-4 flex flex-col items-center justify-center rounded-lg border border-line/50 bg-surface/60 p-2 text-center">
        <p className="font-serif text-base text-gold sm:text-xl">Lá số Tử vi</p>
        <p className="mt-1 text-fg-muted">{ls.can_chi_nam.can} {ls.can_chi_nam.chi} · {ls.gioi_tinh === "nam" ? "Nam" : "Nữ"}</p>
        <p className="text-fg-muted">Âm lịch {ls.am_lich.ngay}/{ls.am_lich.thang}/{ls.am_lich.nam}</p>
        <p className="text-fg-muted">{ls.gio}</p>
        <p className="mt-1 text-fg">{ls.ngu_hanh_cuc}</p>
        <p className="text-fg-faint">Mệnh chủ {ls.menh_chu} · Thân chủ {ls.than_chu}</p>
      </div>
    </div>
  );
}
