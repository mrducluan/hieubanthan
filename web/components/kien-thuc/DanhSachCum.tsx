"use client";
// TM-1 (C-2) — danh sách bài của một cụm dài, có mục lục: chip nhảy tới nhóm (link #neo, không cần JavaScript), ô lọc
// nhanh theo tên và chip lọc phụ (vd theo cung). Toàn bộ bài vẫn render ở máy chủ (máy tìm kiếm thấy đủ link); lọc chỉ
// ẩn/hiện trên trình duyệt, không đổi URL (tránh sinh trang trùng để Google index).
import { useMemo, useState } from "react";
import Link from "@/components/khung/Lien";
import { maChu, type MucLucCum } from "@/lib/nhom-cum";
import { cn } from "@/lib/utils";

// Điện thoại: mỗi nhóm chip là MỘT hàng vuốt ngang (14 + 12 chip xếp dòng sẽ đẩy danh sách xuống 2 màn); ≥ sm xếp dòng.
const HANG = "-mx-4 mt-1.5 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0";

export function DanhSachCum({ ml }: { ml: MucLucCum }) {
  const [tim, setTim] = useState("");
  const [loc, setLoc] = useState<string | null>(null);
  const q = maChu(tim);
  const hien = useMemo(() => ml.nhom.map((n) => ({
    ...n, bai: n.bai.filter((b) => (!q || maChu(b.tieu_de).includes(q)) && (!loc || b.phu.includes(loc))),
  })), [ml, q, loc]);
  const tong = hien.reduce((s, n) => s + n.bai.length, 0);
  const dangLoc = Boolean(q || loc);

  return (
    <div className="mt-8" data-testid="danh-sach-cum">
      <div className="space-y-3 rounded-2xl border border-line/70 bg-surface/40 p-4" data-testid="muc-luc-cum">
        <label className="block">
          <span className="text-sm font-medium text-fg">Lọc nhanh trong {ml.nhom.reduce((s, n) => s + n.bai.length, 0)} trang</span>
          <input type="search" value={tim} onChange={(e) => setTim(e.target.value)} data-testid="cum-tim"
            placeholder={`Gõ tên, ví dụ: ${ml.viDu}`} enterKeyHint="search"
            className="mt-1.5 h-11 w-full rounded-xl border border-line bg-bg/60 px-3 text-[0.95rem] text-fg placeholder:text-fg-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold" />
        </label>
        <nav aria-label={`Mục lục ${ml.nhanNhom.toLowerCase()}`}>
          <p className="text-xs text-fg-faint">{ml.nhanNhom}</p>
          <ul className={HANG}>
            {ml.nhom.map((n, i) => {
              const so = hien[i]!.bai.length;
              return (
                <li key={n.ma} className="shrink-0">
                  <a href={`#nhom-${n.ma}`} data-testid="cum-chip-nhom" aria-disabled={so === 0 || undefined}
                    className={cn("inline-flex min-h-9 items-center whitespace-nowrap rounded-full border border-line px-3 text-sm text-fg-muted transition-colors hover:border-gold/60 hover:text-fg",
                      so === 0 && "pointer-events-none opacity-40")}>
                    {n.ten}{dangLoc && <span className="ml-1.5 text-xs tabular-nums text-fg-faint">{so}</span>}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        {ml.loc && (
          <div role="group" aria-label={`Lọc ${ml.loc.nhan.toLowerCase()}`}>
            <p className="text-xs text-fg-faint">{ml.loc.nhan}</p>
            <div className={HANG}>
              {ml.loc.ds.map((x) => (
                <button key={x.ma} type="button" aria-pressed={loc === x.ma} data-testid="cum-chip-loc" onClick={() => setLoc(loc === x.ma ? null : x.ma)}
                  className={cn("inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-3 text-sm transition-colors",
                    loc === x.ma ? "border-gold bg-gold/15 text-fg" : "border-line text-fg-muted hover:text-fg")}>
                  {x.ten}
                </button>
              ))}
            </div>
          </div>
        )}
        {dangLoc && (
          <p className="flex flex-wrap items-center gap-x-3 text-sm text-fg-muted" aria-live="polite" data-testid="cum-dem">
            Đang hiện {tong} trang.
            <button type="button" className="text-gold underline underline-offset-4" onClick={() => { setTim(""); setLoc(null); }}>Bỏ lọc</button>
          </p>
        )}
      </div>

      {tong === 0 && <p className="mt-6 text-fg-muted">Không có trang nào khớp. Thử tên ngắn hơn hoặc bỏ bớt lọc.</p>}
      {hien.map((n) => n.bai.length > 0 && (
        <section key={n.ma} id={`nhom-${n.ma}`} aria-labelledby={`nhom-${n.ma}-h`} className="mt-10 scroll-mt-24">
          <h2 id={`nhom-${n.ma}-h`} className="text-2xl">{n.ten} <span className="text-base font-normal text-fg-faint">· {n.bai.length}</span></h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {n.bai.map((b) => (
              <li key={b.duong}>
                <Link href={b.duong} className="glass block h-full rounded-2xl p-5 transition-colors hover:border-gold/50">
                  <h3 className="text-lg leading-snug">{b.tieu_de}</h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-fg-muted">{b.mo_ta}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
