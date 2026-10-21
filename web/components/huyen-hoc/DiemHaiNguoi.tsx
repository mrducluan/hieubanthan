"use client";
// HN-2N — "Xem lá số 2 người": vòng điểm tham khảo 0–100 + thanh từng tiêu chí. Engine chấm hết (luật `hai_nguoi_1`,
// luangiai/tuvi_hai_nguoi.py); web chỉ vẽ. Màu dịu: lục (hợp) · vàng (bình hoà) · hổ phách (cần dung hoà) — không đỏ.
// Chuyển động đếm số / kéo thanh tắt khi người dùng bật "giảm chuyển động".
import { useEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import type { DiemHaiNguoiT, TieuChiDiemT } from "@/app/api/tuvi/schema";
import { ViSao } from "@/components/luan-giai/HopNoiBat";
import { EASE } from "@/lib/chuyen-dong";
import { cn } from "@/lib/utils";

const MAU_KET_LUAN: Record<string, string> = {
  hop: "rgb(var(--jade))",
  binh_hoa: "rgb(var(--gold))",
  can_dung_hoa: "rgb(245 170 80)",
};
const MAU_MUC: Record<string, string> = {
  de_hoa_hop: "rgb(var(--jade))",
  hop_neu_hieu: "rgb(var(--gold))",
  can_dung_hoa_nhieu: "rgb(245 170 80)",
  nhieu_khac_biet: "rgb(224 150 90)",
};

function useDemSo(den: number, giam: boolean) {
  const [n, setN] = useState(giam ? den : 0);
  useEffect(() => {
    if (giam) { setN(den); return; }
    const c = animate(0, den, { duration: 1.1, ease: EASE, onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [den, giam]);
  return n;
}

const R = 52;
const CHU_VI = 2 * Math.PI * R;

function VongDiem({ tong, muc, nhan }: { tong: number; muc: string; nhan: string }) {
  const giam = Boolean(useReducedMotion());
  const n = useDemSo(tong, giam);
  const mau = MAU_MUC[muc] ?? MAU_MUC.hop_neu_hieu;
  const lech = CHU_VI * (1 - tong / 100);
  return (
    <div className="relative size-36 shrink-0 sm:size-40" data-testid="diem-tong" data-diem={tong}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" role="img" aria-label={`Điểm tham khảo ${tong} trên 100 — ${nhan}`}>
        <circle cx="60" cy="60" r={R} fill="none" stroke="currentColor" strokeWidth="9" className="text-line/60" />
        <motion.circle cx="60" cy="60" r={R} fill="none" stroke={mau} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={CHU_VI}
          {...(giam ? { strokeDashoffset: lech } : {
            initial: { strokeDashoffset: CHU_VI }, animate: { strokeDashoffset: lech },
            transition: { duration: 1.1, ease: EASE },
          })} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden>
        <span className="font-serif text-4xl leading-none tabular-nums text-fg sm:text-5xl">{n}</span>
        <span className="mt-1 text-xs text-fg-faint">/ 100</span>
      </div>
    </div>
  );
}

/** `gon`: tiêu chí đã có hộp nổi bật bên dưới → chỉ hiện mô tả ngắn, lời đầy đủ nằm trong hộp (không lặp chữ). */
function ThanhTieuChi({ t, i, gon }: { t: TieuChiDiemT; i: number; gon: boolean }) {
  const giam = useReducedMotion();
  const phan = t.toi_da > 0 ? Math.round((t.diem / t.toi_da) * 100) : 0;
  const mau = t.ket_luan ? MAU_KET_LUAN[t.ket_luan] : undefined;
  return (
    <li className="space-y-1.5" data-testid={`tieu-chi-${t.ma}`} data-tinh={t.tinh ? "1" : "0"}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
        <span className="min-w-0 text-[0.95rem] font-medium text-fg">{t.ten}</span>
        <span className="flex items-baseline gap-2 text-sm">
          {t.tinh && t.nhan_ket_luan ? (
            <span className="rounded-full px-2 py-0 text-xs font-medium" style={{ color: mau, backgroundColor: `color-mix(in srgb, ${mau} 14%, transparent)` }}>
              {t.nhan_ket_luan}
            </span>
          ) : <span className="text-xs text-fg-faint">Chưa tính</span>}
          {t.tinh && <span className="tabular-nums text-fg-muted">{t.diem}/{t.toi_da}</span>}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        {t.tinh && (
          <motion.div className="h-full rounded-full" style={{ backgroundColor: mau, ...(giam ? { width: `${phan}%` } : {}) }}
            {...(giam ? {} : {
              initial: { width: "0%" }, animate: { width: `${phan}%` },
              transition: { delay: 0.25 + i * 0.09, duration: 0.7, ease: EASE },
            })} />
        )}
      </div>
      <p className={cn("text-sm leading-relaxed", t.tinh && !gon ? "text-fg-muted" : "text-fg-faint")}>
        {gon && t.mo_ta ? t.mo_ta : t.giai_thich}
      </p>
      <ViSao canCu={t.can_cu} nho />
    </li>
  );
}

export function DiemHaiNguoi({ diem }: { diem: DiemHaiNguoiT }) {
  // Mã hộp: hn.<tiêu chí>.<loại>.<quan hệ>
  const coHop = new Set([...diem.diem_manh, ...diem.can_dung_hoa].map((h) => h.ma_mau?.split(".")[1]).filter(Boolean));
  return (
    <section className="glass rounded-2xl p-4 sm:p-5" aria-labelledby="diem-hai-nguoi" data-testid="diem-hai-nguoi">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:text-left">
        <VongDiem tong={diem.tong} muc={diem.muc} nhan={diem.nhan_muc} />
        <div className="min-w-0">
          <p className="eyebrow">Điểm tham khảo</p>
          <h3 id="diem-hai-nguoi" className="mt-1 font-serif text-2xl leading-tight" style={{ color: MAU_MUC[diem.muc] }} data-testid="diem-muc">
            {diem.nhan_muc}
          </h3>
          <p className="sr-only">Điểm tham khảo: {diem.tong}/100.</p>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-fg-muted">{diem.mo_ta_muc}</p>
        </div>
      </div>
      <ul className="mt-5 space-y-4">
        {diem.tieu_chi.map((t, i) => <ThanhTieuChi key={t.ma} t={t} i={i} gon={coHop.has(t.ma)} />)}
      </ul>
      <p className="mt-4 border-t border-line/50 pt-3 text-xs leading-relaxed text-fg-faint" data-testid="diem-loi-dan">{diem.loi_dan}</p>
    </section>
  );
}
