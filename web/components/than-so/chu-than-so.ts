"use client";
// EN-ALL GĐ 7 — đọc chữ công cụ Thần số (lib/chu/than-so.ts) theo ngôn ngữ trang. Bản Việt = đúng chữ cũ.
import { useMemo } from "react";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { taoChu } from "@/lib/chu-trang";
import { CHU_THAN_SO_UI } from "@/lib/chu/than-so";
import { kemNgonNgu } from "@/lib/sao-client";

export function useChuThanSo() {
  const { ngonNgu, ma } = useNgonNgu();
  return useMemo(() => ({ c: taoChu(CHU_THAN_SO_UI, null, ngonNgu), en: ngonNgu === "en", ma }), [ngonNgu, ma]);
}

/** fetch tới route web, kèm `x-ngon-ngu` khi trang là bản Anh (bản Việt: y như fetch cũ). */
export const fetchNN = (url: string, init: RequestInit = {}) => fetch(url, kemNgonNgu(url, init));
