// KV-THANG — "Tháng của tôi": khi nào hiện tổng kết tháng trước và nói gì. Hàm thuần (không React, không Supabase) để
// trang + e2e dùng chung. Giọng: kể lại (thì quá khứ), không khen hơn ai, không "mục tiêu / kỷ lục / còn N ngày", không
// so với tháng trước bằng %, không hứa Sao. Huy hiệu chỉ nêu loại vừa đạt trong tháng; "hội viên" và "lưu hồ sơ" không nêu
// (không phải dấu mốc của tháng).
import type { ThongKeThang } from "@/lib/nhat-ky-ngay";

/** Dưới ngưỡng này tháng trước không có tổng kết (không có gì để kể, không CTA trống). */
export const NGUONG_NGAY_TONG_KET = 3;
export const KHOA_DONG_TONG_KET = "hbt.tong_ket_dong.v1";
/** Huy hiệu không nêu trong tổng kết tháng (không phải dấu mốc theo tháng, hoặc là tình trạng mua hàng). */
export const HUY_HIEU_KHONG_NEU = new Set(["hoi_vien", "da_luu_ho_so"]);

export interface TongKet extends ThongKeThang {
  /** Mã huy hiệu đạt TRONG tháng đó (máy + tài khoản), đã lọc HUY_HIEU_KHONG_NEU. */
  huy_hieu_moi: string[];
}

export const maThang = (nam: number, thang: number) => `${nam}-${String(thang).padStart(2, "0")}`;

/** Có hiện tổng kết tháng không: đủ ngày ghé và chưa bấm đóng tháng đó. */
export function nenHienTongKet(tk: Pick<TongKet, "nam" | "thang" | "so_ngay">, daDong: string | null): boolean {
  return tk.so_ngay >= NGUONG_NGAY_TONG_KET && daDong !== maThang(tk.nam, tk.thang);
}

export function docDaDong(): string | null {
  try { return localStorage.getItem(KHOA_DONG_TONG_KET); } catch { return null; }
}
export function ghiDaDong(nam: number, thang: number): void {
  try { localStorage.setItem(KHOA_DONG_TONG_KET, maThang(nam, thang)); } catch { /* bỏ qua */ }
}

const buoi = (n: number) => (n === 1 ? "một buổi sáng" : `${n} buổi sáng`);

/** Các câu kể của tổng kết — mỗi câu một dòng, thì quá khứ. */
export function loiTongKet(tk: TongKet, tenHuyHieu: (ma: string) => string): string[] {
  const cau: string[] = [`Tháng ${tk.thang} bạn ghé Hôm nay ${buoi(tk.so_ngay)}.`];
  if (tk.so_la > 0) cau.push(tk.so_la === 1 ? "Bạn đã lật một lá bài đầu ngày." : `Bạn đã lật ${tk.so_la} lá bài đầu ngày.`);
  if (tk.du_9) cau.push("Bạn đã đi qua đủ 9 nhịp ngày cá nhân trong tháng.");
  else if (tk.so_khac >= 5) cau.push(`Bạn đã đi qua ${tk.so_khac} nhịp ngày cá nhân khác nhau.`);   // không "x trong 9" — phân số thành áp lực
  const hh = tk.huy_hieu_moi.filter((m) => !HUY_HIEU_KHONG_NEU.has(m)).map(tenHuyHieu);
  if (hh.length) cau.push(`Dấu mốc mới trong tháng: ${hh.join(" · ")}.`);
  if (tk.thang_ca_nhan) cau.push(`Theo thần số, tháng ${tk.thang} là tháng cá nhân ${tk.thang_ca_nhan} của bạn.`);
  return cau;
}

/** Câu trên thẻ chia sẻ (người nhận đọc): kể lại ngắn gọn, mời người nhận xem tháng của họ. */
export function loiTheThang(t: { thang: number; so_ngay: number; k: number | null }): string {
  const dau = `Tháng ${t.thang} mình ghé Hôm nay ${buoi(t.so_ngay)}`;
  return t.k ? `${dau} — tháng cá nhân ${t.k} của mình. Còn tháng này của bạn là tháng mấy?` : `${dau}. Còn tháng này của bạn thế nào?`;
}
