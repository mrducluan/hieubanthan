"use client";
// TK-2 — trường phái đang xem ở /chi-tay: "dong" (sách tướng xưa, mặc định) | "tay" (chỉ tay phương Tây: Cheiro, Benham).
// Chỉ nhớ MÃ trên máy (localStorage `hbt.chi_tay.phai.v1`). Máy chủ luôn dựng bản "dong" (snapshot máy chủ) → không lệch hydrate.
import { useSyncExternalStore } from "react";
import { ghi } from "@/lib/do-luong";

export type PhaiChiTay = "dong" | "tay";
const KHOA = "hbt.chi_tay.phai.v1";
const nghe = new Set<() => void>();
let hienTai: PhaiChiTay | null = null;

function doc(): PhaiChiTay {
  if (typeof window === "undefined") return "dong";
  if (hienTai === null) {
    try { hienTai = localStorage.getItem(KHOA) === "tay" ? "tay" : "dong"; } catch { hienTai = "dong"; }
  }
  return hienTai;
}

function dangKy(f: () => void) {
  nghe.add(f);
  const khac = (e: StorageEvent) => { if (e.key === KHOA || e.key === null) { hienTai = null; f(); } };
  window.addEventListener("storage", khac);
  return () => { nghe.delete(f); window.removeEventListener("storage", khac); };
}

export function usePhaiChiTay(): PhaiChiTay {
  return useSyncExternalStore(dangKy, doc, () => "dong");
}

export function datPhaiChiTay(p: PhaiChiTay): void {
  if (p === doc()) return;
  hienTai = p;
  try { if (p === "dong") localStorage.removeItem(KHOA); else localStorage.setItem(KHOA, p); } catch { /* chế độ riêng tư */ }
  ghi("chart_interacted", { mo_dun: "chitay", kind: "doi_phai", phai: p });
  nghe.forEach((f) => f());
}
