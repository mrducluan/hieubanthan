"use client";
// TR-5 — "Ý nghĩa từng lá": dải lá đã lật (tranh + vị trí + tên + từ khoá), chạm một lá → bảng nghĩa của lá Ở ĐÚNG VỊ TRÍ đó.
// Dùng hai chỗ: (1) lúc đang lật — nghĩa nhanh từ bộ bài (từ khoá xuôi / ngược + câu hỏi của vị trí), lật lá nào hiện lá đó;
// (2) trong bài đọc — thêm lời đọc, việc nhỏ nên làm, câu tự hỏi của hộp vị trí engine đã viết. Component thuần: chỉ hiển thị
// chữ engine trả, không tính, không gọi mạng.
import { useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";
import Link from "@/components/khung/Lien";
import { MatTruoc } from "./LaBai";
import { slug } from "./LaNgay";
import type { LaGon } from "@/lib/tarot-chung";
import { cn } from "@/lib/utils";

export interface MucLa {
  /** chỉ số vị trí trên bàn (0…) */ so: number; viTri: string; hoi: string; la: LaGon; nguoc: boolean; tuKhoa: string[];
  noiDung?: string; viec?: string | null; tuSoi?: string | null;
}

export function YNghiaLa({ muc, chon, onChon, tieuDe = "Ý nghĩa từng lá", ghiChu, className }: {
  muc: MucLa[]; chon: number | null; onChon: (so: number) => void; tieuDe?: string; ghiChu?: string; className?: string;
}) {
  const refDai = useRef<HTMLDivElement>(null);
  const dang = muc.find((m) => m.so === chon) ?? null;
  // Lá đang chọn luôn nằm trong tầm nhìn của dải (lật lá thứ 9 trên điện thoại → dải tự trượt tới).
  useEffect(() => {
    if (chon === null) return;
    const dai = refDai.current;
    const el = dai?.querySelector<HTMLElement>(`[data-so="${chon}"]`);
    if (!dai || !el) return;
    const trai = el.offsetLeft - dai.offsetLeft;
    if (trai < dai.scrollLeft || trai + el.offsetWidth > dai.scrollLeft + dai.clientWidth) dai.scrollTo({ left: Math.max(trai - 16, 0), behavior: "smooth" });
  }, [chon]);
  if (!muc.length) return null;
  return (
    <div className={className} data-testid="y-nghia-la">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h3 className="text-lg">{tieuDe}</h3>
        {ghiChu && <p className="text-xs text-fg-faint">{ghiChu}</p>}
      </div>
      <div ref={refDai} role="tablist" aria-label={tieuDe} className="-mx-1 mt-3 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
        {muc.map((m) => (
          <button key={m.so} type="button" role="tab" aria-selected={chon === m.so} data-so={m.so} data-testid="the-la" onClick={() => onChon(m.so)}
            className={cn("w-[104px] shrink-0 snap-start rounded-xl border p-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gold sm:w-[118px]",
              chon === m.so ? "border-gold bg-gold/10" : "border-line/60 hover:border-gold/40")}>
            <MatTruoc la={m.la} nguoc={m.nguoc} gap />
            <span className="mt-1.5 block truncate text-[11px] text-fg-faint">{m.so + 1}. {m.viTri}</span>
            <span className="block truncate text-xs font-medium text-fg">{m.la.ten}{m.nguoc && <span className="font-normal text-[#f0b35c]"> · ngược</span>}</span>
          </button>
        ))}
      </div>
      {dang && (
        <div role="tabpanel" className="mt-3 grid gap-4 rounded-xl border border-line/60 bg-bg/40 p-4 sm:grid-cols-[112px_1fr]" data-testid="nghia-la-dang-chon" aria-live="polite">
          <div className="mx-auto w-24 sm:w-full"><MatTruoc la={dang.la} nguoc={dang.nguoc} gap /></div>
          <div className="min-w-0">
            <p className="eyebrow">Vị trí {dang.so + 1} · {dang.viTri}</p>
            <p className="text-sm text-fg-muted">{dang.hoi}</p>
            <h4 className="mt-2 font-serif text-xl text-fg">{dang.la.ten}{dang.nguoc ? " (ngược)" : ""}{dang.la.en && <span className="ml-2 font-sans text-sm text-fg-faint">{dang.la.en}</span>}</h4>
            <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Từ khoá">
              {dang.tuKhoa.map((k) => <li key={k} className="rounded-full border border-gold/30 bg-gold/5 px-2.5 py-0.5 text-xs text-fg">{k}</li>)}
            </ul>
            {dang.noiDung && <p className="mt-3 text-[0.95rem] leading-relaxed text-fg">{dang.noiDung}</p>}
            {dang.viec && <p className="mt-2 text-sm text-fg"><b className="text-gold">Việc nhỏ nên làm:</b> {dang.viec}</p>}
            {dang.tuSoi && <p className="mt-2 text-sm italic text-fg-muted">Tự hỏi: {dang.tuSoi}</p>}
            <p className="mt-3 text-sm">
              <Link href={`/tarot/la-bai/${slug(dang.la.ten)}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 text-gold underline-offset-4 hover:underline" data-testid="link-la-day-du">
                <BookOpen className="size-4" aria-hidden /> Xem đầy đủ ý nghĩa lá {dang.la.ten}
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
