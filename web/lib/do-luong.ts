"use client";
// Đo lường funnel (UI-6, docs/THIET-KE-UI.md §9) qua PostHog — CHỈ khi có NEXT_PUBLIC_POSTHOG_KEY.
// Tuyệt đối không gửi ngày/giờ sinh, họ tên, nội dung câu hỏi: mọi thuộc tính qua `locThuocTinh`.
// Tắt autocapture + session recording (ô nhập ngày sinh không bao giờ bị ghi).
import type { PostHog } from "posthog-js";

export type SuKien =
  | "landing_viewed" | "reading_started" | "reading_completed" | "profile_created"
  | "compatibility_created" | "share_created" | "share_clicked" | "referral_signup"
  | "advisor_question_started" | "advisor_question_completed" | "feedback_submitted"
  | "credit_earned" | "chart_interacted" | "daily_viewed"
  | "checkout_viewed" | "checkout_started" | "payment_succeeded"
  // SAO-2: phễu xem trước → chạm khoá → mở khoá / nạp
  | "paywall_viewed" | "unlock_clicked" | "unlock_succeeded" | "quota_reached" | "sao_prompt_answered"
  // TS-PHAI: đổi trường phái thần số · HN-2: người dùng nêu ý định trong ngày (chỉ mã ý định, không gửi câu gõ)
  | "school_switched" | "daily_intent_set";

/** Thuộc tính được phép và kiểu giá trị. Thứ khác bị bỏ. */
const CHO_PHEP: Record<string, "string" | "number"> = {
  feature_version: "string",
  mo_dun: "string",
  kind: "string",
  ma_moi: "string",
  so_duong_doi: "number",
  huu_ich: "string",
  ket_qua: "string",
  so_sao: "number",
  chuoi: "number",      // HN-1: số ngày liên tiếp mở "Hôm nay" (đếm trên máy người dùng)
  nguon: "string",
  quan_he: "string",    // hợp đôi: nguoi_yeu / ban_be / dong_nghiep / sep / gia_dinh
  phai: "string",       // TS-PHAI: pitago / chaldea
  y_dinh: "string",     // HN-2: các MÃ ý định nối bằng dấu phẩy (vd "cong_viec,gap_go"), không bao giờ là câu gõ tay
  go_tay: "number",     // HN-2: 1 nếu người dùng có gõ câu (chỉ đếm, không gửi nội dung)
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

// gate_v1 (2026-10-13): định nghĩa sự kiện Gate mới (reading_* theo mảng) — bảng Gate chỉ đọc sự kiện mang bản này.
export const PHIEN_BAN = "gate_v1";
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
  if ((process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_E2E === "1") && typeof window !== "undefined") {
    (window as unknown as { __hbt_su_kien?: unknown[] }).__hbt_su_kien ??= [];
    (window as unknown as { __hbt_su_kien: unknown[] }).__hbt_su_kien.push({ su_kien, ...props });
  }
  void nap().then((p2) => p2?.capture(su_kien, props));
}

/** Ghi nhận người đến từ link mời/thẻ; dùng khi họ tạo hồ sơ → referral_signup. localStorage 14 ngày (mở link ở tab
 *  khác / quay lại hôm sau vẫn tính) — chỉ là mã ngẫu nhiên của link, không có dữ liệu cá nhân. */
const HAN_MOI = 14 * 86_400_000;
export function nhoMaMoi(ma: string): void {
  try {
    if (localStorage.getItem("hbt.hoso.v1")) return;   // đã có hồ sơ trên máy → không phải người mới, không tính lời mời
    localStorage.setItem(KHOA_MOI, JSON.stringify({ ma, t: Date.now() }));
  } catch { /* bỏ qua */ }
}

/** Mã ngắn ngẫu nhiên (hex) — có cả trình duyệt cũ / http không có crypto.randomUUID. */
export function maNgauNhien(n = 10): string {
  try {
    const b = new Uint8Array(Math.ceil(n / 2));
    crypto.getRandomValues(b);
    return Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("").slice(0, n);
  } catch {
    return Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  }
}
export function layMaMoi(): string | null {
  try {
    const v = JSON.parse(localStorage.getItem(KHOA_MOI) ?? "null") as { ma?: string; t?: number } | null;
    return v?.ma && v.t && Date.now() - v.t < HAN_MOI ? v.ma : null;
  } catch { return null; }
}

export function quenMaMoi(): void { try { localStorage.removeItem(KHOA_MOI); } catch { /* bỏ qua */ } }

/** Một lần mỗi phiên trình duyệt (sessionStorage) cho mỗi khoá — trả true nếu là lần đầu. Không có storage → true. */
export function lanDauTrongPhien(khoa: string): boolean {
  try {
    if (sessionStorage.getItem(`hbt.mot-lan.${khoa}`)) return false;
    sessionStorage.setItem(`hbt.mot-lan.${khoa}`, "1");
  } catch { /* chế độ riêng tư */ }
  return true;
}

/** Gate 1 — bài đọc: reading_started khi KẾT QUẢ của một mảng hiện ra (mỗi phiên một lần mỗi mảng);
 *  reading_completed khi cuộn tới cuối bài đọc (mỗi phiên một lần mỗi mảng, luôn sau started → tỉ lệ ≤ 100%). */
export function batDauDoc(moDun: string, them: Record<string, unknown> = {}): void {
  if (lanDauTrongPhien(`doc-bd.${moDun}`)) ghi("reading_started", { mo_dun: moDun, ...them });
}
export function docXong(moDun: string, them: Record<string, unknown> = {}): void {
  batDauDoc(moDun);
  if (lanDauTrongPhien(`doc-xong.${moDun}`)) ghi("reading_completed", { mo_dun: moDun, ...them });
}

export function maMoiTuToken(token: string): string {
  return (token.split(".")[1] ?? "").slice(0, 10);
}
