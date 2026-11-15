"use client";
// EN-ALL GĐ 6 — đọc chữ công cụ Kinh Dịch (lib/chu/kinh-dich.ts) theo ngôn ngữ trang + tên hiển thị mã (tên quẻ, quái, chi,
// can, hành, lục thân, Thế/Ứng, lục thú, vượng suy, hoá tiến/thoái — `ten_hien` của phản hồi đang vẽ, lib/ten-hien.ts).
// Bản Việt = đúng chữ cũ (tên mã trả nguyên mã, giờ/ngày như cũ).
import { useMemo } from "react";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { useTen } from "@/components/khung/TenHien";
import { taoChu } from "@/lib/chu-trang";
import { CHU_KINH_DICH_UI } from "@/lib/chu/kinh-dich";
import { dinhGio, dinhNgay } from "@/lib/dinh-dang";
import type { GiaTriHao } from "@/lib/dong-xu";

export { ChuB } from "@/components/huyen-hoc/chu-phong-thuy";

export function useChuKD() {
  const { ngonNgu } = useNgonNgu();
  const ten = useTen();
  return useMemo(() => {
    const en = ngonNgu === "en";
    const c = taoChu(CHU_KINH_DICH_UI, null, ngonNgu);
    return {
      c, en, ten,
      /** Nhãn kiểu hào 6/7/8/9 (thay NHAN_HAO của lib/dong-xu ở chỗ hiển thị). */
      hao: (v: GiaTriHao) => ({ ten: c(`hao.${v}`), mo_ta: c(`hao.${v}_mo_ta`) }),
      /** Giờ + ngày từ chuỗi giờ VN không múi "2026-10-23T14:05…": bản Việt "14:05 ngày 23/10" như cũ; bản Anh "14:05 on 23 Oct". */
      thoiDiem: (iso?: string | null): string | null => {
        const x = iso?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
        if (!x) return null;
        if (!en) return c("gio.ngay", { h: x[4]!, p: x[5]!, d: x[3]!, t: x[2]! });
        return `${dinhGio(`${x[4]}:${x[5]}`, ngonNgu)} on ${dinhNgay(`${x[1]}-${x[2]}-${x[3]}`, ngonNgu, "ngay_thang_ngan")}`;
      },
      /** "yyyy-mm-dd" → bản Việt "dd/mm" như cũ; bản Anh "15 Nov". */
      ngayNgan: (ymd: string): string => (en ? dinhNgay(ymd.slice(0, 10), ngonNgu, "ngay_thang_ngan") : `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}`),
    };
  }, [ngonNgu, ten]);
}
