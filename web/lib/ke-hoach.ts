// KH-1 — danh mục việc định làm (mã + chữ chip). Mã khớp `ke_hoach_thang_kb.json` của engine (test e2e so khớp); chữ đầy đủ,
// lý do, ngày gợi ý đều do engine trả — web chỉ hiện.
export const MA_KE_HOACH = ["doi_viec", "khoi_su", "ky_ket", "mua_nha", "xay_nha", "cuoi_hoi", "di_xa", "hoc_thi", "mua_xe"] as const;
export type MaKeHoach = (typeof MA_KE_HOACH)[number];

export const CHIP_KE_HOACH: Record<MaKeHoach, string> = {
  doi_viec: "Đổi việc", khoi_su: "Khai trương", ky_ket: "Ký hợp đồng, bàn lương", mua_nha: "Mua nhà",
  xay_nha: "Làm, sửa nhà", cuoi_hoi: "Cưới hỏi", di_xa: "Đi xa, du học", hoc_thi: "Học, thi", mua_xe: "Mua xe",
};

export type ThangKeHoach = {
  thang: string; so: number; nhan_so: string; nhip: "thuan" | "duoc" | "binh" | "can_nhac" | "cham"; nhan_nhip: string;
  dau: string[]; cham: string[]; so_ngay: number; ngay: { ngay: string; am: string; can_chi: string; diem_cong: string[] }[];
};
export type KetQuaKeHoach = {
  ke_hoach: { ma: MaKeHoach; ten: string; cau_hoi: string };
  thang: ThangKeHoach[]; tot_nhat: { thang: string }[]; nen_lui: string[]; tra_loi: string;
  viec_lam: string[]; ranh_gioi: string; nam_luu_y: string[]; tap_quan: string; cach_xep: string;
  thieu: string[]; thieu_loi: string; ket: string;
};
