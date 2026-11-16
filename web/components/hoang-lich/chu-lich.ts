"use client";
// EN-ALL GĐ 8 — đọc chữ công cụ lịch (lib/chu/lich.ts) theo ngôn ngữ trang. Bản Việt = đúng chữ cũ.
import { useMemo } from "react";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { taoChu } from "@/lib/chu-trang";
import { CHU_LICH_UI } from "@/lib/chu/lich";
import { dinhNgay } from "@/lib/dinh-dang";

export function useChuLich() {
  const { ngonNgu, ma } = useNgonNgu();
  return useMemo(() => {
    const en = ngonNgu === "en";
    return {
      c: taoChu(CHU_LICH_UI, null, ngonNgu), en, ma,
      /** Ngày hiển thị: bản Việt "dd/mm/yyyy" (như cũ), bản Anh "16 November 2026". */
      ngay: (iso: string) => (en ? dinhNgay(iso, ma, "dai") : iso.split("-").reverse().join("/")),
      /** Tháng hiển thị bản Anh: "November 2026". */
      thangNam: (nam: number, thang: number) => dinhNgay({ nam, thang, ngay: 1 }, ma, "thang_nam"),
    };
  }, [ngonNgu, ma]);
}
