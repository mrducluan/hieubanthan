"use client";
// Chặng 3.1 — Khung điều phối trên /co-van: chuyển mượt giữa Quyết định dài hạn (Tam Tài) và Sự vụ tức thời (Kỳ Môn · Lục Hào).
import { useState } from "react";
import { Compass, Dices } from "lucide-react";
import { cn } from "@/lib/utils";
import { CongCoVanTamTai } from "./CongCoVanTamTai";
import { SuVuTucThoi } from "./SuVuTucThoi";

export function KhungTrangCoVan() {
  const [tab, setTab] = useState<"tam_tai" | "su_vu">("tam_tai");

  return (
    <div className="space-y-6" data-testid="khung-trang-co-van">
      <div className="flex flex-wrap gap-2 border-b border-line/70 pb-3" role="tablist" aria-label="Chọn tầng cố vấn">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "tam_tai"}
          data-testid="tab-co-van-tam-tai"
          onClick={() => setTab("tam_tai")}
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            tab === "tam_tai" ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg",
          )}
        >
          <Compass className="size-4" aria-hidden /> Quyết định dài hạn (Nhân · Thiên · Địa)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "su_vu"}
          data-testid="tab-co-van-su-vu"
          onClick={() => setTab("su_vu")}
          className={cn(
            "inline-flex min-h-10 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            tab === "su_vu" ? "border-gold bg-gold/15 text-gold" : "border-line text-fg-muted hover:text-fg",
          )}
        >
          <Dices className="size-4" aria-hidden /> Sự vụ tức thời (Kỳ Môn · Lục Hào)
        </button>
      </div>

      {tab === "tam_tai" ? <CongCoVanTamTai macDinhCheDo="doi_song" /> : <SuVuTucThoi />}
    </div>
  );
}
