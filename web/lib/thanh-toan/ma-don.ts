// Mã đơn ↔ mã Pay2S — hàm thuần, dùng được cả ở trình duyệt (không node:crypto).
// orderId = orderInfo (nội dung chuyển khoản) = "HBT" + mã đơn đủ 7 chữ số: Pay2S đòi orderInfo 10–32 ký tự, chỉ chữ +
// số, không trùng giữa các đơn → dùng chính mã đơn (duy nhất, sinh từ sequence 100001…).
export const maPay2s = (maDon: number) => `HBT${String(maDon).padStart(7, "0")}`;

/** "HBT0100001" → 100001. Chuỗi khác dạng → null. */
export function maDonTuPay2s(s: unknown): number | null {
  const m = typeof s === "string" ? /^HBT(\d{7,15})$/.exec(s) : null;
  const n = m ? Number(m[1]) : NaN;
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/** Mã đơn trên trang quay về. Pay2S nối tham số kết quả vào redirectUrl bằng "?…" kể cả khi URL đã có "?ma=", nên
 *  ?ma= có thể thành "100001?partnerCode=…" → lấy dãy số đầu; không có thì đọc orderId (HBT…) Pay2S gửi kèm. */
export function maDonQuayVe(ma: string | null, orderId: string | null): string {
  const so = /^\d{1,15}/.exec(ma ?? "")?.[0];
  if (so) return so;
  const n = maDonTuPay2s(orderId);
  return n ? String(n) : "";
}
