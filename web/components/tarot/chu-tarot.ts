"use client";
// EN-ALL GĐ 7 — đọc chữ công cụ Tarot (lib/chu/tarot.ts) theo ngôn ngữ trang. Bản Việt = đúng chữ cũ.
import { useMemo } from "react";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { taoChu } from "@/lib/chu-trang";
import { CHU_TAROT_UI } from "@/lib/chu/tarot";
import type { NguyenTo } from "@/lib/tarot-chung";

export function useChuTarot() {
  const { ngonNgu, ma } = useNgonNgu();
  return useMemo(() => {
    const c = taoChu(CHU_TAROT_UI, null, ngonNgu);
    return {
      c, en: ngonNgu === "en", ma,
      /** Chữ lá bài (LaBai / BanTraiBai) theo ngôn ngữ. */
      la: { nguoc: c("la.nguoc"), up: c("la.up"), nhan_nguoc: c("la.nhan_nguoc"), nguoc_nhan: c("la.nguoc_nhan") },
      nguyenTo: (k: NguyenTo) => c(`nt.${k}`),
    };
  }, [ngonNgu, ma]);
}
