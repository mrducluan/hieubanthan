"use client";
// EN-ALL GĐ 8 — đọc chữ công cụ Nhân tướng học (lib/chu/nhan-tuong.ts) theo ngôn ngữ trang. Bản Việt = đúng chữ cũ.
import { useMemo } from "react";
import { useNgonNgu } from "@/components/khung/NgonNgu";
import { tachNhan, taoChu } from "@/lib/chu-trang";
import { CHU_NHAN_TUONG_UI } from "@/lib/chu/nhan-tuong";

export function useChuNhanTuong() {
  const { ngonNgu, ma } = useNgonNgu();
  return useMemo(() => ({ t: taoChu(CHU_NHAN_TUONG_UI, null, ngonNgu), en: ngonNgu === "en", ma }), [ngonNgu, ma]);
}

/** Chữ bản Anh có đoạn `*…*` → <b className="text-fg">…</b> (chỉ dùng ở nhánh bản Anh; bản Việt giữ JSX cũ). */
export function Dam({ s, lop = "text-fg" }: { s: string; lop?: string }) {
  return <>{tachNhan(s).map((p, i) => (p.nhan ? <b key={i} className={lop}>{p.chu}</b> : <span key={i}>{p.chu}</span>))}</>;
}
