"use client";
// La bàn 8 hướng + vòng 24 Sơn (tải từ engine /api/phongthuy/tam-yeu/la-ban-24-son; web chỉ vẽ, không tự tính độ).
// Tô ngọc = hướng cát, chu sa nhạt = hướng hung (theo `huong_cat` engine trả). Bấm cung để xem chi tiết nhanh.
import { useEffect, useState } from "react";
import { useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { ghi } from "@/lib/do-luong";
import { son24DaCo, taiSon24, type MucSon24 } from "@/lib/la-ban-24-son";

const HUONG = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];

function cung(i: number, r0: number, r1: number) {
  const a0 = ((i * 45 - 22.5 - 90) * Math.PI) / 180, a1 = ((i * 45 + 22.5 - 90) * Math.PI) / 180;
  const p = (r: number, a: number) => `${(100 + r * Math.cos(a)).toFixed(2)} ${(100 + r * Math.sin(a)).toFixed(2)}`;
  return `M ${p(r0, a0)} L ${p(r1, a0)} A ${r1} ${r1} 0 0 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
}

export function LaBan({ quai, nhom, bang, huongCat }: { quai: string; nhom: string; bang: Record<string, string>; huongCat: string[] }) {
  // EN-ALL GĐ 5: mã (hướng, du niên, quái, nhóm) hiện qua tên Anh ở bản Anh; du niên ở ô chật dùng tên gọn ("Sheng Qi").
  const { c, en, huong, duNien, quai: tq, nhom: tn } = useChuPT();
  const [son24, setSon24] = useState<MucSon24[] | null>(() => son24DaCo());
  const [hien24, setHien24] = useState(true);
  const [chon, setChon] = useState<string | null>(null);

  useEffect(() => {
    if (son24DaCo()) { setSon24(son24DaCo()); return; }
    let huy = false;
    taiSon24().then((ds) => { if (!huy && ds) setSon24(ds); });
    return () => { huy = true; };
  }, []);

  const bam = (h: string) => {
    setChon((cu) => (cu === h ? null : h));
    ghi("chart_interacted", { mo_dun: "phongthuy", kind: "la_ban_menh_quai", huong: h });
  };

  const sonTheoHuong = chon && son24 ? son24.filter((s) => s.phuong === chon) : [];

  return (
    <figure className="mx-auto w-full max-w-sm">
      <svg viewBox="0 0 200 200" role="img" aria-label={c("lb.aria", { quai: tq(quai) })} className="h-auto w-full select-none">
        {/* Vòng 24 Sơn ngoài cùng (chỉ vẽ khi dữ liệu từ engine đã sẵn sàng và đang bật) */}
        {hien24 && son24 && (
          <g data-testid="vong-24-son">
            <circle cx="100" cy="100" r="98" fill="none" stroke="rgb(var(--gold) / 0.35)" strokeWidth="0.6" />
            {son24.map((s) => {
              const a = ((s.do_tam - 90) * Math.PI) / 180;
              const aBien = ((s.do_tu - 90) * Math.PI) / 180;
              const cat = huongCat.includes(s.phuong);
              return (
                <g key={s.son}>
                  <line
                    x1={(100 + 84 * Math.cos(aBien)).toFixed(2)} y1={(100 + 84 * Math.sin(aBien)).toFixed(2)}
                    x2={(100 + 98 * Math.cos(aBien)).toFixed(2)} y2={(100 + 98 * Math.sin(aBien)).toFixed(2)}
                    stroke="rgb(var(--line))" strokeWidth={s.stt % 3 === 0 ? "0.7" : "0.35"} />
                  <text
                    x={(100 + 91.2 * Math.cos(a)).toFixed(2)} y={(100 + 91.2 * Math.sin(a) + 1.6).toFixed(2)}
                    textAnchor="middle" fontSize="4.6"
                    fill={cat ? "rgb(var(--jade))" : "rgb(var(--fg-faint))"}
                    transform={`rotate(${s.do_tam} ${(100 + 91.2 * Math.cos(a)).toFixed(2)} ${(100 + 91.2 * Math.sin(a)).toFixed(2)})`}>
                    {en ? s.ky_hieu_han : s.son}
                  </text>
                </g>
              );
            })}
          </g>
        )}
        {HUONG.map((h, i) => {
          const cat = huongCat.includes(h);
          const a = ((i * 45 - 90) * Math.PI) / 180;
          const rNgoai = hien24 && son24 ? 83 : 96;
          const rChu = hien24 && son24 ? 62 : 76;
          const dangChon = chon === h;
          return (
            <g key={h} role="button" tabIndex={0} aria-pressed={dangChon}
              className="cursor-pointer outline-none [&:focus-visible>path]:stroke-gold"
              onClick={() => bam(h)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); bam(h); } }}>
              <path d={cung(i, 36, rNgoai)} fill={cat ? "rgb(var(--jade) / 0.16)" : "rgb(var(--cinnabar) / 0.07)"}
                stroke={dangChon ? "rgb(var(--gold))" : "rgb(var(--line))"} strokeWidth={dangChon ? "1.4" : "0.6"}
                className="transition-[stroke,stroke-width] duration-200 motion-reduce:transition-none" />
              <text x={(100 + rChu * Math.cos(a)).toFixed(2)} y={(100 + rChu * Math.sin(a) - 3).toFixed(2)} textAnchor="middle" fontSize={hien24 && son24 ? "6.8" : "7.5"} fill="rgb(var(--fg))" pointerEvents="none">{huong(h)}</text>
              <text x={(100 + rChu * Math.cos(a)).toFixed(2)} y={(100 + rChu * Math.sin(a) + 6).toFixed(2)} textAnchor="middle" fontSize={hien24 && son24 ? "5.8" : "6.5"} pointerEvents="none"
                fill={cat ? "rgb(var(--jade))" : "rgb(var(--cinnabar))"}>{duNien(bang[h], true)}</text>
            </g>
          );
        })}
        <circle cx="100" cy="100" r="34" fill="rgb(var(--surface))" stroke="rgb(var(--gold) / 0.6)" />
        <text x="100" y="98" textAnchor="middle" fontSize="14" fontFamily="var(--font-display)" fill="rgb(var(--gold))">{tq(quai)}</text>
        <text x="100" y="110" textAnchor="middle" fontSize="6.2" fill="rgb(var(--fg-muted))">{tn(nhom)}</text>
      </svg>
      <figcaption className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-fg-muted">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-jade/40" />{` ${c("lb.cat")}`}</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-cinnabar/30" />{` ${c("lb.hung")}`}</span>
        {son24 && (
          <button type="button" onClick={() => setHien24((v) => !v)}
            className="rounded-full border border-line px-2 py-0.5 text-[11px] text-fg-muted hover:border-gold hover:text-fg">
            {en ? (hien24 ? "Hide 24 Mountains" : "Show 24 Mountains") : (hien24 ? "Ẩn vòng 24 Sơn" : "Hiện vòng 24 Sơn")}
          </button>
        )}
      </figcaption>
      {chon && (
        <div className="mt-2 rounded-xl border border-line bg-surface/60 px-3 py-2 text-center text-xs text-fg-muted" aria-live="polite">
          <b className="text-fg">{huong(chon)}</b> · <span className={huongCat.includes(chon) ? "text-jade" : "text-cinnabar"}>{duNien(bang[chon], false)}</span>
          {sonTheoHuong.length > 0 && (
            <span> · {en ? "3 Mountains" : "3 sơn"}: {sonTheoHuong.map((s) => `${s.son} (${s.do_tam}°)`).join(", ")}</span>
          )}
        </div>
      )}
    </figure>
  );
}
