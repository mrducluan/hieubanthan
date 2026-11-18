"use client";
// UI-HHT (chủ dự án 2026-11-18) — la bàn 8 hướng "sống" cho trang hướng hợp tuổi: 4 hướng tốt tô đậm nhạt theo THỨ HẠNG
// (Sinh Khí → Thiên Y → Diên Niên → Phục Vị, engine xếp), số hạng trên từng ô, kim quay về hướng đang chọn. Bấm ô (hoặc
// chip bên dưới, hoặc phím Enter / Space) → bảng chi tiết: câu đời thường, hợp đặt gì, khoảng độ + 3 sơn, câu sách xưa,
// hướng kiêng của năm (nếu có). Web chỉ VẼ dữ liệu engine trả — không tự tính hướng hay du niên.
// Chuyển động chỉ bằng CSS transition, tắt khi người dùng chọn giảm chuyển động (motion-reduce). Trạng thái đầu cố định
// (hướng hạng 1) nên HTML máy chủ và máy khách trùng nhau.
import { useState } from "react";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

export interface HuongSong {
  huong: string; du_nien?: string; cat: boolean; hang?: number | null;
  mot_cau?: string; dung?: string; son?: string[]; do?: { tu: number; den: number };
  sach?: { han: string; trich?: string; y: string } | null;
}
export interface SaoNamTrung { huong: string; sao: string[] }

const HUONG = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
const DAM = [0, 0.5, 0.36, 0.26, 0.18];   // độ đậm theo hạng 1–4
const so = (x: number) => (Number.isInteger(x) ? String(x) : String(x).replace(".", ","));

