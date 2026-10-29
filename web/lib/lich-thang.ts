// KV-THANG — lưới lịch tháng dùng chung cho khối chuỗi (Hôm nay), tổng kết tháng, ảnh OG và trang nhận thẻ: chỉ hình học
// lịch dương (số ngày, thứ của mùng 1 theo tuần bắt đầu thứ Hai). Không huyền học.
export const THU_NGAN = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

export const soNgayTrongThang = (nam: number, thang: number) => new Date(Date.UTC(nam, thang, 0)).getUTCDate();

/** Cột (0 = thứ Hai … 6 = Chủ nhật) của mùng 1. */
export const cotMungMot = (nam: number, thang: number) => (new Date(Date.UTC(nam, thang - 1, 1)).getUTCDay() + 6) % 7;

/** Các ô của lưới 7 cột: null = ô trống trước mùng 1, số = ngày. Luôn đủ hàng cuối (bội số của 7). */
export function oLichThang(nam: number, thang: number): (number | null)[] {
  const dau = cotMungMot(nam, thang), n = soNgayTrongThang(nam, thang);
  const o: (number | null)[] = [...Array<null>(dau).fill(null), ...Array.from({ length: n }, (_, i) => i + 1)];
  while (o.length % 7) o.push(null);
  return o;
}

export const TEN_THANG = (thang: number) => `Tháng ${thang}`;
