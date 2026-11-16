"use client";
// EN-ALL GĐ 8 — đọc chữ Chân dung tổng hợp + Thời gian tới (lib/chu/chan-dung.ts) theo ngôn ngữ trang. Bản Việt = đúng chữ cũ.
import { useMemo } from "react";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { taoChu } from "@/lib/chu-trang";
import { CHU_CHAN_DUNG_UI, CHU_THOI_GIAN_UI } from "@/lib/chu/chan-dung";

export function useChuChanDung() {
  const { ngonNgu } = useNgonNgu();
  return useMemo(() => ({ t: taoChu(CHU_CHAN_DUNG_UI, null, ngonNgu), en: ngonNgu === "en" }), [ngonNgu]);
}

export function useChuThoiGian() {
  const { ngonNgu } = useNgonNgu();
  return useMemo(() => ({ t: taoChu(CHU_THOI_GIAN_UI, null, ngonNgu), en: ngonNgu === "en" }), [ngonNgu]);
}
