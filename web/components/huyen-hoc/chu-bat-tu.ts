"use client";
// EN-ALL GĐ 3d — đọc chữ công cụ Bát tự (lib/chu/bat-tu.ts) theo ngôn ngữ trang. Bản Việt = đúng chữ cũ.
import { useMemo } from "react";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { taoChu } from "@/lib/chu-trang";
import { CHU_BAT_TU_UI } from "@/lib/chu/bat-tu";

export function useChuBatTu() {
  const { ngonNgu } = useNgonNgu();
  return useMemo(() => {
    const c = taoChu(CHU_BAT_TU_UI, null, ngonNgu);
    const ma = ["nam", "thang", "ngay", "gio"] as const;
    return {
      c, en: ngonNgu === "en",
      /** Tên trụ theo chỉ số 0..3: "Năm"/"Year"… (`kieu`: ngan = nhãn ngắn, thuong = chữ thường trong câu, tru = cột bảng). */
      tru: (i: number, kieu: "ngan" | "thuong" | "tru" = "ngan") => (ma[i] ? c(`${kieu === "tru" ? "tru" : kieu === "thuong" ? "tru_thuong" : "tru_ngan"}.${ma[i]}`) : ""),
    };
  }, [ngonNgu]);
}
