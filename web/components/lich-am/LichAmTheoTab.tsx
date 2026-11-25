"use client";
// Trang /nam/{năm}: hai tab — "Lịch âm" (tháng âm đang đi, mở sẵn hôm nay) và "Năm {năm}" (lịch cả năm đang xem).
// Chỉ ghép hai bản LichAmNam, mọi dữ kiện do engine trả.
import { useState } from "react";
import { LichAmNam } from "./LichAmNam";
import type { LichNgay } from "@/lib/lich-am";

export function LichAmTheoTab({ hienTai, namXem, nam, homNay, className }: {
  /** Năm âm chứa hôm nay (null = engine bận → chỉ còn tab năm). */ hienTai: LichNgay | null;
  namXem: LichNgay; nam: number; homNay: string; className?: string;
}) {
  const [tab, setTab] = useState<"nay" | "nam">(hienTai ? "nay" : "nam");
  const tabs = ([...(hienTai ? [["nay", "Lịch âm"]] : []), ["nam", `Năm ${nam}`]]) as ["nay" | "nam", string][];
  return (
    <div className={className} data-testid="lich-am-tab">
      <div className="mb-3 inline-flex rounded-full border border-line bg-bg/60 p-[3px]" role="tablist" aria-label="Chọn lịch">
        {tabs.map(([k, ten]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} data-testid={`lich-am-tab-${k}`} onClick={() => setTab(k)}
            className={`min-h-11 rounded-full px-5 text-sm sm:min-h-9 ${tab === k ? "bg-surface-2 text-fg shadow-[inset_0_0_0_1px_rgb(var(--gold)/0.45)]" : "text-fg-muted hover:text-fg"}`}>{ten}</button>
        ))}
      </div>
      {tab === "nay" && hienTai
        ? <LichAmNam key="nay" d={hienTai} homNay={homNay} anNutChe />
        : <LichAmNam key="nam" d={namXem} homNay={homNay} cheBanDau="nam" anNutChe />}
    </div>
  );
}
