"use client";
// SX-1 — "Sách xưa nói gì về lá số của bạn": engine CHỌN các câu nguyên văn đã có trong kho tri thức (mỗi câu đã đối chiếu
// kho nguồn cổ thư) ứng với đúng dữ kiện của lá số; web chỉ hiển thị. Lời Việt đứng trước, nguyên văn chữ Hán gập bên dưới.
import { useState } from "react";
import { BookOpenText, ChevronDown } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

export interface CauSachXua { loai: string; ve: string; sach: string; han: string; y: string; phien_am?: string }

const CHU = {
  vi: { tieu_de: "Sách xưa nói gì về lá số của bạn", mo_ta: (n: number) => `${n} câu chép trong cổ thư ứng với đúng lá số này. Lời Việt là phần tóm ý của ban biên tập; bấm vào từng câu để xem nguyên văn.`,
    nguyen_van: "Nguyên văn", chan: "Sách xưa viết cho người thời đó; đây là văn hoá để tham khảo và tự soi, không phải lời đoán trước điều gì sẽ xảy ra." },
  en: { tieu_de: "What the classics say about your chart", mo_ta: (n: number) => `${n} passages from the classical texts that match this chart. The English lines are our editors' summaries; open any card to see the original.`,
    nguyen_van: "Original text", chan: "These books were written for readers of their own time. Treat them as culture and a mirror for reflection, not as a forecast of what will happen." },
};

/** WS-3: Phong thuỷ dùng chung khối này ("… về nhà của bạn"). `tinh` = trang dựng ở máy chủ (trang kiến thức): nguyên văn nằm
 *  trong `<details>` thuần HTML — có sẵn trong HTML cho máy tìm kiếm, mở được không cần JS. */
export function SachXuaNoi({ ds, moDun, en = false, tieuDe, moTa, tinh = false }: {
  ds?: CauSachXua[] | null; moDun: "tuvi" | "battu" | "phongthuy"; en?: boolean; tieuDe?: string; moTa?: string; tinh?: boolean;
}) {
  const chu = { ...(en ? CHU.en : CHU.vi), ...(tieuDe ? { tieu_de: tieuDe } : {}) };
  const [mo, setMo] = useState<number | null>(null);
  if (!ds?.length) return null;
  return (
    <section className="glass space-y-4 rounded-[1.25rem] p-5 sm:p-6" data-testid="sach-xua" aria-labelledby={`sach-xua-${moDun}`}>
      <div>
        <h2 id={`sach-xua-${moDun}`} className="flex items-center gap-2 font-serif text-xl sm:text-2xl">
          <BookOpenText className="size-5 text-gold" aria-hidden /> {chu.tieu_de}
        </h2>
        <p className="mt-1 text-sm text-fg-muted">
          {moTa ?? chu.mo_ta(ds.length)}
        </p>
      </div>
      <ol className="grid gap-3 md:grid-cols-2">
        {ds.map((c, i) => (
          <li key={`${c.loai}-${i}`} className="rounded-xl border border-gold/25 bg-gold/[0.04] p-4">
            <p className="text-xs uppercase tracking-wide text-gold">{c.ve}</p>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed">{c.y}</p>
            {tinh ? (
              <details className="mt-2 text-xs text-fg-muted">
                <summary className="inline-flex min-h-[44px] cursor-pointer items-center gap-1 hover:text-fg">{chu.nguyen_van} · {c.sach}</summary>
                <div className="mt-1 space-y-1 border-l-2 border-gold/40 pl-3 text-sm text-fg" data-testid="sach-xua-han">
                  <p lang="zh-Hant" className="font-serif leading-relaxed">{c.han}</p>
                  {c.phien_am && <p className="text-xs italic text-fg-muted">{c.phien_am}</p>}
                </div>
              </details>
            ) : (<>
            <button type="button" aria-expanded={mo === i}
              className="mt-2 inline-flex min-h-[44px] items-center gap-1 text-xs text-fg-muted hover:text-fg"
              onClick={() => { const moi = mo === i ? null : i; setMo(moi); if (moi !== null) ghi("chart_interacted", { mo_dun: moDun, kind: "sach_xua_mo", muc: c.loai }); }}>
              {chu.nguyen_van} · {c.sach} <ChevronDown className={cn("size-3.5 transition-transform", mo === i && "rotate-180")} aria-hidden />
            </button>
            {mo === i && (
              <div className="mt-1 space-y-1 border-l-2 border-gold/40 pl-3 text-sm" data-testid="sach-xua-han">
                <p lang="zh-Hant" className="font-serif leading-relaxed">{c.han}</p>
                {c.phien_am && <p className="text-xs italic text-fg-muted">{c.phien_am}</p>}
              </div>
            )}
            </>)}
          </li>
        ))}
      </ol>
      <p className="text-xs text-fg-faint">
        {chu.chan}
      </p>
    </section>
  );
}