function cung(i: number, r0: number, r1: number) {
  const a0 = ((i * 45 - 22.5 - 90) * Math.PI) / 180, a1 = ((i * 45 + 22.5 - 90) * Math.PI) / 180;
  const p = (r: number, a: number) => `${(100 + r * Math.cos(a)).toFixed(2)} ${(100 + r * Math.sin(a)).toFixed(2)}`;
  return `M ${p(r0, a0)} L ${p(r1, a0)} A ${r1} ${r1} 0 0 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
}
const diem = (i: number, r: number) => {
  const a = ((i * 45 - 90) * Math.PI) / 180;
  return { x: +(100 + r * Math.cos(a)).toFixed(2), y: +(100 + r * Math.sin(a)).toFixed(2) };
};

export function LaBanSong({ huong, quai, nhom, namNay, maDo = "la_ban_cung", gon = false }: {
  huong: HuongSong[]; quai: string; nhom: string;
  /** Hướng tốt có sao kiêng của năm (engine `bo_sung_cung.nam_nay`) — chấm nhỏ trên ô + dòng nhắc trong bảng. */
  namNay?: { nam: number; trung: SaoNamTrung[] } | null;
  maDo?: string; gon?: boolean;
}) {
  const theo = new Map(huong.map((h) => [h.huong, h]));
  const dau = huong.find((h) => h.hang === 1)?.huong ?? huong[0]?.huong ?? "Bắc";
  const [chon, setChon] = useState(dau);
  const h = theo.get(chon);
  const iChon = HUONG.indexOf(chon);
  const trungNam = new Map((namNay?.trung ?? []).map((t) => [t.huong, t.sao]));
  const xepHang = [...huong].sort((a, b) => (a.hang ?? 9) - (b.hang ?? 9) || HUONG.indexOf(a.huong) - HUONG.indexOf(b.huong));
  const bam = (x: string) => {
    setChon(x);
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: maDo, huong: x });
  };

  return (
    <div className={cn("grid items-start gap-5", !gon && "md:grid-cols-[minmax(0,22rem)_1fr]")} data-testid="la-ban-song">
      <figure className="mx-auto w-full max-w-[22rem]">
        <svg viewBox="0 0 200 200" role="group" aria-label={`La bàn 8 hướng cung ${quai}: bấm từng hướng để xem chi tiết`} className="h-auto w-full select-none">
          {HUONG.map((x, i) => {
            const m = theo.get(x);
            const cat = !!m?.cat;
            const t = diem(i, 72);
            const dangChon = x === chon;
            return (
              <g key={x} role="button" tabIndex={0} aria-pressed={dangChon}
                aria-label={`${x}${m?.du_nien ? `, ${m.du_nien}` : ""}${m?.hang ? `, hướng tốt hạng ${m.hang}` : cat ? "" : ", nên tránh"}`}
                className="cursor-pointer outline-none [&:focus-visible>path]:stroke-gold [&:focus-visible>path]:stroke-[1.6]"
                onClick={() => bam(x)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bam(x); } }}>
                <path d={cung(i, 34, 96)}
                  fill={cat ? `rgb(var(--jade) / ${DAM[m?.hang ?? 4] ?? 0.18})` : "rgb(var(--cinnabar) / 0.07)"}
                  stroke={dangChon ? "rgb(var(--gold))" : "rgb(var(--line))"} strokeWidth={dangChon ? 1.6 : 0.6}
                  className="transition-[stroke,stroke-width] duration-300 motion-reduce:transition-none" />
                <text x={t.x} y={t.y - 4} textAnchor="middle" fontSize="8" fill="rgb(var(--fg))" pointerEvents="none">{x}</text>
                {m?.du_nien && (
                  <text x={t.x} y={t.y + 6} textAnchor="middle" fontSize="6.6" pointerEvents="none"
                    fill={cat ? "rgb(var(--jade))" : "rgb(var(--cinnabar))"}>{m.du_nien}</text>
                )}
                {m?.hang ? (() => {
                  const b = diem(i, 50);
                  return (
                    <g pointerEvents="none">
                      <circle cx={b.x} cy={b.y} r="6" fill={m.hang === 1 ? "rgb(var(--gold))" : "rgb(var(--surface))"}
                        stroke="rgb(var(--jade) / 0.7)" strokeWidth="0.7" />
                      <text x={b.x} y={b.y + 2.4} textAnchor="middle" fontSize="7" fontWeight="600"
                        fill={m.hang === 1 ? "rgb(var(--bg))" : "rgb(var(--jade))"}>{m.hang}</text>
                    </g>
                  );
                })() : null}
                {trungNam.has(x) && (() => {
                  const s = diem(i, 89);
                  return <circle cx={s.x} cy={s.y} r="2.6" fill="rgb(var(--moon))" pointerEvents="none" />;
                })()}
              </g>
            );
          })}
          {/* kim la bàn: quay về hướng đang chọn (0° = Bắc ở trên) */}
          <g style={{ transform: `rotate(${iChon * 45}deg)`, transformOrigin: "100px 100px", transformBox: "view-box" }}
            className="transition-transform duration-700 ease-out motion-reduce:transition-none" aria-hidden>
            <path d="M100 70 L104 100 L100 106 L96 100 Z" fill="rgb(var(--gold))" />
          </g>
          <circle cx="100" cy="100" r="22" fill="rgb(var(--surface))" stroke="rgb(var(--gold) / 0.6)" pointerEvents="none" />
          <text x="100" y="99" textAnchor="middle" fontSize="11" fontFamily="var(--font-display)" fill="rgb(var(--gold))" pointerEvents="none">{quai}</text>
          <text x="100" y="109" textAnchor="middle" fontSize="5.4" fill="rgb(var(--fg-muted))" pointerEvents="none">{nhom}</text>
        </svg>
        <figcaption className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-fg-muted">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-jade/50" /> Hướng tốt (số = thứ hạng)</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-cinnabar/30" /> Nên tránh</span>
          {trungNam.size > 0 && <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-moon" /> Năm {namNay?.nam}: nên giữ yên</span>}
        </figcaption>
      </figure>

      <div className="min-w-0">
        <ul className="flex flex-wrap gap-1.5" aria-label="Chọn hướng">
          {xepHang.map((x) => (
            <li key={x.huong}>
              <button type="button" onClick={() => bam(x.huong)} aria-pressed={x.huong === chon}
                className={cn("inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors",
                  x.huong === chon ? "border-gold bg-gold/10 text-fg" : x.cat ? "border-jade/40 text-fg-muted hover:text-fg" : "border-line text-fg-faint hover:text-fg")}>
                {x.hang ? <b className="text-jade">{x.hang}</b> : null} {x.huong}
              </button>
            </li>
          ))}
        </ul>
        {/* Vùng thông báo giữ nguyên (không đổi key) để trình đọc màn hình đọc nội dung mới; khối bên trong đổi key để chạy hiệu ứng. */}
        <div aria-live="polite">
        {h && (
          <div key={chon} data-testid="la-ban-chi-tiet"
            className={cn("mt-3 rounded-2xl border p-4 motion-safe:animate-[muc-hien_0.35s_ease-out]", h.cat ? "border-jade/40 bg-jade/5" : "border-line bg-cinnabar/5")}>
            <p className="text-sm text-fg-faint">{h.hang ? `Hướng tốt hạng ${h.hang}` : h.cat ? "Hướng tốt" : "Hướng nên tránh"}</p>
            <p className="mt-0.5 text-xl text-fg"><b>{h.huong}</b>{h.du_nien ? <> · <span className={h.cat ? "text-jade" : "text-cinnabar"}>{h.du_nien}</span></> : null}</p>
            {h.mot_cau && <p className="mt-2 leading-relaxed text-fg">{h.mot_cau[0]!.toUpperCase() + h.mot_cau.slice(1)}.</p>}
            {h.dung && <p className="mt-1 text-sm text-fg-muted">{h.cat ? "Hợp đặt" : "Nên để"}: {h.dung}.</p>}
            {h.do && h.son?.length ? (
              <p className="mt-2 text-sm text-fg-muted">Trên la bàn: từ {so(h.do.tu)}° đến {so(h.do.den)}° (ba sơn {h.son.join(", ")}).</p>
            ) : null}
            {trungNam.has(chon) && (
              <p className="mt-2 rounded-xl border border-moon/40 bg-moon/10 px-3 py-2 text-sm text-fg-muted">
                Năm {namNay?.nam} có {trungNam.get(chon)!.join(", ")} bay tới phía này: hướng vẫn tốt, chỉ nên giữ yên năm đó (tránh đào sửa, khởi công).
              </p>
            )}
            {h.sach?.han && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-gold">Sách xưa ghi</summary>
                <p className="mt-1.5 leading-relaxed text-fg-muted">{h.sach.y}</p>
                <p className="mt-1 font-serif text-fg-faint" lang="zh-Hant">{h.sach.han}</p>
              </details>
            )}
            {!h.du_nien && !h.cat && <p className="mt-2 text-sm text-fg-muted">Một trong bốn hướng nên tránh của cung {quai}.</p>}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
