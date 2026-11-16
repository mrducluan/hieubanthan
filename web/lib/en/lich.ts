// EN-ALL GĐ 8 — tiện ích máy chủ cho trang lịch bản Anh (Xem ngày tốt, Lịch âm, Đổi lịch): hreflang hai chiều trên trang
// Việt dùng metaTrang (không qua metaMacDinh), chữ bảng lịch theo ngôn ngữ lượt tải.
import type { Metadata } from "next";
import { ngonNguMayChu } from "@/lib/ngon-ngu-may-chu";
import { taoChu } from "@/lib/chu-trang";
import { CHU_LICH_UI } from "@/lib/chu/lich";

/** Gắn hreflang vi ↔ en (bản Việt là x-default) vào metadata của trang Việt. */
export function voiHreflang<M extends Metadata>(meta: M, vi: string, en: string): M {
  return { ...meta, alternates: { ...meta.alternates, languages: { vi, en, "x-default": vi } } };
}

/** Ngôn ngữ lượt tải + hàm chữ của bảng lịch. */
export async function chuLichMayChu() {
  const { ngonNgu, ma } = await ngonNguMayChu();
  return { en: ngonNgu === "en", ma, c: taoChu(CHU_LICH_UI, null, ngonNgu) };
}
