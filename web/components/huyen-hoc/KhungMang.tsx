"use client";
import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChuNhan } from "@/components/cms/ChuNhan";
import { LoiDan, TraLoiNhanhDau, useChu, useDauCms } from "@/components/cms/DauCms";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import type { HoSo } from "@/lib/hoso";

// Khung chung cho 4 mảng Huyền học: tiêu đề + nhãn nháp + hỏi thêm dữ liệu đúng lúc (BirthSheet).
// ND-2: H1, lời dẫn, khối "phía trên" có thể do CMS phủ (DauCms bọc ở page.tsx); trống → chữ truyền vào.
export function DauMang({ Icon, ten, mo_ta, chip, children }: { Icon: LucideIcon; ten: string; mo_ta: string; /** CTA-LS: hiện 3 chip `dau.chip_*` (chỉ trang có khoá đó trong bảng chữ). */ chip?: boolean; children?: ReactNode }) {
  const d = useDauCms(), c = useChu();
  return (
    <>
    <header className="mb-8">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold shadow-[0_0_24px_-8px_rgb(var(--gold)/0.6)]"><Icon className="size-5" aria-hidden /></span>
        <p className="eyebrow">{c("dau.nhan_tren") || "Huyền học"}</p>
      </div>
      <h1 className="mt-4 text-4xl sm:text-5xl">{d.h1 ? <ChuNhan chu={d.h1} /> : ten}</h1>
      <LoiDan macDinh={mo_ta} />
      {/* CTA-LS: chip lợi ích (chỉ trang có khoá dau.chip_* — Tử vi, Bát tự). */}
      {chip && [1, 2, 3].some((i) => c(`dau.chip_${i}`)) && (
        <ul className="mt-4 flex flex-wrap gap-2" data-testid="dau-chip">
          {[1, 2, 3].map((i) => c(`dau.chip_${i}`)).filter(Boolean).map((t, i) => (
            <li key={i} className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/[0.06] px-3 py-1 text-xs text-fg sm:text-sm">
              <Check className="size-3.5 text-gold" aria-hidden />{t}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 inline-flex rounded-full border border-line px-3 py-1 text-xs text-fg-faint">
        {c("dau.nhan_duoi") || "Diễn giải từ kho tri thức Hiểu Bản Thân · tham khảo văn hoá"}
      </p>
      <TraLoiNhanhDau />
      {children}
    </header>
    {d.khoiTren && <div className="mb-8">{d.khoiTren}</div>}
    </>
  );
}

export function XinThemDuLieu({ hoSo, ly_do, can = "day_du", nut = "Thêm giờ sinh, giới tính, nơi sinh" }: { hoSo: HoSo | null; ly_do: string; can?: "day_du" | "gioi_tinh"; nut?: string }) {
  const [mo, setMo] = useState(false);
  return (
    <div className="glass flex flex-col items-start gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
      <Clock className="size-6 shrink-0 text-moon" aria-hidden />
      <p className="flex-1 text-sm text-fg-muted">{ly_do}</p>
      <Button variant="secondary" onClick={() => setMo(true)}>{hoSo ? nut : "Tạo hồ sơ"}</Button>
      <Sheet open={mo} onOpenChange={setMo}>
        <SheetContent title={hoSo ? "Bổ sung hồ sơ" : "Tạo hồ sơ"} description="Lưu trên máy của bạn, dùng chung cho mọi mảng.">
          <NhapHoSo macDinh={hoSo} can={can} nutGui="Lưu và xem" onXong={() => setMo(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
