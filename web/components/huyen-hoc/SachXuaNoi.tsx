"use client";
// SX-1 — "Sách xưa nói gì về lá số của bạn": engine CHỌN các câu nguyên văn đã có trong kho tri thức (mỗi câu đã đối chiếu
// kho nguồn cổ thư) ứng với đúng dữ kiện của lá số; web chỉ hiển thị. Lời Việt đứng trước, nguyên văn chữ Hán gập bên dưới.
import { useState } from "react";
import { BookOpenText, ChevronDown } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";
import { useChuBaoCao } from "@/components/luan-giai/chu-bao-cao";

export interface CauSachXua { loai: string; ve: string; sach: string; han: string; y: string; phien_am?: string }

// Chữ cố định đọc từ catalog khung báo cáo (lib/chu/bao-cao.ts, khoá `sach_xua.*`) theo ngôn ngữ trang.
export function SachXuaNoi({ ds, moDun }: { ds?: CauSachXua[] | null; moDun: "tuvi" | "battu" }) {
  const { c: chu } = useChuBaoCao();
  const [mo, setMo] = useState<number | null>(null);
  if (!ds?.length) return null;
  return (
    <section className="glass space-y-4 rounded-[1.25rem] p-5 sm:p-6" data-testid="sach-xua" aria-labelledby={`sach-xua-${moDun}`}>
      <div>
        <h2 id={`sach-xua-${moDun}`} className="flex items-center gap-2 font-serif text-xl sm:text-2xl">
          <BookOpenText className="size-5 text-gold" aria-hidden /> {chu("sach_xua.tieu_de")}
        </h2>
        <p className="mt-1 text-sm text-fg-muted">
          {chu("sach_xua.mo_ta", { so: String(ds.length) })}
        </p>
      </div>
      <ol className="grid gap-3 md:grid-cols-2">
        {ds.map((c, i) => (
          <li key={`${c.loai}-${i}`} className="rounded-xl border border-gold/25 bg-gold/[0.04] p-4">
            <p className="text-xs uppercase tracking-wide text-gold">{c.ve}</p>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed">{c.y}</p>
            <button type="button" aria-expanded={mo === i}
              className="mt-2 inline-flex min-h-[44px] items-center gap-1 text-xs text-fg-muted hover:text-fg"
              onClick={() => { const moi = mo === i ? null : i; setMo(moi); if (moi !== null) ghi("chart_interacted", { mo_dun: moDun, kind: "sach_xua_mo", muc: c.loai }); }}>
              {chu("sach_xua.nguyen_van")} · {c.sach} <ChevronDown className={cn("size-3.5 transition-transform", mo === i && "rotate-180")} aria-hidden />
            </button>
            {mo === i && (
              <div className="mt-1 space-y-1 border-l-2 border-gold/40 pl-3 text-sm" data-testid="sach-xua-han">
                <p lang="zh-Hant" className="font-serif leading-relaxed">{c.han}</p>
                {c.phien_am && <p className="text-xs italic text-fg-muted">{c.phien_am}</p>}
              </div>
            )}
          </li>
        ))}
      </ol>
      <p className="text-xs text-fg-faint">
        {chu("sach_xua.chan")}
      </p>
    </section>
  );
}
