// SAO-2 — cắt báo cáo "Luận giải toàn bộ" thành bản xem trước (thuần, không I/O — dùng ở máy chủ, có test).
// N chương đầu giữ trọn; chương sau CHỈ còn tiêu đề + lời mời xem tiếp (điểm nhấn đã tính + câu hỏi mở) do engine
// soạn — đoạn văn bị bỏ hẳn khỏi phản hồi (không lộ qua tab Network), không phải làm mờ bằng CSS.

export type MoiXem = { diem_nhan: string; cau_hoi: string; so_doan: number; phut_doc: number;
  /** LH-1: các CÂU HỎI chương trả lời (chỉ câu hỏi — không có câu trả lời) + số người có chân dung trong chương. */
  cau_tra_loi?: { ma: string; cau: string }[]; so_nguoi?: number };
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
    // LH-1: bản đồ "Người quanh bạn" — người thuộc chương khoá chỉ giữ tên + mức (chân dung, tác động bỏ hẳn).
    if (Array.isArray(bc.nguoi_quanh)) {
      o.nguoi_quanh = (bc.nguoi_quanh as Record<string, unknown>[]).map((r) =>
        typeof r.tu_chuong === "string" && mo.has(r.tu_chuong) ? r
          : { ma: r.ma, ten: r.ten, muc: r.muc, nhan_muc: r.nhan_muc, tu_chuong: r.tu_chuong, khoa: true });
    }
  }
  return out;
}

import { createHmac } from "node:crypto";

/** D1 (LH-3): câu trả lời mẫu duy nhất được mở miễn phí ở chương 1 ngay cả khi đang thu Sao. */
export const CAU_MAU_MIEN_PHI = { chuong: "su_nghiep", ma: "nghe_hop" } as const;
/** Thứ tự chương cố định của Tử vi & Bát tự để suy tập chương mở theo `luan_giai.chuong_mien_phi + chuongDuocTang`. */
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

/** Luật quyết định quyền đọc `luan_hoi` / `doi_song_lien_ket` trong hỏi đáp (thuần, test được mọi nhánh). */
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

/** Bỏ `tinh_trang` khỏi `la_so` để khoá giao dịch "đã mở hôm nay" giữa `/luan-giai` và `/hoi` khớp từng byte. */
export function boTinhTrangKhoa(d: Record<string, unknown>): Record<string, unknown> {
  const ls = d.la_so;
  if (!ls || typeof ls !== "object" || !("tinh_trang" in ls)) return d;
  const { tinh_trang: _bo, ...con } = ls as Record<string, unknown>;
  return { ...d, la_so: con };
}

export function taoKhoaGiaoDichLuanGiai(biMatMay: string, moDun: string, duLieuDaBoTinhTrang: unknown, ngayVn: string): string {
  return `lg:${createHmac("sha256", biMatMay).update(`${moDun}|${JSON.stringify(duLieuDaBoTinhTrang)}|${ngayVn}`).digest("hex").slice(0, 40)}`;
}

/** D2 + SAO-2: khi báo cáo của mảng đang khoá với người xem, cả `luan_hoi` (trừ câu mẫu miễn phí D1 hoặc chương nằm trong `chuongMo`)
 *  lẫn `doi_song_lien_ket` (trừ chương nằm trong `chuongMo`) đều bị cắt sạch `tra_loi`, `giai_thich`, `nhan`, `ma_mau`, `tieu_de_hop`
 *  ở máy chủ — không lộ qua tab Network và không hiện nút KiemChung cho nội dung người dùng chưa mở. */
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

