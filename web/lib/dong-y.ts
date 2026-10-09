"use client";
// Đồng ý cookie đo lường của Google (GTM / GA4) — Consent Mode v2.
// Chủ dự án chốt 2026-10-09: GTM nạp trên MỌI trang; lựa chọn điều khiển analytics_storage. Khi traffic còn thấp
// (HOI_DONG_Y tắt): chưa chọn = granted, không hiện hộp hỏi; Từ chối (qua "Tuỳ chọn cookie") → denied + xoá _ga.
// Bật HOI_DONG_Y: chưa chọn = denied, hộp hỏi hiện khi mở trang. PostHog (ẩn danh) không phụ thuộc.
import { GA_ID, GTM_ID, HOI_DONG_Y, KHOA_DONG_Y } from "@/lib/ma-google";
export { GA_ID, GTM_ID, HOI_DONG_Y };
export type LuaChon = "dong_y" | "tu_choi";
const KHOA = KHOA_DONG_Y;
export const SU_KIEN = "hbt:dong-y-cookie";

/** Chỉ hỏi đồng ý khi thật sự có cài đo lường Google. */
export const coGoogle = (): boolean => Boolean(GTM_ID || GA_ID);

export function docLuaChon(): LuaChon | null {
  try {
    const v = window.localStorage.getItem(KHOA);
    return v === "dong_y" || v === "tu_choi" ? v : null;
  } catch {
    return null;
  }
}

function bao(v: LuaChon | null) {
  window.dispatchEvent(new CustomEvent(SU_KIEN, { detail: v }));
}

export function ghiLuaChon(v: LuaChon) {
  try { window.localStorage.setItem(KHOA, v); } catch { /* chế độ riêng tư: chỉ giữ trong phiên */ }
  bao(v);
}

/** Mở lại hộp hỏi (link "Tuỳ chọn cookie" ở chân trang). */
export function hoiLai() {
  try { window.localStorage.removeItem(KHOA); } catch { /* bỏ qua */ }
  bao(null);
}
