"use client";
// Gate 1 — cuối mỗi bài đọc (mọi mảng): mốc "đọc xong" (reading_completed khi cuộn tới, mỗi phiên một lần mỗi mảng)
// + góp ý 1 chạm (feedback_submitted, huu_ich) + chỗ cho lời mời chia sẻ của mảng (Gate 2). Đặt SAU phần bài đọc.
import { useEffect, useRef, type ReactNode } from "react";
import { batDauDoc, docXong } from "@/lib/do-luong";
import { GopY } from "./GopY";

/** Ghi reading_started một lần khi `sanSang` (kết quả của mảng đã hiện). */
export function useBatDauDoc(moDun: string, sanSang: boolean): void {
  useEffect(() => { if (sanSang) batDauDoc(moDun); }, [moDun, sanSang]);
}

/** Mốc vô hình: cuộn tới → reading_completed. */
export function MocDocXong({ moDun, them }: { moDun: string; them?: Record<string, unknown> }) {
  const ref = useRef<HTMLDivElement>(null);
  const thamSo = useRef(them);
  thamSo.current = them;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e?.isIntersecting) { docXong(moDun, thamSo.current); io.disconnect(); }
    }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, [moDun]);
  return <div ref={ref} aria-hidden className="h-px w-full" data-testid={`doc-xong-${moDun}`} />;
}

export function CuoiBaiDoc({ moDun, cauHoi, chiaSe }: { moDun: string; cauHoi?: string; chiaSe?: ReactNode }) {
  return (
    <section aria-label="Góp ý bài đọc" className="mt-10 space-y-6">
      <MocDocXong moDun={moDun} />
      <GopY moDun={moDun} cauHoi={cauHoi} />
      {chiaSe}
    </section>
  );
}
