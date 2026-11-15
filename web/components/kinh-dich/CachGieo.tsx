"use client";
// UI-KD 3 — "Cách gieo đồng xu thật (1 phút)" + "Hỏi thế nào cho đúng": hướng dẫn thao tác gập lại, 3 bước có hình vẽ nét
// (cùng khuôn `huyen-hoc/CachLam`). Chỉ hướng dẫn cách làm — không thêm dữ kiện Kinh Dịch nào ngoài engine.
import { useId, useState } from "react";
import { ChevronDown, CircleHelp } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";
import { useChuKD } from "@/components/kinh-dich/chu-kinh-dich";

const NET = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function Hinh({ ma }: { ma: "xu" | "ghi" | "nhap" }) {
  switch (ma) {
    case "xu": return (
      <svg viewBox="0 0 48 48" aria-hidden>
        <circle cx="16" cy="18" r="8" {...NET} /><rect x="13" y="15" width="6" height="6" {...NET} />
        <circle cx="32" cy="16" r="8" {...NET} /><rect x="29" y="13" width="6" height="6" {...NET} />
        <circle cx="24" cy="32" r="8" {...NET} /><rect x="21" y="29" width="6" height="6" {...NET} />
      </svg>
    );
    case "ghi": return (
      <svg viewBox="0 0 48 48" aria-hidden>
        <path d="M10 40h28M10 34h28M10 28h11M27 28h11M10 22h28M10 16h11M27 16h11M10 10h28" {...NET} />
        <path d="M42 36l-4 4" {...NET} /><circle cx="6" cy="40" r="1.4" fill="currentColor" />
      </svg>
    );
    default: return (
      <svg viewBox="0 0 48 48" aria-hidden>
        <rect x="8" y="10" width="32" height="28" rx="3" {...NET} /><path d="M14 20h8M14 28h8" {...NET} />
        <circle cx="31" cy="20" r="3" {...NET} /><circle cx="31" cy="28" r="3" fill="currentColor" />
      </svg>
    );
  }
}

// EN-ALL GĐ 6: chữ ở lib/chu/kinh-dich.ts (khoá cg.*).
const BUOC: { hinh: "xu" | "ghi" | "nhap"; khoa: string }[] = [
  { hinh: "xu", khoa: "cg.buoc_1" }, { hinh: "ghi", khoa: "cg.buoc_2" }, { hinh: "nhap", khoa: "cg.buoc_3" },
];

export function CachGieo({ className, moSan = false }: { className?: string; moSan?: boolean }) {
  const [mo, setMo] = useState(moSan);
  const id = useId();
  const { c } = useChuKD();
  return (
    <div className={cn("text-sm", className)} data-testid="cach-gieo">
      <button type="button" aria-expanded={mo} aria-controls={id} data-testid="cach-gieo-mo"
        onClick={() => { setMo((v) => !v); if (!mo) ghi("chart_interacted", { mo_dun: "kinhdich", kind: "cach_gieo" }); }}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-fg-muted hover:text-fg">
        <CircleHelp className="size-3.5" aria-hidden />{` ${c("cg.nut")} `}<ChevronDown className={cn("size-3.5 transition-transform", mo && "rotate-180")} aria-hidden />
      </button>
      <div id={id} hidden={!mo} className="mt-2 rounded-xl border border-line/70 bg-bg/40 p-3">
        <p className="font-medium text-fg">{c("cg.tieu_de")}</p>
        <ol className="mt-2 grid gap-3 sm:grid-cols-3">
          {BUOC.map((b, i) => (
            <li key={i} className="flex gap-2.5 sm:flex-col">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold [&>svg]:size-8"><Hinh ma={b.hinh} /></span>
              <span className="text-fg-muted"><b className="text-gold">{i + 1}.</b> {c(b.khoa)}</span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-fg-faint">{c("cg.quy_uoc")}</p>
        <p className="mt-4 font-medium text-fg">{c("cg.hoi_dung")}</p>
        <ul className="mt-2 space-y-2 text-xs sm:text-sm" data-testid="hoi-dung">
          {[1, 2, 3].map((i) => (
            <li key={i} className="grid gap-0.5 sm:grid-cols-2 sm:gap-3">
              <span className="text-fg-muted"><span className="text-jade">{c("cg.nen")}</span> {c(`cg.tot_${i}`)}</span>
              <span className="text-fg-faint"><span className="text-moon">{c("cg.chua_ro")}</span> {c(`cg.chua_${i}`)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-fg-faint">{c("cg.cuoi")}</p>
      </div>
    </div>
  );
}
