"use client";
import { motion, useReducedMotion } from "motion/react";
import type { ViTriLuanGiai } from "@/lib/engine";
import { VongLacThu } from "./VongLacThu";
import { EASE } from "@/lib/chuyen-dong";

// Khoảnh khắc "được hiểu": một con số lớn + từ khoá + một câu (docs/THIET-KE-UI.md §4.1).
export function SoLon({ vt, tenGoi }: { vt: ViTriLuanGiai; tenGoi: string }) {
  const giam = useReducedMotion();
  const vao = (tre: number) =>
    giam ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: tre, duration: 0.6, ease: EASE } };
  return (
    <section className="flex flex-col items-center text-center" aria-labelledby="so-chu-dao">
      <motion.p {...vao(0)} className="eyebrow">{tenGoi}, con số đường đời của bạn là</motion.p>
      <div className="relative my-4 grid size-56 place-items-center sm:size-64">
        <VongLacThu className="absolute inset-0 size-full" quay />
        <div className="absolute inset-[22%] rounded-full bg-gold/10 blur-2xl" aria-hidden />
        <motion.span
          id="so-chu-dao"
          data-testid="so-duong-doi"
          {...(giam ? {} : { initial: { opacity: 0, scale: 0.6, filter: "blur(12px)" }, animate: { opacity: 1, scale: 1, filter: "blur(0px)" }, transition: { delay: 0.15, duration: 0.9, ease: EASE } })}
          className="text-gradient-gold relative font-serif text-[7rem] leading-none sm:text-[8.5rem]"
        >
          {vt.gia_tri}
        </motion.span>
      </div>
      {vt.nghia && (
        <>
          <motion.h1 {...vao(0.5)} className="text-3xl sm:text-4xl">{vt.nghia.tu_khoa}</motion.h1>
          {vt.nghia.so_cai && (
            <motion.p {...vao(0.6)} className="mt-2 text-xs font-semibold uppercase tracking-widest text-gold">Số cái — giữ nguyên, không rút gọn</motion.p>
          )}
          <motion.p {...vao(0.7)} className="mt-3 max-w-md text-fg-muted">{vt.khung.charAt(0).toUpperCase() + vt.khung.slice(1)}.</motion.p>
        </>
      )}
    </section>
  );
}
