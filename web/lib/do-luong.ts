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
  | "school_switched" | "daily_intent_set"
  // HL-1: tìm ngày đẹp cho một việc (chỉ mã việc + số ngày tìm được)
  | "good_day_searched"
  // ND-2: bấm nút kêu gọi ban biên tập đặt từ CMS (mã đo + trang + vị trí)
  | "cms_khoi_bam"
  // TS-NOIDAU: bấm một câu hỏi nỗi đau (bảng 5 trụ) hoặc câu "hỏi tiếp" sau câu trả lời — chỉ mã câu + mã trụ
  | "pain_point_clicked"
  // TS-V3b: "Phái nào nói đúng về bạn?" — chỉ mã phái + số lần đã chọn (đếm trên máy), không câu chữ
  | "school_voted"
  // KC-0: "Đúng với mình / Chưa đúng" trên thẻ Tử vi (phi hoá, nhịp 3 tháng) — chỉ mã mẫu + loại + kết quả + phái
  | "tuvi_kiem_chung"
  // LG-ĐS: "Đúng ý bạn hỏi?" sau câu trả lời Tử vi có ý định gợi ý từ kho vectơ — chỉ mã ý định + kết quả + độ gần
  | "tuvi_y_dinh_xac_nhan"
  // LG-ĐS: lưu / xoá bài luận (chỉ mã mô-đun), bật tắt tự lưu
  | "luan_giai_saved"
  // CTA-1: khối "Đọc tiếp về bạn" cuối phần xem — chỉ mã trang (tu), mã mảng đích (den), cờ cá nhân hoá, số chương khoá
  | "cross_cta_viewed" | "cross_cta_clicked" | "sao_cta_clicked" | "donate_cta_clicked"
  // CTA-1: trò "Đoán số" trên thẻ Bản đồ 5 mảng — đúng/sai + mã biến thể câu mời
  | "guess_played";

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
  nhan_ra: "number",    // HN-4: 1 = câu gõ nhận ra ý định, 0 = không (chỉ đếm)
  nhom_chua_ho_tro: "string", // HN-4: mã nhóm cố định nối dấu phẩy (từ engine), không bao giờ là chữ người dùng gõ
  lech: "number",       // TV-V2: định giờ sinh — canh giờ người dùng chọn lệch -1 / 0 / 1 so với giờ đã nhập (không ngày giờ)
  viec: "string",       // HL-1: mã việc chọn ngày (cuoi_hoi, khai_truong…)
  so_thang: "number",
  co_tuoi: "number",
  so_ngay: "number",
  lan: "number",        // TS-V3b: số phiếu "phái nào nói đúng" đã bấm (đếm trên máy)
  nhiem_vu: "string",
  ma_do: "string",      // ND-2: mã đo ban biên tập đặt cho nút CMS (chữ thường, số, gạch dưới)
  trang: "string",      // ND-2: đường dẫn trang chứa nút
  tru: "string",       // TS-NOIDAU: mã trụ đời (su_nghiep_tien_bac…)
  ma_cau: "string",     // TS-NOIDAU: mã câu hỏi chuẩn trong KB (sn_sai_nghe…), không bao giờ là câu gõ tay
  mau: "string",        // KC-0: mã mẫu tất định (lib/kiem-chung: "mau.quan_loc.ky.menh", "thuan.ln", "ds.su_nghiep…"), ≤ 60
  loai: "string",       // KC-0: phi_hoa / nhip_3_thang / doi_song (LG-ĐS)
  do_gan: "number",     // LG-ĐS: độ gần cosine của gợi ý ý định từ kho vectơ (0–1), không bao giờ là câu hỏi
  tu: "string",         // CTA-1: mã trang đặt khối gợi chéo (tu_vi, than_so…) — không phải ?tu= của link mời
  den: "string",        // CTA-1: mã mảng đích của thẻ được bấm
  ca_nhan: "number",    // CTA-1: 1 = thẻ có luận giải nhỏ cá nhân hoá, 0 = câu chung
  so_chuong: "number",  // CTA-1: số chương còn khoá khi bấm nút Sao
  dung: "number",       // CTA-1: trò đoán số — 1 đúng, 0 sai
  bien_the: "string",   // CTA-1: mã biến thể câu mời / tiêu đề (t0, b1…) để so câu nào được bấm nhiều
  vi_tri: "string",     // ND-2: tren / duoi / cuoi   // SAO-3: mã nhiệm vụ (luu_ho_so / hoi_3_cau / moi_1_ban)
};
const GIOI_HAN_CHUOI = 40;
/** Khoá được dài hơn 40 ký tự (mã tất định có cấu trúc). */
const GIOI_HAN_RIENG: Record<string, number> = { mau: 60 };

export function locThuocTinh(p: Record<string, unknown> = {}): Record<string, string | number> {
  const kq: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(p)) {
    const kieu = CHO_PHEP[k];
    if (kieu === "number" && typeof v === "number" && Number.isFinite(v)) kq[k] = v;
    // Chặn chuỗi có 4 chữ số liền (dễ là năm sinh) — trừ ma_moi (chuỗi chữ ký ngẫu nhiên).
    else if (kieu === "string" && typeof v === "string" && v.length <= (GIOI_HAN_RIENG[k] ?? GIOI_HAN_CHUOI)
             && (k === "ma_moi" || !/\d{4}/.test(v))) kq[k] = v;
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
