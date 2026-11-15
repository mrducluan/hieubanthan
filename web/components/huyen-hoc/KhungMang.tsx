"use client";
import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ChuNhan } from "@/components/cms/ChuNhan";
import { LoiDan, TraLoiNhanhDau, useChu, useDauCms } from "@/components/cms/DauCms";
import { NhapHoSo } from "@/components/hoso/NhapHoSo";
import { ALT_HINH_MANG, HinhDauMang } from "@/components/huyen-hoc/HinhDauMang";
import type { KieuMang } from "@/components/minh-hoa/TrangTri";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import type { HoSo } from "@/lib/hoso";
import { useChuGiaoDien } from "@/components/khung/chu-giao-dien";

// Khung chung cho các mảng Huyền học: tiêu đề + hỏi thêm dữ liệu đúng lúc (BirthSheet).
// ND-2: H1, lời dẫn, khối "phía trên" có thể do CMS phủ (DauCms bọc ở page.tsx); trống → chữ truyền vào.
// Bố cục: cột chữ rộng tối đa 42rem (dòng nhỏ, H1, lời dẫn, "Trả lời nhanh" thẳng một mép phải); từ lg thêm cột phải
// là hình trang trí của mảng (`hinh`) — ẩn bằng CSS ở màn hẹp nên không thêm chiều cao trên điện thoại.
export function DauMang({ Icon, ten, mo_ta, hinh, children }: { Icon: LucideIcon; ten: string; mo_ta: string; /** Hình trang trí cột phải (≥ lg). */ hinh?: KieuMang; children?: ReactNode }) {
  const d = useDauCms(), c = useChu(), { ngonNgu: nn } = useNgonNgu();
  return (
    <>
    <header className="mb-8 lg:mb-10 lg:grid lg:grid-cols-[minmax(0,42rem)_minmax(0,1fr)] lg:items-center lg:gap-x-12">
      <div className="max-w-2xl">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold/15 text-gold shadow-[0_0_24px_-8px_rgb(var(--gold)/0.6)]"><Icon className="size-5" aria-hidden /></span>
          <p className="eyebrow">{c("dau.nhan_tren") || (nn === "en" ? "Chinese metaphysics" : "Huyền học")}</p>
        </div>
        <h1 className="mt-5 text-4xl leading-[1.12] sm:text-5xl sm:leading-[1.1]">{d.h1 ? <ChuNhan chu={d.h1} /> : ten}</h1>
        <LoiDan macDinh={mo_ta} className="mt-4 leading-relaxed text-fg-muted" />
        <TraLoiNhanhDau className="mt-5" />
        {children}
      </div>
      {hinh && <div className="hidden lg:block lg:justify-self-end"><HinhDauMang kieu={hinh} alt={ALT_HINH_MANG[hinh][nn === "en" ? "en" : "vi"]} className="w-[17rem] xl:w-[22rem]" /></div>}
    </header>
    {d.khoiTren && <div className="mb-8">{d.khoiTren}</div>}
    </>
  );
}

export function XinThemDuLieu({ hoSo, ly_do, can = "day_du", nut: nutVao }: { hoSo: HoSo | null; ly_do: string; can?: "day_du" | "gioi_tinh"; nut?: string }) {
  const [mo, setMo] = useState(false);
  const { c } = useChuGiaoDien();
  const nut = nutVao ?? c("xin.nut");
  return (
    <div className="glass flex flex-col items-start gap-4 rounded-2xl p-5 sm:flex-row sm:items-center">
      <Clock className="size-6 shrink-0 text-moon" aria-hidden />
      <p className="flex-1 text-sm text-fg-muted">{ly_do}</p>
      <Button variant="secondary" onClick={() => setMo(true)}>{hoSo ? nut : c("xin.tao")}</Button>
      <Sheet open={mo} onOpenChange={setMo}>
        <SheetContent title={hoSo ? c("xin.bo_sung") : c("xin.tao")} description={c("xin.mo_ta")}>
          <NhapHoSo macDinh={hoSo} can={can} nutGui={c("xin.luu_xem")} onXong={() => setMo(false)} />
        </SheetContent>
      </Sheet>
    </div>
  );
}
