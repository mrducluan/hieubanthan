"use client";
// Meta Pixel — sự kiện chuyển đổi (chủ dự án yêu cầu 2026-11-16). Chỉ gửi mã sự kiện + giá trị đơn, KHÔNG gửi tên, ngày giờ sinh,
// email hay nội dung hỏi. Pixel được nạp ở components/khung/MetaPixel.tsx (tôn trọng "Tuỳ chọn cookie": revoke → Meta bỏ qua).
type Fbq = (...a: unknown[]) => void;
const fb = (): Fbq | undefined => (typeof window === "undefined" ? undefined : (window as unknown as { fbq?: Fbq }).fbq);

/** Lead = người dùng tạo hồ sơ. Tính MỘT lần mỗi thiết bị (người sửa hồ sơ / quay lại không bị đếm lại). */
export function metaLead(): void {
  const f = fb();
  if (!f) return;
  try {
    if (localStorage.getItem("hbt.fb.lead") === "1") return;
    localStorage.setItem("hbt.fb.lead", "1");
  } catch { /* không có localStorage: vẫn gửi */ }
  f("track", "Lead");
}

/** Purchase = đơn nạp Sao / hội viên đã thanh toán. `eventID` = mã đơn để Meta khử trùng; giá trị tính bằng VND. */
export function metaPurchase(soTien: number, maDon: number): void {
  const f = fb();
  if (!f || !Number.isFinite(soTien) || soTien <= 0) return;
  f("track", "Purchase", { value: soTien, currency: "VND" }, { eventID: `don-${maDon}` });
}
