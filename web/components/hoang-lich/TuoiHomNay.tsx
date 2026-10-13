"use client";
// HL-1 — một dòng "hôm nay với tuổi bạn" ở trang chủ: có hồ sơ trên máy → hỏi engine (ngày sinh chỉ để tính, không
// lưu); chưa có hồ sơ → gợi nhập hồ sơ ở khung phía trên.
import { useEffect, useState } from "react";
import { useHoSo } from "@/lib/hoso";
import type { NgayTot } from "@/lib/hoang-lich";

export function TuoiHomNay({ iso }: { iso: string }) {
  const hoSo = useHoSo();
  const [t, setT] = useState<NgayTot["tuoi"]>(null);
  useEffect(() => {
    if (!hoSo) return;
    let huy = false;
    fetch("/api/lich/ngay-tot", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ ngay: iso, nam_sinh: hoSo.nam, thang_sinh: hoSo.thang, ngay_sinh: hoSo.ngay }) })
      .then((r) => r.ok ? r.json() : null).then((j: NgayTot | null) => { if (!huy && j) setT(j.tuoi); })
      .catch(() => { /* bỏ qua */ });
    return () => { huy = true; };
  }, [hoSo, iso]);
  if (hoSo === null) return <p className="text-moon" data-testid="tuoi-goi-y">Hôm nay có xung tuổi bạn không? Nhập ngày sinh ở khung phía trên để xem.</p>;
  if (!t) return null;
  return <p data-testid="tuoi-hom-nay"><span className="text-fg-muted">Tuổi bạn ({t.can_chi}):</span> <b>{t.quan_he.ten}</b> — {t.quan_he.nghia}.</p>;
}
