// CTA-2 — tính lớp lưới cho khối thẻ có số mục thay đổi (không phụ thuộc dữ liệu → dùng được cả ở component client).

/** Số ô cần bù để lưới `cot` cột kín hàng (0 mục → 0: không dựng khối chỉ toàn thẻ bù). */
export const soCanLap = (soMuc: number, cot = 3) => (soMuc <= 0 ? 0 : (cot - (soMuc % cot)) % cot);

/** Ô cuối của lưới `sm:grid-cols-2 lg:grid-cols-3` khi tổng lẻ: chiếm cả hàng ở 2 cột (khỏi lủng một ô), về 1 ô ở 3 cột. */
export const lopOCuoi = (i: number, tong: number) => (tong % 2 === 1 && i === tong - 1 && tong > 1 ? "sm:col-span-2 lg:col-span-1" : "");

/** Lưới không bù được (thống kê, gói Sao, thẻ công cụ do biên tập chọn): số cột theo số mục để hàng nào cũng kín.
 *  Chuỗi lớp viết đủ (Tailwind quét mã nguồn). toiDa 4 = lưới vốn 2 cột trên điện thoại (thẻ công cụ trang đích). */
export function lopCot(n: number, toiDa: 3 | 4 = 3): string {
  if (toiDa === 4) {
    if (n <= 1) return "grid-cols-1";
    if (n === 2) return "grid-cols-2";
    if (n === 3) return "grid-cols-1 sm:grid-cols-3";
    if (n === 5 || n === 6 || n === 9) return "grid-cols-2 lg:grid-cols-3";
    return "grid-cols-2 lg:grid-cols-4";
  }
  if (n <= 1) return "";
  if (n === 2 || n === 4) return "sm:grid-cols-2";
  if (n === 3) return "sm:grid-cols-3";
  return "sm:grid-cols-2 lg:grid-cols-3";
}
