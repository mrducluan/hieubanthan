// SAO-2 v2.0 (Allowlist mặc định khoá) — cắt báo cáo "Luận giải toàn bộ" thành bản xem trước (thuần, không I/O).
// Mọi khoá cấp gốc phải được khai báo tường minh trong KHOA_CONG_KHAI_SAO2 hoặc KHOA_CAT_RIENG_SAO2:
// nếu Engine sinh thêm khoá cấp gốc mới chưa phân loại khi `so_khoa > 0`, hàm mặc định BỎ HẲN khỏi JSON trả về client
// (không bao giờ rò nội dung chương khoá vì quên cập nhật Denylist!).

import { createHmac } from "node:crypto";

export type MoiXem = {
  diem_nhan: string;
  cau_hoi: string;
  so_doan: number;
  phut_doc: number;
  cau_tra_loi?: { ma: string; cau: string }[];
  so_nguoi?: number;
};
export type ChuongDay = { ma: string; tieu_de: string; doan: string[]; van_ai?: string; moi_xem?: MoiXem; [k: string]: unknown };
export type ChuongKhoa = { ma: string; tieu_de: string; khoa: true; moi_xem: MoiXem };
export type BaoCaoDay = { chuong: ChuongDay[]; [k: string]: unknown };

/** Các trường metadata / header cấp gốc an toàn được giữ nguyên khi `so_khoa > 0` (đối chứng toàn bộ 5 route trong mau.json.gz). */
export const KHOA_CONG_KHAI_SAO2 = new Set([
  "engine_version",
  "mo_dun",
  "phien_ban",
  "phai",
  "ten",
  "ho_ten",
  "ngay_sinh",
  "nam",
  "cac_nam",
  "nam_toi",
  "ngay_xem",
  "thieu",
  "gio_tam",
  "vai_doc",
  "loi_vai_doc",
  "nguon",
  "source_id",
  "school_id",
  "trang_thai",
  "can_doi_chieu",
  "dien_dat",
  "ket",
  "phi",
  "co_canh_bao",
  "ten_hien",
  "ma_tran",
  "mon_co",
  "so_mang_cung",
  "so_mang_khac",
  "quy_uoc_duong_doi",
  "tuoi_mu",
  "so_chu_dao",
  "con_so",
  "bieu_do_ngay_sinh",
]);

/** Các trường cấp gốc mang nội dung chương sau -> bắt buộc đi qua bộ lọc cắt riêng theo tập chương mở `mo`. */
export const KHOA_CAT_RIENG_SAO2 = new Set([
  "chuong",
  "so_khoa",
  "cot_loi",
  "thoi_gian_bieu",
  "luu_y_mang",
  "nguoi_quanh",
  "ung_dung_co_dien",
]);

export function catXemTruoc<T extends BaoCaoDay>(
  bc: T,
  mienPhi: number,
): Omit<T, "chuong"> & { chuong: (ChuongDay | ChuongKhoa)[]; so_khoa: number } {
  const n = Math.max(0, Math.min(mienPhi, bc.chuong.length));
  const khoa = bc.chuong.slice(n).map((c): ChuongKhoa => ({
    ma: c.ma,
    tieu_de: c.tieu_de,
    khoa: true,
    moi_xem: c.moi_xem ?? { diem_nhan: "", cau_hoi: "Chương này nói gì về chính bạn?", so_doan: c.doan.length, phut_doc: 1 },
  }));

  if (!khoa.length) {
    return { ...bc, chuong: [...bc.chuong], so_khoa: 0 };
  }

  const mo = new Set(bc.chuong.slice(0, n).map((c) => c.ma));
  const out: Record<string, unknown> = {};

  // 1. Chỉ chép sang `out` những khoá nằm trong Allowlist công khai
  for (const [k, v] of Object.entries(bc)) {
    if (KHOA_CONG_KHAI_SAO2.has(k)) {
      out[k] = v;
    }
  }

  // 2. Xử lý từng khoá thuộc nhóm cắt riêng theo tập chương đã mở `mo`
  out.chuong = [...bc.chuong.slice(0, n), ...khoa];
  out.so_khoa = khoa.length;

  if (Array.isArray(bc.cot_loi)) {
    out.cot_loi = (bc.cot_loi as { tu_chuong?: unknown }[]).filter((h) => typeof h.tu_chuong === "string" && mo.has(h.tu_chuong));
  }
  if ("thoi_gian_bieu" in bc && mo.has("cuoc_doi")) {
    out.thoi_gian_bieu = bc.thoi_gian_bieu;
  }
  if (Array.isArray(bc.luu_y_mang)) {
    out.luu_y_mang = (bc.luu_y_mang as Record<string, unknown>[]).map((r) =>
      typeof r.tu_chuong === "string" && mo.has(r.tu_chuong)
        ? r
        : { ma: r.ma, ten: r.ten, muc: r.muc, nhan_muc: r.nhan_muc, tu_chuong: r.tu_chuong, khoa: true },
    );
  }
  if (Array.isArray(bc.nguoi_quanh)) {
    out.nguoi_quanh = (bc.nguoi_quanh as Record<string, unknown>[]).map((r) =>
      typeof r.tu_chuong === "string" && mo.has(r.tu_chuong)
        ? r
        : { ma: r.ma, ten: r.ten, muc: r.muc, nhan_muc: r.nhan_muc, tu_chuong: r.tu_chuong, khoa: true },
    );
  }
  if (bc.ung_dung_co_dien && typeof bc.ung_dung_co_dien === "object") {
    const u = bc.ung_dung_co_dien as Record<string, unknown>;
    const canMo = u.ma === "battu_co_dien" ? "ngu_hanh" : u.ma === "tuvi_co_dien" ? "su_nghiep" : null;
    out.ung_dung_co_dien =
      canMo && !mo.has(canMo)
        ? { khoa: true, ma: u.ma, tieu_de: u.tieu_de, nguyen_tac_uu_tien: u.nguyen_tac_uu_tien }
        : u;
  }

  return out as Omit<T, "chuong"> & { chuong: (ChuongDay | ChuongKhoa)[]; so_khoa: number };
}

