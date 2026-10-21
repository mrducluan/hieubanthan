"use client";
// CTA-1 — thẻ "Bản đồ 5 mảng" trên web: chòm sao năm điểm sáng (mỗi mảng một điểm có biểu tượng + nhãn), nền đêm sao, ánh
// vàng. Khi hiện: năm điểm lần lượt bật, đường nối vẽ dần, số đường đời đếm lên. Tắt hết khi người dùng chọn giảm
// chuyển động (hiện tĩnh, đủ chữ). Chỉ vẽ dữ liệu từ mã đã ký / engine — không tính gì.
import { useEffect, useLayoutEffect, useState } from "react";
import { animate, motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/chuyen-dong";
import { DIEM_BAN_DO, NOI_BAN_DO, type ManhBanDo } from "@/lib/the-ban-do";
import { cn } from "@/lib/utils";

// Toạ độ % tâm điểm sáng trong khung (dọc trên điện thoại, ngang từ sm) — cùng hình chòm sao với ảnh chia sẻ
// (DIEM_BAN_DO), dồn lên trên để chữ dưới mỗi điểm không tràn khung.
const PT = DIEM_BAN_DO.map(([x, y]) => [16 + (x - 200) * (68 / 600), 7 + ((y - 150) / 370) * 56] as const);

// Trang nhận thẻ render ở máy chủ: máy chủ không biết "giảm chuyển động" → mọi giá trị render ban đầu phải giống nhau ở
// hai phía (số đã đủ, motion cùng `initial`); chỉ thời lượng chuyển động đổi theo lựa chọn của người dùng.
const useTruocVe = typeof window === "undefined" ? useEffect : useLayoutEffect;

function useDemSo(den: number | null, giam: boolean, tre: number) {
  const [n, setN] = useState<number | null>(den);
  useTruocVe(() => {
    setN(den);
    if (den === null || giam) return;
    setN(1);
    const c = animate(1, den, { duration: 0.9, delay: tre, ease: EASE, onUpdate: (v) => setN(Math.round(v)) });
    return () => c.stop();
  }, [den, giam, tre]);
  return n;
}

/** Biểu tượng nhỏ trong điểm sáng (SVG 24×24, nét vàng). */
export function BieuTuongManh({ ma, className }: { ma: ManhBanDo["ma"]; className?: string }) {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      {ma === "so" && <><circle cx="12" cy="12" r="8.5" {...p} /><path d="M9 9.5 12 7v10" {...p} /></>}
      {ma === "nhat_chu" && <><circle cx="12" cy="12" r="4" {...p} />{[0, 45, 90, 135, 180, 225, 270, 315].map((g) => (
        <path key={g} d="M12 3.2v2.4" transform={`rotate(${g} 12 12)`} {...p} />))}</>}
      {ma === "sao" && <path d="M12 2.8 14 10l7.2 2-7.2 2-2 7.2-2-7.2-7.2-2L10 10z" {...p} />}
      {ma === "phi" && <><circle cx="12" cy="12" r="8.5" {...p} /><path d="m12 5.5 2.2 6.5L12 18.5 9.8 12z" {...p} /></>}
      {ma === "que" && <><path d="M5 7h14M5 12h5.5M13.5 12H19M5 17h14" {...p} /></>}
    </svg>
  );
}

export function TheBanDo({ tieuDe, manh, loiMoi, className, testId = "the-ban-do" }: {
  tieuDe: string; manh: ManhBanDo[]; loiMoi?: string; className?: string; testId?: string;
}) {
  const giam = Boolean(useReducedMotion());
  const soDD = manh[0] && /^\d+$/.test(manh[0].gia_tri) ? Number(manh[0].gia_tri) : null;
  const dem = useDemSo(soDD, giam, 0.35);
  const hien = (i: number) => ({
    initial: { opacity: 0, scale: 0.4 }, animate: { opacity: 1, scale: 1 },
    transition: giam ? { duration: 0 } : { duration: 0.55, delay: 0.25 + i * 0.22, ease: EASE },
  });
  return (
    <figure className={cn("bau-troi overflow-hidden px-2 py-4 sm:p-6", className)} data-testid={testId}>
      <figcaption className="text-center">
        <p className="eyebrow text-gold/80">hieuban.com · bản đồ 5 mảng</p>
        <p className="mt-1 font-serif text-2xl leading-tight sm:text-3xl">{tieuDe}</p>
      </figcaption>
      <div className="relative mx-auto mt-2 aspect-[4/5] w-full max-w-xl sm:aspect-[16/9]">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
          {NOI_BAN_DO.map(([a, b], i) => {
            const [x1, y1] = PT[a]!, [x2, y2] = PT[b]!;
            const ngoai = i < 5;
            return (
              <motion.line key={`${a}-${b}`} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={ngoai ? "rgb(var(--gold))" : "rgb(var(--moon))"} strokeOpacity={ngoai ? 0.6 : 0.3}
                strokeWidth={ngoai ? 0.38 : 0.25} strokeDasharray={ngoai ? undefined : "0.8 1.6"}
                {...(ngoai ? { initial: { pathLength: 0 }, animate: { pathLength: 1 },
                  transition: giam ? { duration: 0 } : { duration: 0.7, delay: 1.3 + i * 0.12, ease: EASE } }
                  : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: giam ? { duration: 0 } : { duration: 0.6, delay: 2 + i * 0.1 } })} />
            );
          })}
        </svg>
        {manh.map((m, i) => {
          const [x, y] = PT[i]!;
          return (
            <div key={m.ma} className="absolute w-[36%] -translate-x-1/2 sm:w-[26%]"
              style={{ left: `${x}%`, top: `${y}%`, marginTop: "-1.4rem" }} data-testid={`manh-${m.ma}`}>
            <motion.div className="flex flex-col items-center text-center" {...hien(i)}>
              <span className={cn("relative grid size-11 place-items-center rounded-full border sm:size-12",
                m.thieu ? "border-line bg-surface/80 text-fg-faint" : "border-gold/60 bg-[#1a1530] text-gold nhan-sang")}>
                <BieuTuongManh ma={m.ma} className="size-5 sm:size-6" />
              </span>
              <span className="mt-1 flex flex-col items-center rounded-lg bg-[#0d0b1d]/75 px-1.5 pb-0.5">
              <span className="mt-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.06em] text-fg-faint sm:text-[0.62rem] sm:tracking-[0.14em]">{m.nhom}</span>
              <span className={cn("font-serif leading-tight", i === 0 ? "text-3xl text-gradient-gold" : "text-[0.95rem] text-fg sm:text-lg",
                m.thieu && "text-fg-faint")} data-testid={i === 0 ? "ban-do-so" : undefined}>
                {i === 0 && dem !== null ? dem : m.gia_tri}
              </span>
              <span className="line-clamp-2 text-[0.7rem] leading-snug text-fg-muted">{m.phu}</span>
              </span>
            </motion.div>
            </div>
          );
        })}
      </div>
      {loiMoi && <p className="mt-1 text-center font-serif text-lg text-gold">{loiMoi}</p>}
    </figure>
  );
}
