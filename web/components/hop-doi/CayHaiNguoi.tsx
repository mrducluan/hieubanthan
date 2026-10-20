"use client";
// TS-V3b — "Cây của hai người": đường nối Sephirah ngày sinh của hai người trên Cây Sự sống (Qabalah Hermetic).
// Engine tính đường + nghĩa (/api/thanso/cay-hai-nguoi); web chỉ vẽ sơ đồ Cây cố định (10 trạm, 22 con đường theo
// đánh số Golden Dawn) và tô đúng các trạm/con đường engine trả. Không chấm điểm, không lưu.
import { useEffect, useState, type ReactNode } from "react";
import { TreePine } from "lucide-react";

interface Tram { so: number; ten: string | null; nghia: string | null; xu_huong: string | null }
interface ConDuong { chu: number; ten: string; so_duong_cay: number; tu: number; den: number;
  nghia: { nghia_chu?: string; xu_huong?: string; cau_tu_soi?: string } | null }
export interface CayKq {
  tram: [Tram, Tram]; sephirot: number[]; con_duong: ConDuong[]; cung_tram: boolean; so_loi: number;
  ghi_chu_loi: string | null; cach_doc: string; cach_doc_rieng: string; cau_tu_soi_chung: string; luu_y: string;
}

// Sơ đồ Cây Sự sống (vị trí vẽ cố định, không phải phép tính).
const VI_TRI: Record<number, [number, number]> = {
  1: [150, 24], 2: [240, 74], 3: [60, 74], 4: [240, 164], 5: [60, 164], 6: [150, 206], 7: [240, 288], 8: [60, 288],
  9: [150, 330], 10: [150, 400],
};
const CANH: [number, number][] = [[1, 2], [1, 3], [1, 6], [2, 3], [2, 6], [2, 4], [3, 6], [3, 5], [4, 5], [4, 6], [4, 7],
  [5, 6], [5, 8], [6, 7], [6, 9], [6, 8], [7, 8], [7, 9], [7, 10], [8, 9], [8, 10], [9, 10]];

export function CayHaiNguoi({ than, tenA, tenB, cuoi }: { than: Record<string, unknown> | null; tenA: string; tenB: string; cuoi?: ReactNode }) {
  const [kq, setKq] = useState<CayKq | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const khoa = JSON.stringify(than);
  useEffect(() => {
    if (!than) return;
    let huy = false;
    fetch("/api/thanso/cay-hai-nguoi", { method: "POST", headers: { "content-type": "application/json" }, body: khoa })
      .then(async (r) => { const d = await r.json().catch(() => null); if (huy) return; if (r.ok) setKq(d as CayKq); else if (r.status !== 409) setLoi((d as { error?: string } | null)?.error ?? null); })
      .catch(() => { /* phần phụ của hợp đôi: lỗi mạng thì ẩn */ });
    return () => { huy = true; };
  }, [khoa]); // eslint-disable-line react-hooks/exhaustive-deps -- khoa đại diện cho than
  if (!than || (!kq && !loi)) return null;
  if (!kq) return <p className="mx-auto max-w-3xl text-sm text-fg-faint">{loi}</p>;
  const [a, b] = kq.tram;
  const tren = new Set(kq.con_duong.map((p) => `${Math.min(p.tu, p.den)}-${Math.max(p.tu, p.den)}`));
  return (
    <section aria-labelledby="cay-hai-nguoi" className="glass mx-auto max-w-3xl rounded-2xl p-5 sm:p-6" data-testid="cay-hai-nguoi">
      <p className="eyebrow inline-flex items-center gap-1.5"><TreePine className="size-4" aria-hidden /> Qabalah</p>
      <h2 id="cay-hai-nguoi" className="mt-1 text-2xl">Cây của hai người</h2>
      <p className="mt-2 text-sm text-fg-muted">{kq.cach_doc}</p>
      <div className="mt-4 grid items-start gap-5 sm:grid-cols-[14rem_1fr]">
        <svg viewBox="0 0 300 430" className="mx-auto w-full max-w-[14rem]" role="img"
          aria-label={`Cây Sự sống: ${tenA} ở ${a.ten}, ${tenB} ở ${b.ten}${kq.con_duong.length ? `, nối qua ${kq.con_duong.map((p) => p.ten).join(", ")}` : ""}`}>
          {CANH.map(([x, y]) => {
            const sang = tren.has(`${x}-${y}`);
            const [x1, y1] = VI_TRI[x] ?? [0, 0], [x2, y2] = VI_TRI[y] ?? [0, 0];
            return <line key={`${x}-${y}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="currentColor" strokeOpacity={sang ? 1 : 0.18} strokeWidth={sang ? 4 : 1.5}
              className={sang ? "text-gold" : "text-fg-muted"} data-sang={sang ? "1" : undefined} />;
          })}
          {Object.entries(VI_TRI).map(([s, [x, y]]) => {
            const n = Number(s), laA = n === a.so, laB = n === b.so, tren2 = kq.sephirot.includes(n);
            return (
              <g key={s}>
                <circle cx={x} cy={y} r={laA || laB ? 17 : 12} className={laA || laB ? "fill-gold" : tren2 ? "fill-gold/40" : "fill-bg"}
                  stroke="currentColor" strokeOpacity={0.5} />
                <text x={x} y={y + 4} textAnchor="middle" fontSize="11" className={laA || laB ? "fill-bg font-semibold" : "fill-fg-muted"}>{s}</text>
              </g>
            );
          })}
        </svg>
        <div className="space-y-3 text-sm">
          <p><b className="text-gold">{tenA}</b>: trạm {a.so} · {a.ten} ({a.nghia?.toLowerCase()}) · <b className="text-gold">{tenB}</b>: trạm {b.so} · {b.ten} ({b.nghia?.toLowerCase()})</p>
          <p className="text-base" data-testid="cay-cach-doc">{kq.cach_doc_rieng}</p>
          {kq.con_duong.length > 0 && (
            <ol className="space-y-2">
              {kq.con_duong.map((p) => (
                <li key={p.chu} className="rounded-xl border border-line/70 p-3" data-testid={`cay-chu-${p.ten}`}>
                  <p><b className="text-gold">{p.ten}</b> <span className="text-xs text-fg-muted">chữ thứ {p.chu} · con đường số {p.so_duong_cay}</span></p>
                  {p.nghia?.xu_huong && <p className="mt-1 text-fg-muted">{p.nghia.xu_huong}</p>}
                  {p.nghia?.cau_tu_soi && <p className="mt-1 text-moon">{p.nghia.cau_tu_soi}</p>}
                </li>
              ))}
            </ol>
          )}
          {kq.ghi_chu_loi && <p className="text-xs text-fg-faint">{kq.ghi_chu_loi}</p>}
          <p className="rounded-xl bg-moon/10 px-4 py-2 text-moon">{kq.cau_tu_soi_chung}</p>
          <p className="text-xs text-fg-faint">{kq.luu_y}</p>
        </div>
      </div>
      {cuoi && <div className="mt-5 border-t border-line/60 pt-4">{cuoi}</div>}
    </section>
  );
}
