// SAO-3 — "Nhiệm vụ kiếm Sao" (migration 0014): kiểu dữ liệu dùng chung cho route /api/sao/nhiem-vu và hộp
// components/sao/NhiemVuSao. Điều kiện + mức thưởng do SQL quyết (nhiem_vu_cua_toi / nhan_thuong_nhiem_vu);
// ở đây chỉ có tên hiển thị và thứ tự.
export const MA_NHIEM_VU = ["luu_ho_so", "hoi_3_cau", "moi_1_ban"] as const;
export type MaNhiemVu = (typeof MA_NHIEM_VU)[number];

export const KHOA_MUC: Record<MaNhiemVu, string> = {
  luu_ho_so: "sao.nhiem_vu.luu_ho_so", hoi_3_cau: "sao.nhiem_vu.hoi_3_cau", moi_1_ban: "sao.nhiem_vu.moi_1_ban",
};

export const TEN_NHIEM_VU: Record<MaNhiemVu, { ten: string; mo: string; can: number }> = {
  luu_ho_so: { ten: "Lưu hồ sơ", mo: "Lưu hồ sơ vào tài khoản để dùng trên mọi máy.", can: 1 },
  hoi_3_cau: { ten: "Hỏi 3 câu", mo: "Hỏi điều bạn băn khoăn ở bất kỳ mảng nào (khi đã đăng nhập).", can: 3 },
  moi_1_ban: { ten: "Mời 1 bạn", mo: "Bạn bè mở link mời của bạn, tạo tài khoản và lưu hồ sơ.", can: 1 },
};

export type NhiemVu = {
  ma: MaNhiemVu; can: number; tien_do: number; dat: boolean; sao: number; da_nhan: boolean; sao_da_nhan: number | null;
};

/** GET /api/sao/nhiem-vu */
export type TrangThaiNhiemVu =
  | { tai_khoan: false }
  | { tai_khoan: true; dang_nhap: false; bat: boolean; muc: Record<MaNhiemVu, number>; chao_mung: number }
  | { tai_khoan: true; dang_nhap: true; san_sang: false }
  | { tai_khoan: true; dang_nhap: true; san_sang: true; bat: boolean; nhiem_vu: NhiemVu[] };

/** POST /api/sao/nhiem-vu {ma} */
export type KetQuaNhiemVu =
  | { ket_qua: "da_thuong"; sao: number }
  | { ket_qua: "da_nhan" | "chua_mo" | "khong_hop_le" }
  | { ket_qua: "chua_dat"; tien_do: number; can: number };
