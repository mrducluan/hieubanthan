"use client";
// Q4 — công tắc "góc nhìn" khi giải thích dấu hiệu hình thế: theo sách xưa (cổ thư / dân gian) hay theo đời sống (ánh sáng, gió,
// tiếng ồn, tầm nhìn). Chỉ đổi câu đưa lên trước, không đổi phép tính; nhớ trên máy. Dùng chung Khảo sát nhà + Nhà của bạn.
import { useSyncExternalStore } from "react";

export type GocNhin = "sach_xua" | "doi_song";
export const KHOA_GOC_NHIN = "hbt.pt_goc_nhin";
export const TEN_GOC_NHIN: Record<GocNhin, string> = { sach_xua: "Theo sách xưa", doi_song: "Theo đời sống" };
const nghe = new Set<() => void>();
function doc(): GocNhin {
  try { return localStorage.getItem(KHOA_GOC_NHIN) === "doi_song" ? "doi_song" : "sach_xua"; } catch { return "sach_xua"; }
}
export function datGocNhin(g: GocNhin) {
  try { localStorage.setItem(KHOA_GOC_NHIN, g); } catch { /* riêng tư */ }
  nghe.forEach((f) => f());
}
export function useGocNhin(): GocNhin {
  return useSyncExternalStore((f) => { nghe.add(f); return () => nghe.delete(f); }, doc, () => "sach_xua");
}
