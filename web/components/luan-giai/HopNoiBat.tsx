"use client";
// LG-ĐS — hộp đóng khung trong Luận giải Tử vi đời sống (docs/LUAN-GIAI-DOI-SONG.md mục 2.3). Màu theo loại
// (app/globals.css `.hop-nb`): Điều quan trọng (vàng) · Điểm mạnh (lục) · Nên để ý (hổ phách, KHÔNG đỏ) · Lời khuyên
// (tím) · Thời điểm (lam). "Vì sao nói vậy" mở căn cứ (thuật ngữ, sao, cung) — lời chính không chứa thuật ngữ.
import { createContext, useContext, useId, useState } from "react";
import { CalendarClock, ChevronDown, Eye, Lightbulb, Sprout, Star, type LucideIcon } from "lucide-react";
import { KiemChung } from "@/components/huyen-hoc/KiemChung";
import { doanCoThuatNgu, type ThuatNgu } from "@/components/hoi/ThuatNgu";
import type { BangTyLe } from "@/lib/ty-le-kiem-chung";
import { cn } from "@/lib/utils";
import type { Hop, LoaiHop } from "./kieu";

export const LOAI_HOP: Record<LoaiHop, { nhan: string; Icon: LucideIcon }> = {
  cot_loi: { nhan: "Điều quan trọng", Icon: Star },
  diem_manh: { nhan: "Điểm mạnh", Icon: Sprout },
  luu_y: { nhan: "Nên để ý", Icon: Eye },
  loi_khuyen: { nhan: "Lời khuyên", Icon: Lightbulb },
  thoi_diem: { nhan: "Thời điểm", Icon: CalendarClock },
};

/** Bảng tỉ lệ "thấy đúng" của cả bài (một lời gọi, xem lib/ty-le-kiem-chung) + phái ghi kèm phiếu. */
export const KiemChungBai = createContext<{ tyLe: BangTyLe; phai: string; tat?: boolean }>({ tyLe: {}, phai: "nam_phai_viet" });

/** Nút "Vì sao nói vậy" + danh sách căn cứ thu gọn — dùng cho hộp và cho chương. */
export function ViSao({ canCu, thuatNgu, nho = false }: { canCu?: string[]; thuatNgu?: ThuatNgu[]; nho?: boolean }) {
  const [mo, setMo] = useState(false);
  const id = useId();
  if (!canCu?.length) return null;
  return (
    <div className="mt-2" data-testid="vi-sao">
      <button type="button" aria-expanded={mo} aria-controls={id} onClick={() => setMo((v) => !v)}
        className={cn("inline-flex items-center gap-1 rounded-full text-fg-muted underline-offset-4 hover:text-fg hover:underline print:hidden",
          nho ? "text-xs" : "text-sm")}>
        Vì sao nói vậy <ChevronDown className={cn("size-3.5 transition-transform", mo && "rotate-180")} aria-hidden />
      </button>
      <div id={id} hidden={!mo} className="mt-1.5 space-y-1 border-l-2 border-line pl-3 text-xs leading-relaxed text-fg-faint print:block"
        data-testid="can-cu">
        {doanCoThuatNgu(canCu.join("\n\n"), thuatNgu)}
      </div>
    </div>
  );
}

export function HopNoiBat({ hop, thuatNgu, className }: { hop: Hop; thuatNgu?: ThuatNgu[]; className?: string }) {
  const { tyLe, phai, tat } = useContext(KiemChungBai);
  const { nhan, Icon } = LOAI_HOP[hop.loai] ?? LOAI_HOP.cot_loi;
  const idTieuDe = useId();
  return (
    <section role="note" aria-labelledby={idTieuDe} data-loai={hop.loai} data-testid="hop-noi-bat"
      className={cn("hop-nb flex flex-col rounded-2xl p-4", className)}>
      <p className="hop-nhan flex items-center gap-1.5 text-[0.72rem] font-semibold uppercase tracking-wider">
        <Icon className="hop-icon size-3.5" aria-hidden /> {nhan}
      </p>
      <h4 id={idTieuDe} className="mt-1 font-sans text-[1.02rem] font-semibold leading-snug text-fg">{hop.tieu_de}</h4>
      <p className="mt-1.5 text-[0.95rem] leading-relaxed text-fg-muted">{hop.noi_dung}</p>
      <ViSao canCu={hop.can_cu} thuatNgu={thuatNgu} nho />
      {hop.ma_mau && !tat && (
        <div className="mt-auto pt-3">
          <KiemChung loai="doi_song" mau={hop.ma_mau} phai={phai} tyLe={tyLe[hop.ma_mau]}
            tyLeEngine={{ ty_le_dung: hop.ty_le_dung, so_phieu: hop.so_phieu }} />
        </div>
      )}
    </section>
  );
}
