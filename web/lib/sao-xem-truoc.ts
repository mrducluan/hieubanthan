// SAO-2 — cắt báo cáo "Luận giải toàn bộ" thành bản xem trước (thuần, không I/O — dùng ở máy chủ, có test).
// N chương đầu giữ trọn; chương sau CHỈ còn tiêu đề + lời mời xem tiếp (điểm nhấn đã tính + câu hỏi mở) do engine
// soạn — đoạn văn bị bỏ hẳn khỏi phản hồi (không lộ qua tab Network), không phải làm mờ bằng CSS.

export type MoiXem = { diem_nhan: string; cau_hoi: string; so_doan: number; phut_doc: number };
export type ChuongDay = { ma: string; tieu_de: string; doan: string[]; van_ai?: string; moi_xem?: MoiXem; [k: string]: unknown };
export type ChuongKhoa = { ma: string; tieu_de: string; khoa: true; moi_xem: MoiXem };
export type BaoCaoDay = { chuong: ChuongDay[]; [k: string]: unknown };

export function catXemTruoc<T extends BaoCaoDay>(bc: T, mienPhi: number): Omit<T, "chuong"> & { chuong: (ChuongDay | ChuongKhoa)[]; so_khoa: number } {
  const n = Math.max(0, Math.min(mienPhi, bc.chuong.length));
  const khoa = bc.chuong.slice(n).map((c): ChuongKhoa => ({
    ma: c.ma, tieu_de: c.tieu_de, khoa: true,
    moi_xem: c.moi_xem ?? { diem_nhan: "", cau_hoi: "Chương này nói gì về chính bạn?", so_doan: c.doan.length, phut_doc: 1 },
  }));
  return { ...bc, chuong: [...bc.chuong.slice(0, n), ...khoa], so_khoa: khoa.length };
}
