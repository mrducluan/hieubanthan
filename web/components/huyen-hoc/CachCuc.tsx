"use client";
// KB-2 — cách cục quanh cung Mệnh: engine nhận diện theo điều kiện công bố, KB diễn giải (nháp AI).
// Không chấm điểm số phận; cách gặp lục sát chỉ ghi chú "giảm", không phán.
import { useState } from "react";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import type { LaSoOutputT } from "@/app/api/tuvi/schema";
import { cn } from "@/lib/utils";

type CC = NonNullable<LaSoOutputT["cach_cuc"]>[number];
const MAU: Record<CC["nhom"], string> = {
  "cát": "border-gold/50 bg-gold/[0.06]", "hung": "border-cinnabar/50 bg-cinnabar/[0.06]", "trung": "border-moon/40 bg-moon/[0.05]",
};
const NHAN: Record<CC["nhom"], string> = { "cát": "text-gold", "hung": "text-cinnabar", "trung": "text-moon" };

export function CachCuc({ ds, luuY, onHoi }: { ds: CC[]; luuY?: string; onHoi: (cau: string) => void }) {
  const [mo, setMo] = useState<string | null>(ds[0]?.ma ?? null);
  if (!ds.length) return null;
  return (
    <section aria-labelledby="tieu-de-cach-cuc" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="tieu-de-cach-cuc" className="text-2xl">Cách cục trong lá số</h2>
        <p className="text-xs text-fg-faint">{ds.length} cách · xét cung Mệnh và tam phương tứ chính</p>
      </div>
      <ul className="grid items-start gap-3 md:grid-cols-2" data-testid="cach-cuc">
        {ds.map((c) => {
          const dangMo = mo === c.ma;
          return (
            <li key={c.ma} className={cn("rounded-2xl border p-4 transition-colors", MAU[c.nhom])}>
              <button type="button" aria-expanded={dangMo} onClick={() => setMo(dangMo ? null : c.ma)} className="flex w-full items-start justify-between gap-3 text-left">
                <span>
                  <span className={cn("text-xs font-semibold uppercase tracking-[0.15em]", NHAN[c.nhom])}>{c.nhom === "cát" ? "Cát cách" : c.nhom === "hung" ? "Cần lưu ý" : "Đặc điểm"}</span>
                  <span className="mt-0.5 block font-serif text-xl">{c.ten} <span className="text-base text-fg-faint" style={{ fontFamily: "var(--font-han), serif" }}>{c.ten_han}</span></span>
                </span>
                <ChevronDown className={cn("mt-1 size-4 shrink-0 text-fg-faint transition-transform", dangMo && "rotate-180")} aria-hidden />
              </button>
              {dangMo && (
                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-fg-faint">{c.dieu_kien}</p>
                  <p>{c.y}</p>
                  {c.co_ca && (
                    <blockquote className="whitespace-pre-line border-l-2 border-gold/40 pl-3 font-serif italic text-fg-muted" data-testid="co-ca">
                      {c.co_ca}
                      <span className="mt-1 block text-xs not-italic text-fg-faint">— Phú cổ (phiên âm Hán Việt)</span>
                    </blockquote>
                  )}
                  <p><span className="text-fg-faint">Mặt tối: </span>{c.mat_toi}</p>
                  <p><span className="text-fg-faint">Gợi ý: </span>{c.loi_khuyen}</p>
                  {c.sat_hoi.length > 0 && <p className="text-xs text-cinnabar">Tam phương có {c.sat_hoi.join(", ")} hội về — sách xưa coi là giảm cách.</p>}
                  <button type="button" onClick={() => onHoi(`Cách cục ${c.ten} trong lá số của tôi nghĩa là gì?`)}
                    className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline">
                    <MessageCircleQuestion className="size-3.5" aria-hidden />Hỏi AI về cách này
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {luuY && <p className="text-xs text-fg-faint">{luuY}</p>}
    </section>
  );
}
