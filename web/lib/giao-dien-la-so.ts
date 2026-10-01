"use client";
// Giao diện lá số (Đêm sao / Giấy cổ) dùng chung cho Tử vi và Bát tự — nhớ trên máy, lỗi storage thì bỏ qua.
import { useEffect, useState } from "react";
import { ghi } from "@/lib/do-luong";

export type GiaoDien = "dem" | "giay";
const KHOA = "hbt.laso.giaodien";

export function useGiaoDien(moDun: string): [GiaoDien, (g: GiaoDien) => void] {
  const [gd, setGd] = useState<GiaoDien>("dem");
  useEffect(() => {
    try { const g = localStorage.getItem(KHOA); if (g === "dem" || g === "giay") setGd(g); } catch { /* bỏ qua */ }
  }, []);
  const doi = (g: GiaoDien) => {
    setGd(g);
    try { localStorage.setItem(KHOA, g); } catch { /* bỏ qua */ }
    ghi("chart_interacted", { mo_dun: moDun, kind: `giao_dien_${g}` });
  };
  return [gd, doi];
}
