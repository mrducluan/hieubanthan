"use client";
// EN-ALL GĐ 5 — đọc chữ công cụ Phong thuỷ (lib/chu/phong-thuy.ts) theo ngôn ngữ trang + tên hiển thị mã (hướng, quái,
// du niên…: `ten_hien` của phản hồi đang vẽ, lib/ten-hien.ts có dự phòng 8 hướng / 8 quái / 8 du niên). Bản Việt = đúng chữ cũ.
import { Fragment, useMemo } from "react";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { boChuGiai } from "@/lib/ten-hien";
import { useTen } from "@/components/khung/TenHien";
import { tachNhan, taoChu } from "@/lib/chu-trang";
import { CHU_PHONG_THUY_UI } from "@/lib/chu/phong-thuy";

/** Bỏ phần chú giải trong ngoặc của tên Anh ("Sheng Qi (Vitality)" → "Sheng Qi") — dùng ở chỗ chật. */
export const tenGonPT = (s: string) => boChuGiai(s);

export function useChuPT() {
  const { ngonNgu } = useNgonNgu();
  const ten = useTen();
  return useMemo(() => {
    const en = ngonNgu === "en";
    const c = taoChu(CHU_PHONG_THUY_UI, null, ngonNgu);
    return {
      c, en, ten,
      /** Tên hướng (mã "Bắc"…): bản Việt nguyên mã. */
      huong: (h: string | null | undefined) => ten("huong", h),
      quai: (q: string | null | undefined) => ten("quai", q),
      nhom: (n: string | null | undefined) => ten("nhom_trach", n),
      /** Du niên; `gon` bỏ chú giải trong ngoặc ở bản Anh (ô la bàn, sơ đồ). */
      duNien: (d: string | null | undefined, gon = false) => (gon && en ? tenGonPT(ten("du_nien", d)) : ten("du_nien", d)),
    };
  }, [ngonNgu, ten]);
}

/** Chữ có đoạn nhấn `*…*` → đoạn nhấn là thẻ <b> (như bản cũ viết tay). `lop` = className của <b> (bỏ trống = không có). */
export function ChuB({ chu, lop }: { chu: string; lop?: string }) {
  const ds = tachNhan(chu);
  return <>{ds.map((p, i) => (p.nhan ? <b key={i} className={lop}>{p.chu}</b> : <Fragment key={i}>{p.chu}</Fragment>))}</>;
}
