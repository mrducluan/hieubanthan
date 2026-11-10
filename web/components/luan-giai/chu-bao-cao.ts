"use client";
// EN-ALL GĐ 1 việc 3 — đọc chữ khung báo cáo (lib/chu/bao-cao.ts) theo ngôn ngữ trang. Bản Việt = đúng chữ cũ.
import { useMemo } from "react";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { taoChu } from "@/lib/chu-trang";
import { CHU_BAO_CAO } from "@/lib/chu/bao-cao";
import { dinhNgay } from "@/lib/dinh-dang";
import type { Muc } from "./kieu";

export function useChuBaoCao() {
  const { ngonNgu, ma } = useNgonNgu();
  return useMemo(() => {
    const c = taoChu(CHU_BAO_CAO, null, ngonNgu);
    const nhanMuc: Record<Muc, string> = { thuan: c("muc.thuan"), can_bang: c("muc.can_bang"), can_chu_dong: c("muc.can_chu_dong") };
    /** "2026-12-13" → bản Việt "13/12/2026" (như cũ); bản Anh theo Intl ("13 Dec 2026"). Chuỗi khác dạng ISO giữ nguyên. */
    const ngay = (iso: string) => {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
      if (!m) return iso;
      return ngonNgu === "en" ? dinhNgay(iso, ma, "ngan") : `${Number(m[3])}/${Number(m[2])}/${m[1]}`;
    };
    return { c, nhanMuc, ngay, en: ngonNgu === "en" };
  }, [ngonNgu, ma]);
}
