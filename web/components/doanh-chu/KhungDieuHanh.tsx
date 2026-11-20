"use client";
// Khung điều hành 2 công cụ cho Chủ DN & Quản lý: Bản đồ Đội ngũ + Lịch Quyết Định 12 Tháng.
import { useState } from "react";
import { CalendarDays, Users } from "lucide-react";
import { StudioDoanhChu } from "./StudioDoanhChu";
import { LichQuyetDinh12Thang } from "./LichQuyetDinh12Thang";
import { cn } from "@/lib/utils";

type TabDieuHanh = "doi_ngu" | "lich_12";

export function KhungDieuHanh() {
  const [tab, setTab] = useState<TabDieuHanh>("doi_ngu");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-line/70 pb-3" role="tablist" aria-label="Công cụ điều hành">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "doi_ngu"}
          data-testid="tab-ban-do-doi-ngu"
          onClick={() => setTab("doi_ngu")}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            tab === "doi_ngu"
              ? "border-gold bg-gold/15 text-gold"
              : "border-line text-fg-muted hover:text-fg",
          )}
        >
          <Users className="size-4" aria-hidden /> Bản đồ Đội ngũ
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "lich_12"}
          data-testid="tab-lich-12-thang"
          onClick={() => setTab("lich_12")}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            tab === "lich_12"
              ? "border-gold bg-gold/15 text-gold"
              : "border-line text-fg-muted hover:text-fg",
          )}
        >
          <CalendarDays className="size-4" aria-hidden /> Lịch Quyết Định 12 Tháng
        </button>
      </div>

      {tab === "doi_ngu" ? <StudioDoanhChu /> : <LichQuyetDinh12Thang />}
    </div>
  );
}
