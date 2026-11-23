"use client";
// Meta Pixel — sự kiện chuyển đổi (chủ dự án yêu cầu 2026-11-16). Chỉ gửi MÃ sự kiện + mã mảng + giá trị đơn, KHÔNG gửi tên,
// ngày giờ sinh, email hay nội dung hỏi. Pixel được nạp ở components/khung/MetaPixel.tsx (tôn trọng "Tuỳ chọn cookie").
// Meta tự gắn URL trang (dl) vào MỌI sự kiện và không lọc được như PostHog → trang mang mã thẻ / lời mời / quà (tên hiển thị
// nằm trong mã) thì không gửi gì.
//
// Bảng sự kiện (META-QC, chủ dự án duyệt 2026-11-16) — nối từ ghi() của lib/do-luong.ts:
//   profile_created            → Lead                       (một lần mỗi thiết bị)
//   reading_started{mo_dun}    → ViewContent {content_category: mảng}   (một lần mỗi mảng mỗi phiên)
//   reading_completed{mo_dun}  → ReadingCompleted (tuỳ chỉnh)            (một lần mỗi mảng mỗi phiên)
//   advisor_question_completed → QuestionAnswered (tuỳ chỉnh)            (một lần mỗi mảng mỗi phiên)
//   unlock_clicked{kind=bam}   → AddToCart {content_category: mảng, value ≈ VND} (CRO-1: bậc giữa Lead → Purchase để tối ưu; một lần mỗi mảng mỗi phiên)
//   checkout_started{kind,goi} → InitiateCheckout {content_type, content_ids, value VND của gói} (CRO-1: thêm value)
//   unlock_succeeded{mo_dun}   → UnlockChapter (tuỳ chỉnh)
//   trang kết quả đơn đã trả   → Purchase {value VND, content_type} (eventID don-<mã> = API chuyển đổi máy chủ) + Subscribe (hội viên)
import { coMaTrongUrl } from "@/lib/lam-sach-url";
import { META_BAT } from "@/lib/meta-id";
import { HOI_DONG_Y, KHOA_DONG_Y } from "@/lib/ma-google";

type Fbq = (...a: unknown[]) => void;
type CuaSo = { fbq?: Fbq; __hbt_fb_nap?: () => void };
const cs = (): CuaSo | undefined => (typeof window === "undefined" ? undefined : (window as unknown as CuaSo));

function sanSang(): Fbq | undefined {
  const w = cs();
  if (!w?.fbq || coMaTrongUrl(window.location.href)) return undefined;
  return w.fbq;
}

/** Người dùng chưa tắt cookie đo lường (cùng luật Pixel + Consent Mode) → được gửi mã khớp cho API chuyển đổi khi nạp. */
export function metaDongY(): boolean {
  if (!META_BAT || typeof window === "undefined") return false;
  let c: string | null = null;
  try { c = localStorage.getItem(KHOA_DONG_Y); } catch { /* riêng tư */ }
  return c === "dong_y" || (c === null && !HOI_DONG_Y);
}

/** Một lần mỗi khoá trong phiên (sessionStorage) — tránh dồn sự kiện khi người dùng xem đi xem lại. */
function motLanPhien(k: string): boolean {
  try {
    const kk = `hbt.fb.${k}`;
    if (sessionStorage.getItem(kk)) return false;
    sessionStorage.setItem(kk, "1");
  } catch { /* vẫn gửi */ }
  return true;
}

const MA = /^[a-z0-9_]{1,30}$/;
const ma = (v: unknown): string | null => (typeof v === "string" && MA.test(v) ? v : null);

/** Lead = người dùng tạo hồ sơ. Tính MỘT lần mỗi thiết bị (người sửa hồ sơ / quay lại không bị đếm lại). */
export function metaLead(): void {
  const f = sanSang();
  if (!f) return;
  try {
    if (localStorage.getItem("hbt.fb.lead") === "1") return;
    localStorage.setItem("hbt.fb.lead", "1");
  } catch { /* không có localStorage: vẫn gửi */ }
  f("track", "Lead");
}

