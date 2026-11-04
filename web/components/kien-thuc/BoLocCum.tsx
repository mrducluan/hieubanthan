"use client";
// TM-1 (C-2) — thanh lọc của DanhSachCum: ô lọc nhanh (bỏ dấu, nhiều từ = phải có đủ mọi từ) + chip nhảy tới nhóm + chip
// lọc phụ. Chỉ đặt/bỏ thuộc tính `hidden` trên các dòng máy chủ đã dựng (data-cum-bai) — không giữ bản sao dữ liệu bài.
import { useEffect, useState } from "react";
import { maChu, type BoLoc } from "@/lib/nhom-cum";
import { cn } from "@/lib/utils";

// Điện thoại: mỗi nhóm chip là MỘT hàng vuốt ngang (14 + 12 chip xếp dòng sẽ đẩy danh sách xuống 2 màn); ≥ sm xếp dòng.
const HANG = "-mx-4 mt-1.5 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0";
const CHIP = "inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3 text-sm transition-colors";

export function BoLocCum({ goc, tong, nhanNhom, viDu, nhom, loc }: {
  goc: string; tong: number; nhanNhom: string; viDu: string; nhom: { ma: string; ten: string; so: number }[]; loc: BoLoc | null;
}) {
  const [tim, setTim] = useState("");
  const [phu, setPhu] = useState<string | null>(null);
  const [so, setSo] = useState<Record<string, number> | null>(null);   // null = không lọc
  const tu = tim.split(/[\s,;]+/).map(maChu).filter(Boolean);
  const khoaTu = tu.join(" ");
  const dangLoc = tu.length > 0 || phu !== null;

  useEffect(() => {
    const khung = document.getElementById(goc);
    if (!khung) return;
    const dem: Record<string, number> = {};
    khung.querySelectorAll<HTMLElement>("section[data-nhom]").forEach((sec) => {
      let n = 0;
      sec.querySelectorAll<HTMLElement>("[data-cum-bai]").forEach((li) => {
        const t = li.dataset.tim ?? "", p = (li.dataset.phu ?? "").split(" ");
        const hien = (!khoaTu || khoaTu.split(" ").every((x) => t.includes(x))) && (!phu || p.includes(phu));
        li.hidden = !hien;
        if (hien) n++;
      });
      sec.hidden = n === 0;
      const nhan = sec.querySelector<HTMLElement>("[data-so-nhom]");
      if (nhan) nhan.textContent = `· ${n}`;
      dem[sec.dataset.nhom!] = n;
    });
    const rong = khung.querySelector<HTMLElement>("[data-cum-rong]");
    if (rong) rong.hidden = Object.values(dem).some((n) => n > 0);
    setSo(khoaTu || phu ? dem : null);
  }, [goc, khoaTu, phu]);

  const tongHien = so ? Object.values(so).reduce((a, b) => a + b, 0) : tong;
  return (
    <div className="space-y-3 rounded-2xl border border-line/70 bg-surface/40 p-4" data-testid="muc-luc-cum">
      <label className="block">
        <span className="text-sm font-medium text-fg">Lọc nhanh trong {tong} trang</span>
        <input type="search" value={tim} onChange={(e) => setTim(e.target.value)} data-testid="cum-tim"
          placeholder={`Gõ tên, ví dụ: ${viDu}`} enterKeyHint="search"
          className="mt-1.5 h-11 w-full rounded-xl border border-line bg-bg/60 px-3 text-[0.95rem] text-fg placeholder:text-fg-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" />
      </label>
      <nav aria-label={`Mục lục ${nhanNhom.toLowerCase()}`}>
        <p className="text-xs text-fg-faint">{nhanNhom}</p>
        <ul className={HANG}>
          {nhom.map((n) => {
            const s = so ? (so[n.ma] ?? 0) : n.so;
            const noiDung = <>{n.ten}{so && <span className="ml-1.5 text-xs tabular-nums text-fg-faint"><span className="sr-only">, </span>{s}</span>}</>;
            return (
              <li key={n.ma} className="shrink-0">
                {s > 0
                  ? <a href={`#nhom-${n.ma}`} data-testid="cum-chip-nhom" className={cn(CHIP, "border-line text-fg-muted hover:border-gold/60 hover:text-fg")}>{noiDung}</a>
                  : <span data-testid="cum-chip-nhom" aria-disabled="true" className={cn(CHIP, "border-line/60 text-fg-faint opacity-50")}>{noiDung}</span>}
              </li>
            );
          })}
        </ul>
      </nav>
      {loc && (
        <div role="group" aria-label={`Lọc ${loc.nhan.toLowerCase()}`}>
          <p className="text-xs text-fg-faint">{loc.nhan}</p>
          <div className={HANG}>
            {loc.ds.map((x) => (
              <button key={x.ma} type="button" aria-pressed={phu === x.ma} data-testid="cum-chip-loc" onClick={() => setPhu(phu === x.ma ? null : x.ma)}
                className={cn(CHIP, phu === x.ma ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
                {x.ten}
              </button>
            ))}
          </div>
        </div>
      )}
      {dangLoc && (
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-fg-muted" aria-live="polite" data-testid="cum-dem">
          Đang hiện {tongHien} trang.
          <button type="button" className="min-h-9 text-gold underline underline-offset-4" onClick={() => { setTim(""); setPhu(null); }}>Bỏ lọc</button>
        </p>
      )}
    </div>
  );
}
