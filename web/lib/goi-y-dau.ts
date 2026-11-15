"use client";
// EN-AI "câu gợi ý trước, gõ tự do sau" (bản Anh): chip đầu khung hỏi đáp = câu chuẩn engine công bố cho mảng (đã kiểm
// định tuyến, bấm là hỏi luôn); ô gõ tự do vẫn ngay dưới. Trang Việt giữ nguyên chip của trang (không gọi gì thêm).
import { useEffect, useState } from "react";
import { urlTheoNgonNgu } from "@/lib/ngon-ngu";

type NhomGoiY = { nhom: string; cau: string[] };

export function useGoiYDau(mang: "battu" | "tuvi", en: boolean, macDinh: NhomGoiY[], nhan: string): NhomGoiY[] {
  const [cau, setCau] = useState<string[] | null>(null);
  useEffect(() => {
    if (!en) return;
    let huy = false;
    fetch(urlTheoNgonNgu(`/api/hoi/goi-y?mang=${mang}`))
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { cau?: unknown } | null) => {
        const ds = Array.isArray(d?.cau) ? d.cau.filter((x): x is string => typeof x === "string") : [];
        if (!huy && ds.length >= 4) setCau(ds);
      })
      .catch(() => {});
    return () => { huy = true; };
  }, [en, mang]);
  return en && cau ? [{ nhom: nhan, cau }] : macDinh;
}
