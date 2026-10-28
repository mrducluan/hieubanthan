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
  const out: Omit<T, "chuong"> & { chuong: (ChuongDay | ChuongKhoa)[]; so_khoa: number } =
    { ...bc, chuong: [...bc.chuong.slice(0, n), ...khoa], so_khoa: khoa.length };
  // LG-ĐS: báo cáo đời sống có trường ngoài `chuong` mang nội dung của chương sau — không được lộ khi chương đó khoá.
  if (khoa.length) {
    const mo = new Set(bc.chuong.slice(0, n).map((c) => c.ma));
    const o = out as Record<string, unknown>;
    if (Array.isArray(bc.cot_loi)) {
      o.cot_loi = (bc.cot_loi as { tu_chuong?: unknown }[]).filter((h) => typeof h.tu_chuong === "string" && mo.has(h.tu_chuong));
    }
    if ("thoi_gian_bieu" in bc && !mo.has("cuoc_doi")) delete o.thoi_gian_bieu;
    // MT-ĐS B6: khung "Cần lưu ý ở từng mảng" — dòng của chương khoá chỉ giữ tên + mức (lời và việc nên làm bỏ hẳn).
    if (Array.isArray(bc.luu_y_mang)) {
      o.luu_y_mang = (bc.luu_y_mang as Record<string, unknown>[]).map((r) =>
        typeof r.tu_chuong === "string" && mo.has(r.tu_chuong) ? r
          : { ma: r.ma, ten: r.ten, muc: r.muc, nhan_muc: r.nhan_muc, tu_chuong: r.tu_chuong, khoa: true });
    }
  }
  return out;
}