/** D1 (LH-3): câu trả lời mẫu duy nhất được mở miễn phí ở chương 1 ngay cả khi đang thu Sao. */
export const CAU_MAU_MIEN_PHI = { chuong: "su_nghiep", ma: "nghe_hop" } as const;
export const THU_TU_CHUONG_HOI: Record<"tuvi" | "battu", readonly string[]> = {
  tuvi: ["tong_quan", "cuoc_doi", "su_nghiep", "tien_bac", "tinh_cam", "gia_dinh", "suc_khoe", "quan_he", "nha_cua", "duong_bay", "nam_nay", "van_han", "loi_khuyen"],
  battu: ["tong_quan", "ngu_hanh", "cuoc_doi", "su_nghiep", "tien_bac", "tinh_cam", "gia_dinh", "hoc_tap", "suc_khoe", "quan_he", "nam_nay", "van_han", "loi_khuyen"],
};

export function tapChuongMoHoi(moDun: "tuvi" | "battu", soChuongMo = 1): Set<string> {
  const ds = THU_TU_CHUONG_HOI[moDun];
  const n = Math.max(0, Math.min(soChuongMo, ds.length));
  return new Set(ds.slice(0, n));
}

export interface QuyenDocHoi {
  daMoToanBo: boolean;
  chuongMo?: ReadonlySet<string>;
}

export function xetQuyenDocHoi(p: {
  coLaSo: boolean;
  mienPhiAnh: boolean;
  thuSaoBat: boolean;
  coPhien: boolean;
  chuSoHuu: boolean;
  hoiVien: boolean;
  coBiMat: boolean;
  daMoHomNay: boolean;
  moDun: "tuvi" | "battu";
  soChuongMo: number;
}): QuyenDocHoi {
  if (!p.coLaSo || p.mienPhiAnh || !p.thuSaoBat) return { daMoToanBo: true };
  if (!p.coPhien) return { daMoToanBo: false, chuongMo: tapChuongMoHoi(p.moDun, p.soChuongMo) };
  if (p.chuSoHuu || p.hoiVien) return { daMoToanBo: true };
  if (!p.coBiMat) return { daMoToanBo: false, chuongMo: tapChuongMoHoi(p.moDun, p.soChuongMo) };
  if (p.daMoHomNay) return { daMoToanBo: true };
  return { daMoToanBo: false, chuongMo: tapChuongMoHoi(p.moDun, p.soChuongMo) };
}

export function boTinhTrangKhoa(d: Record<string, unknown>): Record<string, unknown> {
  const ls = d.la_so;
  if (!ls || typeof ls !== "object" || !("tinh_trang" in ls)) return d;
  const { tinh_trang: _bo, ...con } = ls as Record<string, unknown>;
  return { ...d, la_so: con };
}

export function taoKhoaGiaoDichLuanGiai(biMatMay: string, moDun: string, duLieuDaBoTinhTrang: unknown, ngayVn: string): string {
  return `lg:${createHmac("sha256", biMatMay).update(`${moDun}|${JSON.stringify(duLieuDaBoTinhTrang)}|${ngayVn}`).digest("hex").slice(0, 40)}`;
}

export function catLuanHoiChat<T extends Record<string, unknown>>(
  body: T,
  quyen: boolean | QuyenDocHoi,
): T {
  const daMoToanBo = typeof quyen === "boolean" ? quyen : quyen.daMoToanBo;
  if (daMoToanBo || !body || typeof body !== "object") {
    return body;
  }
  const mo = typeof quyen === "boolean" ? new Set(["tong_quan"]) : (quyen.chuongMo ?? new Set(["tong_quan"]));
  let out: T = body;
  if (out.luan_hoi && typeof out.luan_hoi === "object") {
    const lh = out.luan_hoi as Record<string, unknown>;
    const ch = typeof lh.chuong === "string" ? lh.chuong : "";
    const laCauMau = ch === CAU_MAU_MIEN_PHI.chuong && lh.ma === CAU_MAU_MIEN_PHI.ma;
    if (!laCauMau && !mo.has(ch)) {
      out = {
        ...out,
        luan_hoi: {
          khoa: true,
          ma: lh.ma,
          cau: lh.cau,
          sac: lh.sac,
          chuong: lh.chuong,
          ten_chuong: lh.ten_chuong,
        },
      };
    }
  }
  if (out.doi_song_lien_ket && typeof out.doi_song_lien_ket === "object") {
    const lk = out.doi_song_lien_ket as Record<string, unknown>;
    const ch = typeof lk.chuong === "string" ? lk.chuong : "";
    if (!mo.has(ch)) {
      out = {
        ...out,
        doi_song_lien_ket: {
          khoa: true,
          chuong: lk.chuong,
          ten_chuong: lk.ten_chuong,
        },
      };
    }
  }
  return out;
}
