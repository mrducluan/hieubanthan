"use client";
// Khung điều hành 3 công cụ cho Chủ DN & Quản lý: Bản đồ Đội ngũ · Lịch Quyết Định 12 Tháng · Mặt bằng & Khai trương.
import { useEffect, useState } from "react";
import { Building2, CalendarDays, Users } from "lucide-react";
import { StudioDoanhChu } from "./StudioDoanhChu";
import { LichQuyetDinh12Thang } from "./LichQuyetDinh12Thang";
import { MatBangKhaiTruong } from "./MatBangKhaiTruong";
import { cn } from "@/lib/utils";

type TabDieuHanh = "doi_ngu" | "lich_12" | "mat_bang";

export function KhungDieuHanh() {
  const [tab, setTab] = useState<TabDieuHanh>("doi_ngu");

  // QLNS-1: mở đúng tab từ #lich-12-thang / #mat-bang (link blog, khối "Bước tiếp theo") hoặc sự kiện "hbt:dieu-hanh-tab".
  useEffect(() => {
    const theoNeo = () => {
      const h = window.location.hash;
      if (h === "#lich-12-thang") setTab("lich_12");
      else if (h === "#mat-bang") setTab("mat_bang");
      else return;
      // Khối này không có phần tử mang đúng id của neo → tự cuộn tới công cụ (nút CTA cuối trang, link từ blog).
      requestAnimationFrame(() => document.getElementById("cong-cu-dieu-hanh")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    };
    const theoSuKien = (e: Event) => {
      const t = (e as CustomEvent<TabDieuHanh>).detail;
      if (t === "doi_ngu" || t === "lich_12" || t === "mat_bang") setTab(t);
    };
    theoNeo();
    window.addEventListener("hashchange", theoNeo);
    window.addEventListener("hbt:dieu-hanh-tab", theoSuKien);
    return () => {
      window.removeEventListener("hashchange", theoNeo);
      window.removeEventListener("hbt:dieu-hanh-tab", theoSuKien);
    };
  }, []);

  return (
    <div id="cong-cu-dieu-hanh" className="scroll-mt-24 space-y-6">
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
        <button
          type="button"
          role="tab"
          aria-selected={tab === "mat_bang"}
          data-testid="tab-mat-bang"
          onClick={() => setTab("mat_bang")}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
            tab === "mat_bang"
              ? "border-gold bg-gold/15 text-gold"
              : "border-line text-fg-muted hover:text-fg",
          )}
        >
          <Building2 className="size-4" aria-hidden /> Mặt bằng &amp; Khai trương
        </button>
      </div>

      {tab === "doi_ngu" && <StudioDoanhChu />}
      {tab === "lich_12" && <LichQuyetDinh12Thang />}
      {tab === "mat_bang" && <MatBangKhaiTruong />}
    </div>
  );
}
