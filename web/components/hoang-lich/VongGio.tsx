"use client";
// HL-1 — "vòng 12 canh giờ": đồng hồ tròn, sáu giờ hoàng đạo sáng vàng, kim chỉ giờ hiện tại (giờ Việt Nam, chỉ khi
// đang xem hôm nay). Chỉ vẽ dữ liệu engine trả (thần trực từng giờ) — không tự tính hoàng đạo.
// Hiệu ứng (vòng sao xoay chậm, 12 cung hiện lần lượt, tia quét quanh vòng, giờ hoàng đạo sáng luân phiên, kim chỉ
// giờ hiện tại, rê chuột cung nổi lên) chỉ CSS và tắt khi người dùng chọn giảm chuyển động.
// `tamGioHienTai`: lõi giữa ghi giờ đang đi (chi · thần · hoàng/hắc đạo) thay cho tiêu đề — dữ liệu vẫn của engine.
import { useEffect, useId, useState } from "react";
import type { GioNgay } from "@/lib/hoang-lich";

const R_NGOAI = 96, R_TRONG = 62, TAM = 110;

function diem(goc: number, r: number): [number, number] {
  const rad = ((goc - 90) * Math.PI) / 180;
  return [TAM + r * Math.cos(rad), TAM + r * Math.sin(rad)];
}

/** Cung tròn hình quạt vành khăn cho canh giờ i (Tý ở đỉnh, đi theo chiều kim đồng hồ). */
function cung(i: number): string {
  const a = i * 30 - 15 + 1.2, b = i * 30 + 15 - 1.2;
  const [x1, y1] = diem(a, R_NGOAI), [x2, y2] = diem(b, R_NGOAI);
  const [x3, y3] = diem(b, R_TRONG), [x4, y4] = diem(a, R_TRONG);
  return `M${x1} ${y1} A${R_NGOAI} ${R_NGOAI} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${R_TRONG} ${R_TRONG} 0 0 0 ${x4} ${y4}Z`;
}

/** Canh giờ hiện tại CỦA NGÀY ĐANG XEM theo giờ Việt Nam: 00:00–00:59 = Tý (0), Sửu (1)… Hợi (11).
 *  23:00–23:59 đã là giờ Tý của NGÀY MAI → null (không đánh dấu trên vòng của hôm nay). */
export function canhGioHienTai(d: Date = new Date()): number | null {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", hourCycle: "h23" }).format(d));
  return h === 23 ? null : Math.floor((h + 1) / 2);
}

