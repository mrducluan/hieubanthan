"use client";
// EN-ALL GĐ 4 — đọc chữ công cụ Tử vi (lib/chu/tu-vi.ts) theo ngôn ngữ trang + tên hiển thị mã (ten_hien). Bản Việt = đúng chữ cũ.
import { useMemo } from "react";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { boChuGiai } from "@/lib/ten-hien";
import { useTen } from "@/components/khung/TenHien";
import { taoChu } from "@/lib/chu-trang";
import { CHU_TU_VI_UI, KHOA_TAT } from "@/lib/chu/tu-vi";
import { dinhKhoangNgay } from "@/lib/dinh-dang";

/** Bỏ phần chú giải trong ngoặc của tên Anh ("Lu (Prosperity)" → "Lu") — dùng ở chỗ chật (ô lá số, huy hiệu). */
export const tenGon = (s: string) => boChuGiai(s);

export function useChuTuVi() {
  const { ngonNgu, ma } = useNgonNgu();
  const ten = useTen();
  return useMemo(() => {
    const c = taoChu(CHU_TU_VI_UI, null, ngonNgu);
    const en = ngonNgu === "en";
    return {
      c, en, ten,
      /** Tên hoá (mã "Lộc"/"Quyền"/"Khoa"/"Kỵ"): bản Việt nguyên mã; bản Anh tên gọn ("Lu"). */
      hoa: (ma: string) => (en ? tenGon(ten("hoa", ma)) : ma),
      /** Chữ viết tắt độ sáng trên lá số (M/V/Đ… — bản Anh T/P/F…). */
      tat: (m: string | null | undefined) => (m && KHOA_TAT[m] ? c(KHOA_TAT[m]!) : undefined),
      /** Bản Anh: khoảng ngày theo Intl ("9 Nov – 8 Dec", kèm năm khi `nam`); bản Việt không dùng (giữ "d/m–d/m" cũ). */
      khoangNgay: (tu: string, den: string, nam = false) => dinhKhoangNgay(tu, den, ma, nam ? "ngan" : "ngay_thang_ngan"),
    };
  }, [ngonNgu, ma, ten]);
}
