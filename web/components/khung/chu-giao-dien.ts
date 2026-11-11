"use client";
// EN-ALL GĐ 3d — đọc chữ khối giao diện dùng chung (lib/chu/giao-dien.ts) theo ngôn ngữ trang. Bản Việt = đúng chữ cũ.
import { useMemo } from "react";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { taoChu } from "@/lib/chu-trang";
import { CHU_GIAO_DIEN } from "@/lib/chu/giao-dien";

export function useChuGiaoDien() {
  const { ngonNgu, ma } = useNgonNgu();
  return useMemo(() => ({ c: taoChu(CHU_GIAO_DIEN, null, ngonNgu), en: ngonNgu === "en", ma }), [ngonNgu, ma]);
}