export function VongGio({ gio, laHomNay, tieuDe, phuDe, tamGioHienTai = false, className = "" }: {
  gio: GioNgay[]; laHomNay: boolean; tieuDe: string; phuDe?: string; tamGioHienTai?: boolean; className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const [bay, setBay] = useState<number | null>(null);
  useEffect(() => {
    if (!laHomNay) return;
    const capNhat = () => setBay(canhGioHienTai());
    capNhat();
    const t = setInterval(capNhat, 60_000);
    return () => clearInterval(t);
  }, [laHomNay]);

  return (
    <svg viewBox="0 0 220 220" role="img" className={`select-none ${className}`} data-testid="vong-gio"
      aria-label={`Vòng 12 canh giờ: giờ hoàng đạo ${gio.filter((g) => g.hoang_dao).map((g) => g.chi).join(", ")}`}>
      <defs>
        <radialGradient id={`nen-${id}`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="rgb(var(--gold))" stopOpacity="0.18" />
          <stop offset="55%" stopColor="rgb(var(--moon))" stopOpacity="0.06" />
          <stop offset="100%" stopColor="rgb(var(--bg))" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`vang-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgb(250 222 150)" />
          <stop offset="100%" stopColor="rgb(var(--gold))" />
        </linearGradient>
        <linearGradient id={`quet-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgb(255 236 190)" stopOpacity="0" />
          <stop offset="100%" stopColor="rgb(255 236 190)" stopOpacity="0.28" />
        </linearGradient>
        <filter id={`sang-${id}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="m" />
          <feMerge><feMergeNode in="m" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <circle cx={TAM} cy={TAM} r="108" fill={`url(#nen-${id})`} />
      {/* vòng sao ngoài cùng — xoay rất chậm */}
      <g className="origin-center motion-safe:animate-spin-slow" style={{ transformBox: "fill-box" }} aria-hidden>
        <circle cx={TAM} cy={TAM} r="104" fill="none" stroke="rgb(var(--gold) / 0.25)" strokeWidth="0.6" strokeDasharray="1 5" />
        {Array.from({ length: 24 }, (_, k) => {
          const [x, y] = diem(k * 15 + 7.5, 104);
          return <circle key={k} cx={x} cy={y} r={k % 3 === 0 ? 1.3 : 0.7} fill="rgb(var(--fg) / 0.55)" />;
        })}
      </g>
      {/* tia quét: một quạt sáng mờ đi vòng quanh 12 cung */}
      <g className="svg-tam tia-quet" aria-hidden>
        <circle cx={TAM} cy={TAM} r={R_NGOAI} fill="none" stroke="none" />
        <path d={`M${TAM} ${TAM} L${diem(-18, R_NGOAI).join(" ")} A${R_NGOAI} ${R_NGOAI} 0 0 1 ${diem(0, R_NGOAI).join(" ")}Z`} fill={`url(#quet-${id})`} />
      </g>
      {gio.map((g, i) => {
        const [tx, ty] = diem(i * 30, (R_NGOAI + R_TRONG) / 2);
        const dang = bay === i;
        const thuTuHd = gio.slice(0, i).filter((x) => x.hoang_dao).length;
        return (
          <g key={g.chi} className="svg-tam cung-hien" style={{ animationDelay: `${i * 0.06}s` }}>
           <g className={`svg-tam nut-so ${g.hoang_dao ? "cung-lap" : ""}`} style={g.hoang_dao ? { animationDelay: `${1.5 + thuTuHd * 2}s` } : undefined}>
            <path d={cung(i)}
              fill={g.hoang_dao ? `url(#vang-${id})` : "rgb(var(--surface-2, var(--surface)) / 0.9)"}
              fillOpacity={g.hoang_dao ? 0.92 : 1}
              stroke={dang ? "rgb(var(--fg))" : g.hoang_dao ? "rgb(var(--gold) / 0.9)" : "rgb(var(--line))"}
              strokeWidth={dang ? 1.8 : 0.8}
              filter={g.hoang_dao ? `url(#sang-${id})` : undefined}>
              <title>{`${g.chi} ${g.khung} — ${g.than} (${g.hoang_dao ? "hoàng đạo" : "hắc đạo"})`}</title>
            </path>
            <text x={tx} y={ty + 4} textAnchor="middle" fontSize="12.5" fontWeight={g.hoang_dao ? 700 : 600}
              fill={g.hoang_dao ? "rgb(28 22 10)" : "rgb(var(--fg))"} fillOpacity={g.hoang_dao ? 1 : 0.85}>{g.chi}</text>
           </g>
          </g>
        );
      })}
      {bay !== null && (() => {
        const [x, y] = diem(bay * 30, R_NGOAI + 6);
        return (
          <g data-testid="kim-gio">
            <circle cx={x} cy={y} r="6" fill="none" stroke="rgb(var(--gold))" strokeWidth="1" className="motion-safe:animate-twinkle" />
            <circle cx={x} cy={y} r="3.2" fill="rgb(var(--fg))" stroke="rgb(var(--gold))" strokeWidth="1"><title>Giờ hiện tại</title></circle>
          </g>
        );
      })()}
      <circle cx={TAM} cy={TAM} r={R_TRONG - 4} fill="rgb(var(--bg) / 0.92)" stroke="rgb(var(--gold) / 0.35)" strokeWidth="0.8" />
      <circle cx={TAM} cy={TAM} r={R_TRONG - 10} fill="none" stroke="rgb(var(--gold) / 0.18)" strokeWidth="0.6" strokeDasharray="1 3"
        className="svg-tam quay-nguoc" aria-hidden />
      {tamGioHienTai && bay !== null && gio[bay] ? (() => {
        const g = gio[bay]!;
        return (
          <g data-testid="tam-gio-hien-tai">
            <text x={TAM} y={TAM - 18} textAnchor="middle" fontSize="7.5" letterSpacing="1.4" fill="rgb(var(--fg-muted))">BÂY GIỜ</text>
            <text x={TAM} y={TAM + 2} textAnchor="middle" fontSize="17" fontFamily="var(--font-display), Georgia, serif"
              fill="rgb(var(--fg))">Giờ {g.chi}</text>
            <text x={TAM} y={TAM + 15} textAnchor="middle" fontSize="8.5" fill="rgb(var(--gold))">{g.than}</text>
            <text x={TAM} y={TAM + 28} textAnchor="middle" fontSize="7.5" letterSpacing="1.2" fontWeight={700}
              fill={g.hoang_dao ? "rgb(var(--gold))" : "rgb(var(--moon))"}>{g.hoang_dao ? "HOÀNG ĐẠO" : "HẮC ĐẠO"}</text>
          </g>
        );
      })() : (
        <>
          <text x={TAM} y={TAM - 6} textAnchor="middle" fontSize="15" fontFamily="var(--font-display), Georgia, serif"
            fill="rgb(var(--gold))">{tieuDe}</text>
          {phuDe && <text x={TAM} y={TAM + 13} textAnchor="middle" fontSize="9" letterSpacing="1.5" fill="rgb(var(--fg-muted))">{phuDe}</text>}
        </>
      )}
    </svg>
  );
}
