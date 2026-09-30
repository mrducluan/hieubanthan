"use client";
// Đo lường funnel (UI-6, docs/THIET-KE-UI.md §9) qua PostHog — CHỈ khi có NEXT_PUBLIC_POSTHOG_KEY.
// Tuyệt đối không gửi ngày/giờ sinh, họ tên, nội dung câu hỏi: mọi thuộc tính qua `locThuocTinh`.
// Tắt autocapture + session recording (ô nhập ngày sinh không bao giờ bị ghi).
import type { PostHog } from "posthog-js";

export type SuKien =
  | "landing_viewed" | "reading_started" | "reading_completed" | "profile_created"
  | "compatibility_created" | "share_created" | "share_clicked" | "referral_signup"
  | "advisor_question_started" | "advisor_question_completed" | "feedback_submitted";

/** Thuộc tính được phép và kiểu giá trị. Thứ khác bị bỏ. */
const CHO_PHEP: Record<string, "string" | "number"> = {
  feature_version: "string",
  mo_dun: "string",
  kind: "string",
  ma_moi: "string",
  so_duong_doi: "number",
  huu_ich: "string",
  ket_qua: "string",
};
const GIOI_HAN_CHUOI = 40;

export function locThuocTinh(p: Record<string, unknown> = {}): Record<string, string | number> {
  const kq: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(p)) {
    const kieu = CHO_PHEP[k];
    if (kieu === "number" && typeof v === "number" && Number.isFinite(v)) kq[k] = v;
    // Chặn chuỗi có 4 chữ số liền (dễ là năm sinh) — trừ ma_moi (chuỗi chữ ký ngẫu nhiên).
    else if (kieu === "string" && typeof v === "string" && v.length <= GIOI_HAN_CHUOI && (k === "ma_moi" || !/\d{4}/.test(v))) kq[k] = v;
  }
  return kq;
}

export const PHIEN_BAN = "ui_v1";
const KHOA_MOI = "hbt.ma_moi";

let ph: PostHog | null = null;
let dangNap: Promise<PostHog | null> | null = null;

function nap(): Promise<PostHog | null> {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key || typeof window === "undefined") return Promise.resolve(null);
  if (ph) return Promise.resolve(ph);
  dangNap ??= import("posthog-js").then(({ default: posthog }) => {
    posthog.init(key, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      autocapture: false,
      capture_pageview: false,
      capture_pageleave: false,
      disable_session_recording: true,
      person_profiles: "identified_only",
      persistence: "localStorage",
      mask_all_text: true,
      mask_all_element_attributes: true,
    });
    ph = posthog;
    return posthog;
  }).catch(() => null);
  return dangNap;
}

export function ghi(su_kien: SuKien, p: Record<string, unknown> = {}): void {
  const props = { feature_version: PHIEN_BAN, ...locThuocTinh(p) };
  if (process.env.NODE_ENV !== "production" && typeof window !== "undefined") {
    (window as unknown as { __hbt_su_kien?: unknown[] }).__hbt_su_kien ??= [];
    (window as unknown as { __hbt_su_kien: unknown[] }).__hbt_su_kien.push({ su_kien, ...props });
  }
  void nap().then((p2) => p2?.capture(su_kien, props));
}

/** Ghi nhận người đến từ link mời/thẻ; dùng khi họ tạo hồ sơ → referral_signup. */
export function nhoMaMoi(ma: string): void {
  try { sessionStorage.setItem(KHOA_MOI, ma); } catch { /* bỏ qua */ }
}
export function layMaMoi(): string | null {
  try { return sessionStorage.getItem(KHOA_MOI); } catch { return null; }
}
export function maMoiTuToken(token: string): string {
  return (token.split(".")[1] ?? "").slice(0, 10);
}
