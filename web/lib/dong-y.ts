"use client";
// Đồng ý cookie đo lường của Google (GTM / GA4). Luật BVDLCN 91/2025 + NĐ 356/2025: không đồng ý mặc định →
// chưa bấm "Đồng ý" thì KHÔNG tải script Google nào. PostHog (ẩn danh, không cookie) không phụ thuộc lựa chọn này.
export type LuaChon = "dong_y" | "tu_choi";
const KHOA = "hbt.dong-y-cookie.v1";
export const SU_KIEN = "hbt:dong-y-cookie";

/** Container GTM của chủ dự án (2026-10-08). Mã này công khai trong mã nguồn trang. Env ghi đè; "off" = tắt. */
const GTM_MAC_DINH = "GTM-KNZL39CS";
const env = (v: string | undefined, macDinh = "") => (v === "off" ? "" : v || macDinh);
export const GTM_ID = env(process.env.NEXT_PUBLIC_GTM_ID, GTM_MAC_DINH);
export const GA_ID = env(process.env.NEXT_PUBLIC_GA_ID);
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
