"use client";
// TV-YBS — khung gập "Góc nhìn khác" cuối phần hộp của một chương: 1–3 ý của một trường phái Tử vi khác (engine
// luangiai/tuvi_y_bo_sung.py chọn theo lá số, KB tuvi_y_bo_sung.json `hien_thi = "goc_nhin_khac"`). Mặc định GẬP — lời
// chính của chương vẫn là luận theo lá số; ý ở đây chỉ để tham khảo, mỗi ý có "Đúng với mình" (mã + phái riêng) để học
// dần. Đo `chart_interacted{kind: "goc_nhin_khac_mo"}` chỉ kèm mã chương + số ý (không chữ).
import { useContext, useId, useState } from "react";
import { ChevronDown, Compass } from "lucide-react";
import { KiemChung } from "@/components/huyen-hoc/KiemChung";
import type { ThuatNgu } from "@/components/hoi/ThuatNgu";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";
import { KiemChungBai, ViSao } from "./HopNoiBat";
import type { GocNhinKhac as GocNhinKhacT } from "./kieu";

export function GocNhinKhac({ g, chuong, moDun = "tuvi", thuatNgu }: { g: GocNhinKhacT; chuong: string; moDun?: string; thuatNgu?: ThuatNgu[] }) {
  const [mo, setMo] = useState(false);
  const id = useId();
  const { tyLe, phai, tat } = useContext(KiemChungBai);
  const y = g.y.filter((x) => !x.dang_xem_lai);
  if (!y.length) return null;
  return (
    <div className="mt-3 rounded-2xl border border-dashed border-line/80 bg-surface/20 px-4 py-3" data-testid="goc-nhin-khac">
      <button type="button" aria-expanded={mo} aria-controls={id} data-testid="goc-nhin-khac-mo"
        onClick={() => {
          if (!mo) ghi("chart_interacted", { mo_dun: moDun, kind: "goc_nhin_khac_mo", chuong, so_y: y.length });
          setMo((v) => !v);
        }}
        className="flex min-h-11 w-full items-center gap-2 text-left text-sm font-medium text-fg-muted hover:text-fg print:hidden">
        <Compass className="size-4 shrink-0" aria-hidden />
        <span className="flex-1">{g.tieu_de} <span className="font-normal text-fg-faint">· {y.length} ý tham khảo</span></span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform motion-reduce:transition-none", mo && "rotate-180")} aria-hidden />
      </button>
      <div id={id} hidden={!mo} className="print:block">
        <p className="mt-1 text-xs text-fg-faint" data-testid="goc-nhin-khac-ghi-chu">{g.ghi_chu}</p>
        <ul className="mt-2 space-y-3">
          {y.map((x) => (
            <li key={x.ma_mau ?? x.tieu_de} className="border-t border-line/60 pt-3 first:border-t-0 first:pt-0" data-testid="goc-nhin-khac-y">
              <p className="font-medium leading-snug text-fg">{x.tieu_de}</p>
              {x.noi_dung && x.noi_dung !== x.tieu_de && <p className="mt-1 text-sm leading-relaxed text-fg-muted">{x.noi_dung}</p>}
              {x.huong_xu_ly && <p className="mt-1 text-sm leading-relaxed text-fg"><b className="font-semibold">Thử:</b> {x.huong_xu_ly}</p>}
              <ViSao canCu={x.can_cu} thuatNgu={thuatNgu} nho />
              {x.ma_mau && !tat && (
                <div className="pt-2">
                  <KiemChung loai="doi_song" mau={x.ma_mau} phai={x.phai ?? phai} tyLe={tyLe[x.ma_mau]}
                    tyLeEngine={{ ty_le_dung: x.ty_le_dung, so_phieu: x.so_phieu }} />
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
