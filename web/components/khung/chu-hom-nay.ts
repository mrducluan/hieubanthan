"use client";
// EN-ALL GĐ 8 — đọc chữ trang Hôm nay (lib/chu/hom-nay.ts) theo ngôn ngữ trang. Bản Việt = đúng chữ cũ.
import { useMemo } from "react";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { taoChu } from "@/lib/chu-trang";
import { CHU_HOM_NAY_UI } from "@/lib/chu/hom-nay";

export function useChuHomNay() {
  const { ngonNgu, ma } = useNgonNgu();
  return useMemo(() => {
    const c = taoChu(CHU_HOM_NAY_UI, null, ngonNgu);
    return {
      c, en: ngonNgu === "en", ma,
      /** "1 giờ 5 phút" / bản Anh "1 h 5 min" (cùng luật `chuConPhut` của lib/ba-la). */
      conPhut: (p: number) => {
        const h = Math.floor(p / 60), mm = p % 60;
        return h > 0 ? (mm ? c("bl.gio_phut", { h: String(h), m: String(mm) }) : c("bl.gio_chan", { h: String(h) })) : c("bl.phut", { m: String(mm) });
      },
    };
  }, [ngonNgu, ma]);
}