/** CRO-1: giá trị (VND) đi kèm sự kiện kế tiếp (AddToCart / InitiateCheckout). PostHog cố ý KHÔNG nhận số tiền, nên nơi
 *  gọi đặt giá trị riêng cho Meta ngay trước ghi(); dùng một lần rồi xoá. */
let giaTriCho: number | null = null;
export function datGiaTriMeta(vnd: number | null | undefined): void {
  giaTriCho = typeof vnd === "number" && Number.isFinite(vnd) && vnd > 0 ? Math.round(vnd) : null;
}
/** QC-G: xem (không lấy) giá trị đang chờ — ghi() đưa cùng số cho dataLayer Google trước khi Meta dùng rồi xoá. */
export function xemGiaTriMeta(): number | null { return giaTriCho; }
function layGiaTri(): { value: number; currency: "VND" } | Record<string, never> {
  const v = giaTriCho; giaTriCho = null;
  return v ? { value: v, currency: "VND" } : {};
}

/** Nối sự kiện PostHog (đã qua bộ lọc thuộc tính) sang sự kiện Meta. Sự kiện không có trong bảng → bỏ qua. */
export function metaSuKien(suKien: string, p: Record<string, string | number | boolean>): void {
  if (suKien === "profile_created") return metaLead();
  const f = sanSang();
  if (!f) { if (suKien === "checkout_started" || suKien === "unlock_clicked") giaTriCho = null; return; }
  const mang = ma(p.mo_dun);
  switch (suKien) {
    case "reading_started":
      if (mang && motLanPhien(`xem.${mang}`)) f("track", "ViewContent", { content_category: mang, content_type: "product" });
      return;
    case "reading_completed":
      if (mang && motLanPhien(`xong.${mang}`)) f("trackCustom", "ReadingCompleted", { mo_dun: mang });
      return;
    case "advisor_question_completed":
      if (mang && motLanPhien(`hoi.${mang}`)) f("trackCustom", "QuestionAnswered", { mo_dun: mang });
      return;
    case "checkout_started": {
      const goi = ma(p.goi);
      f("track", "InitiateCheckout", { content_type: ma(p.kind) ?? "sao", ...(goi ? { content_ids: [goi] } : {}), ...layGiaTri(), currency: "VND" });
      return;
    }
    case "unlock_clicked": {
      const gt = layGiaTri();
      if (p.kind === "bam" && mang && motLanPhien(`mo.${mang}`)) f("track", "AddToCart", { content_category: mang, content_type: "product", ...gt });
      return;
    }
    case "unlock_succeeded":
      f("trackCustom", "UnlockChapter", mang ? { mo_dun: mang } : {});
      return;
  }
}

/** Purchase = đơn nạp Sao / hội viên đã thanh toán. `eventID` = mã đơn — trùng sự kiện API chuyển đổi máy chủ gửi
 *  (lib/meta-capi.ts) → Meta chỉ đếm một lần. Trang kết quả tự chuyển trang sau 2,5 giây → nạp fbevents.js ngay. */
export function metaPurchase(soTien: number, maDon: number, loai = "sao"): void {
  const f = sanSang();
  if (!f || !Number.isFinite(soTien) || soTien <= 0) return;
  const kieu = ma(loai) ?? "sao";
  f("track", "Purchase", { value: soTien, currency: "VND", content_type: kieu }, { eventID: `don-${maDon}` });
  if (kieu === "hoi_vien") f("track", "Subscribe", { value: soTien, currency: "VND", predicted_ltv: soTien }, { eventID: `hv-${maDon}` });
  cs()?.__hbt_fb_nap?.();
}

/** PageView khi chuyển trang trong app (pushState tự động của Meta đã tắt để không lộ URL có mã). */
export function metaPageView(): void {
  sanSang()?.("track", "PageView");
}
