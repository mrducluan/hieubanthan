// CV-2 — đổi hồ sơ đã có trên máy (hồ sơ nhà của /phong-thuy, hồ sơ cửa hàng của /quan-ly-nhan-su) thành "hướng" gửi Cố vấn.
// Hàm thuần, không đọc localStorage, không tính phong thuỷ: chỉ chuyển cách ghi (tên 8 hướng → số độ, khoảng năm → năm đại diện).
export interface HuongChon { do_huong: number; nam_xay?: number }
export interface HoSoNhaToi { huong_do?: number; huong?: string; nam_xay?: number; van_xay?: number }
export interface HoSoCuaHangToi { do_huong: number; cach_nam: "chinh_xac" | "khoang" | "khong_ro"; nam_xay?: number }

export const HUONG_NHANH: { ten: string; do: number }[] = [
  { ten: "Bắc", do: 0 }, { ten: "Đông Bắc", do: 45 }, { ten: "Đông", do: 90 }, { ten: "Đông Nam", do: 135 },
  { ten: "Nam", do: 180 }, { ten: "Tây Nam", do: 225 }, { ten: "Tây", do: 270 }, { ten: "Tây Bắc", do: 315 },
];
const DO_TU_TEN: Record<string, number> = Object.fromEntries(HUONG_NHANH.map((h) => [h.ten, h.do]));
/** Năm đại diện của khoảng năm xây (khớp hồ sơ cửa hàng của /quan-ly-nhan-su): sao của nhà chỉ phụ thuộc Vận (20 năm). */
export const NAM_TU_VAN: Record<number, number> = { 6: 1975, 7: 1990, 8: 2010, 9: 2025 };

/** Hướng + năm xây từ hồ sơ nhà (null khi chưa có hướng nào). Số độ thắng tên hướng; chỉ nhớ khoảng năm → năm đại diện của vận. */
export function huongTuHoSoNha(n: HoSoNhaToi | null | undefined): HuongChon | null {
  if (!n) return null;
  const doHuong = n.huong_do ?? (n.huong ? DO_TU_TEN[n.huong] : undefined);
  if (doHuong == null) return null;
  const nam = n.nam_xay ?? (n.van_xay ? NAM_TU_VAN[n.van_xay] : undefined);
  return { do_huong: doHuong, ...(nam ? { nam_xay: nam } : {}) };
}

/** Hướng mặt tiền từ hồ sơ cửa hàng: "không rõ năm xây" thì không gửi năm (engine sẽ nói thật là chưa lập được bàn sao). */
export function huongTuCuaHang(m: HoSoCuaHangToi | null | undefined): HuongChon | null {
  return m ? { do_huong: m.do_huong, ...(m.cach_nam !== "khong_ro" && m.nam_xay ? { nam_xay: m.nam_xay } : {}) } : null;
}
