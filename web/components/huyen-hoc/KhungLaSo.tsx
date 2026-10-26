"use client";
// Trục 1 (2026-10-26, báo cáo UX mục 1) — khung lá số Tử vi trên ĐIỆN THOẠI: mặc định THU VỪA màn hình (toàn cảnh, không
// cắt chữ khung giữa), nút "Phóng to" để đọc chữ rõ rồi vuốt ngang; gợi ý cách dùng đặt TRÊN lá số. Phóng to thì cuộn tới
// đúng cột của cung đang chọn. Máy tính (≥ 640px) không đổi: lá số luôn vừa khung. Ảnh tải về (tai-anh-svg + chan-anh)
// không đổi — chỉ đổi khung bọc, SVG vẫn một.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Maximize2, Minimize2, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ghi } from "@/lib/do-luong";
import { VI_TRI } from "@/lib/tuvi-hien-thi";
import { cn } from "@/lib/utils";

/** Bề rộng lá số khi phóng to — giữ chữ phụ tinh ~11px như bản cuộn ngang cũ. */
const RONG_PHONG = 760;

export function KhungLaSo({ chon, children, testId = "la-so-tu-vi", className }: {
  /** chi của cung đang chọn — phóng to thì cuộn tới cột của cung ấy */ chon?: string; children: ReactNode; testId?: string; className?: string;
}) {
  const [phong, setPhong] = useState(false);
  const cuon = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const k = cuon.current;
    if (!phong || !k || !chon) return;
    const cot = VI_TRI[chon]?.[1] ?? 0;
    k.scrollLeft = Math.max(0, (cot + 0.5) * (RONG_PHONG / 4) - k.clientWidth / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ khi vừa phóng to
  }, [phong]);
  return (
    <div className={cn("-mx-4 sm:mx-0", className)}>
      <div className="mb-2 flex items-center gap-2 px-4 sm:hidden" data-testid="la-so-dieu-khien">
        <p className="flex flex-1 items-start gap-1.5 text-xs leading-snug text-fg-muted">
          <Move className="mt-px size-3.5 shrink-0 text-gold" aria-hidden />
          {phong ? "Vuốt ngang để xem trọn lá số · chạm một cung để xem chi tiết." : "Đang xem toàn cảnh · bấm Phóng to để đọc chữ rõ, rồi vuốt ngang · chạm một cung để xem chi tiết."}
        </p>
        <Button variant="secondary" size="sm" aria-pressed={phong} className="min-h-11 shrink-0"
          onClick={() => { setPhong((v) => !v); ghi("chart_interacted", { mo_dun: "tuvi", kind: phong ? "la_so_thu" : "la_so_phong" }); }}>
          {phong ? <><Minimize2 aria-hidden /> Thu vừa màn hình</> : <><Maximize2 aria-hidden /> Phóng to</>}
        </Button>
      </div>
      <div ref={cuon} className={cn("px-4 pb-2 sm:px-0", phong && "overflow-x-auto overscroll-x-contain")} data-testid={testId} data-phong={phong ? "1" : "0"}>
        <div className={cn("overflow-hidden rounded-[1.25rem] shadow-card", phong && "min-w-[760px] sm:min-w-0")}>
          {children}
        </div>
      </div>
    </div>
  );
}
