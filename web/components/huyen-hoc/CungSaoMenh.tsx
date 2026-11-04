"use client";
// TV-ZW "Cùng sao Mệnh" — một dòng: khoảng 1 trong N thời điểm sinh có cùng sao ở cung Mệnh như bạn. Engine đếm trên mẫu cố
// định (mọi ngày 1940–2010 × 12 canh giờ, không phải số người thật) và dựng hết chữ; web chỉ hiển thị. Thuật ngữ (tổ hợp
// chính tinh, cách đếm) nằm trong phần gập "Vì sao nói vậy". Đo: chỉ mã, không gửi sao hay tỉ lệ.
import { Sparkles } from "lucide-react";
import type { LaSoOutputT } from "@/app/api/tuvi/schema";
import { ghi } from "@/lib/do-luong";

export function CungSaoMenh({ d }: { d: LaSoOutputT["cung_sao_menh"] }) {
  if (!d) return null;
  return (
    <section className="rounded-2xl border border-line/70 bg-surface/40 px-4 py-3 sm:px-5" aria-label="Cùng sao Mệnh"
      data-testid="cung-sao-menh">
      <p className="flex gap-2.5 text-[0.97rem] leading-relaxed text-fg">
        <Sparkles aria-hidden className="mt-1 size-4 shrink-0 text-gold" />
        <span>{d.loi}</span>
      </p>
      <details className="mt-2 text-xs text-fg-faint"
        onToggle={(e) => { if ((e.currentTarget as HTMLDetailsElement).open) ghi("chart_interacted", { mo_dun: "tuvi", kind: "cung_sao_menh" }); }}>
        <summary className="cursor-pointer">Vì sao nói vậy</summary>
        <p className="mt-1 leading-relaxed">{d.can_cu}</p>
      </details>
    </section>
  );
}
