"use client";
// Meta Pixel — sự kiện chuyển đổi (chủ dự án yêu cầu 2026-11-16). Chỉ gửi mã sự kiện + giá trị đơn, KHÔNG gửi tên, ngày giờ sinh,
// email hay nội dung hỏi. Pixel được nạp ở components/khung/MetaPixel.tsx (tôn trọng "Tuỳ chọn cookie": revoke → Meta bỏ qua).
// Meta tự gắn URL trang (dl) vào MỌI sự kiện và không lọc được như PostHog → trang mang mã thẻ / lời mời / quà (tên hiển thị
// nằm trong mã) thì không gửi gì.
import { coMaTrongUrl } from "@/lib/lam-sach-url";

type Fbq = (...a: unknown[]) => void;
type CuaSo = { fbq?: Fbq; __hbt_fb_nap?: () => void };
const cs = (): CuaSo | undefined => (typeof window === "undefined" ? undefined : (window as unknown as CuaSo));

function sanSang(): Fbq | undefined {
  const w = cs();
  if (!w?.fbq || coMaTrongUrl(window.location.href)) return undefined;
  return w.fbq;
}

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

/** Purchase = đơn nạp Sao / hội viên đã thanh toán. `eventID` = mã đơn để Meta khử trùng; giá trị tính bằng VND.
 *  Trang kết quả tự chuyển trang sau 2,5 giây → nạp fbevents.js ngay (không chờ tương tác), kẻo sự kiện nằm lại trong hàng đợi. */
export function metaPurchase(soTien: number, maDon: number): void {
  const f = sanSang();
  if (!f || !Number.isFinite(soTien) || soTien <= 0) return;
  f("track", "Purchase", { value: soTien, currency: "VND" }, { eventID: `don-${maDon}` });
  cs()?.__hbt_fb_nap?.();
}

/** PageView khi chuyển trang trong app (pushState tự động của Meta đã tắt để không lộ URL có mã). */
export function metaPageView(): void {
  sanSang()?.("track", "PageView");
}
