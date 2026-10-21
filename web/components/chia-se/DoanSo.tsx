"use client";
// CTA-1 — trò "Đoán số" trên trang nhận thẻ Bản đồ 5 mảng: người nhận đoán đường đời của người gửi (3 lựa chọn — đáp án
// nằm trong mã đã ký), lật thẻ ra đáp án + lời giải nhỏ (từ khoá engine), đúng thì sao lấp lánh, rồi mời tự xem bản đồ
// của mình (?tu= đo referral). Không lưu gì; chỉ đo guess_played{dung, bien_the}.
import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TheBanDo } from "@/components/chia-se/TheBanDo";
import { ghi } from "@/lib/do-luong";
import { EASE } from "@/lib/chuyen-dong";
import { bienThe, dien, manhBanDo } from "@/lib/the-ban-do";
import type { NoiDungMaBanDo } from "@/lib/ma-moi";
import { cn } from "@/lib/utils";

const TIA: [number, number][] = [[-70, -40], [70, -44], [-90, 18], [92, 14], [-46, 64], [50, 66], [0, -78], [4, 82]];

function LapLanh() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center" data-testid="lap-lanh">
      {TIA.map(([dx, dy], i) => (
        <span key={i} className="lap-lanh absolute text-gold" style={{ "--dx": `${dx}px`, "--dy": `${dy}px`, animationDelay: `${i * 40}ms`, fontSize: i % 2 ? 14 : 20 } as React.CSSProperties}>✦</span>
      ))}
    </span>
  );
}

export function DoanSo({ nd, tu }: { nd: Omit<NoiDungMaBanDo, "v">; tu: string }) {
  const [chon, setChon] = useState<number | null>(null);
  const [boQua, setBoQua] = useState(false);
  const giam = Boolean(useReducedMotion());
  const bt = bienThe(nd.b);
  const lo = chon !== null || boQua;
  const dung = chon === nd.s;
  const maBien = `b${nd.b}`;

  const doan = (x: number) => {
    if (lo) return;
    setChon(x);
    ghi("guess_played", { dung: x === nd.s ? 1 : 0, bien_the: maBien });
  };

  return (
    <div className="space-y-6">
      <TheBanDo tieuDe={dien(bt.tieuDe, nd.t)} manh={manhBanDo(nd, !lo)} />

      <section aria-labelledby="doan-so" className="glass rounded-2xl p-5 text-center" data-testid="doan-so">
        <h2 id="doan-so" className="font-serif text-2xl leading-snug">{dien(bt.doan, nd.t)}</h2>
        <div className="lat-3d mx-auto mt-5 h-40 w-32">
          <motion.div className="relative size-full [transform-style:preserve-3d]"
            animate={{ rotateY: lo ? 180 : 0 }} transition={giam ? { duration: 0 } : { duration: 0.7, ease: EASE }}>
            <div className="lat-mat absolute inset-0 grid place-items-center rounded-2xl border border-gold/40 bg-gradient-to-b from-surface-2 to-bg shadow-card">
              <span className="font-serif text-6xl text-gold/80">?</span>
            </div>
            <div className="lat-mat absolute inset-0 flex flex-col items-center justify-center rounded-2xl border border-gold/60 bg-[#1a1530] px-2 shadow-card [transform:rotateY(180deg)]"
              data-testid="dap-an">
              <span className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-fg-faint">Đường đời</span>
              <span className="text-gradient-gold font-serif text-6xl leading-none">{lo ? nd.s : ""}</span>
            </div>
            {dung && <LapLanh />}
          </motion.div>
        </div>

        {!lo ? (
          <>
            <div className="mt-5 flex justify-center gap-3" role="group" aria-label="Chọn một con số">
              {nd.o.map((x) => (
                <button key={x} type="button" onClick={() => doan(x)} data-testid={`doan-${x}`}
                  className="grid size-14 place-items-center rounded-full border border-gold/50 bg-surface font-serif text-2xl text-fg transition hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold">
                  {x}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setBoQua(true)} className="mt-4 inline-flex items-center gap-1.5 text-xs text-fg-faint hover:text-fg">
              <Eye className="size-3.5" aria-hidden /> Xem luôn, không đoán
            </button>
          </>
        ) : (
          <div className="mt-5 space-y-2" aria-live="polite">
            {chon !== null && (
              <p className={cn("font-serif text-xl", dung ? "text-jade" : "text-gold")} data-testid="ket-qua-doan">
                {dung ? `Trúng rồi! Bạn hiểu ${nd.t} hơn bạn nghĩ.` : `Chưa trúng — đường đời của ${nd.t} là ${nd.s}.`}
              </p>
            )}
            <p className="text-sm text-fg-muted">Số {nd.s} thường được tả là: <b className="text-fg">{nd.k.toLowerCase()}</b>.</p>
          </div>
        )}
      </section>

      {lo && (
        <motion.section initial={giam ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
          className="text-center">
          <p className="font-serif text-2xl">{bt.sauDoan}</p>
          <p className="mt-1 text-sm text-fg-muted">{bt.loiMoi}</p>
          <Button asChild size="lg" className="mt-4">
            <Link href={`/?tu=${tu}`} data-testid="xem-ban-do-cua-ban"
              onClick={() => ghi("cross_cta_clicked", { tu: "the_ban_do", den: "trang_chu", bien_the: maBien, ca_nhan: 0 })}>
              {bt.nutXem} <ArrowRight aria-hidden />
            </Link>
          </Button>
          <p className="mt-2 text-xs text-fg-faint">Không cần tài khoản · ngày sinh của bạn chỉ dùng để tính</p>
        </motion.section>
      )}
    </div>
  );
}
