// KC-0 (docs/PHAN-TICH-MIGRATION-V2-2.md, GĐ0) — vòng "kiểm chứng" thay RLHF: người dùng bấm 1 chạm "Đúng với mình /
// Chưa đúng" trên thẻ Tử vi; chỉ MÃ đi lên PostHog (sự kiện `tuvi_kiem_chung`), không chữ, không lá số, không ngày giờ.
// Mã dựng từ dữ kiện ĐÃ TÍNH của engine (loại + cung nguồn + hoá + cung đích; mức + mã lý do) — tất định, cùng lá số
// ra cùng mã, không phụ thuộc câu chữ KB. Số đếm chỉ để người biên tập XEM LẠI KB, không tự đổi luận giải.
// Dùng chung trình duyệt (thẻ) + máy chủ (/quan-tri/tang-truong) — không import gì phía máy chủ ở đây.

export type LoaiKiemChung = "phi_hoa" | "nhip_3_thang";
export type KetQuaKiemChung = "dung" | "chua_dung";

/** Chuỗi ASCII thường, gạch dưới: "Quan Lộc" → "quan_loc", "Điền Trạch" → "dien_trach". */
export function maChu(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[đĐ]/g, "d").toLowerCase()
    .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

/** Mã mẫu một đường bay nổi bật: `{loai}.{cung nguồn}.{hoá}.{cung đích | tu}` (vd `mau.quan_loc.ky.menh`).
 *  ≤ 40 ký tự với mọi tên cung (dài nhất: `loc_nhap.dien_trach.quyen.dien_trach` = 36). */
export function maPhiHoa(n: { loai: string; duong: { tu_cung: string; hoa: string; den_cung: string | null; tu_hoa: boolean } }): string {
  const den = n.duong.tu_hoa ? "tu" : maChu(n.duong.den_cung ?? "khong");
  return [maChu(n.loai), maChu(n.duong.tu_cung), maChu(n.duong.hoa), den].join(".");
}

/** Mã lý do nhịp — viết tắt cố định để mã đủ ngắn (giới hạn 40 ký tự của lib/do-luong). */
export const LY_DO_NGAN: Record<string, string> = {
  chong_ky: "ck", ky_xung_cung_chinh: "kx", khoa_giai: "kg", loc_nhap_cung_chinh: "ln", song_loc: "sl",
};
export const TEN_LY_DO: Record<string, string> = {
  ck: "chồng Kỵ", kx: "Kỵ xung cung chính", kg: "Khoa giải", ln: "Lộc nhập cung chính", sl: "song Lộc",
};
const TEN_MUC: Record<string, string> = { thuan: "Thuận", binh: "Bình", can_than: "Cần thận trọng" };

/** Mã một tháng nhịp: `{mức}.{lý do viết tắt, xếp theo chữ cái, nối +}` hoặc `{mức}.-` khi không có lý do. */
export function maNhip(t: { muc: string; ly_do: { ma: string }[] }): string {
  const ly = [...new Set(t.ly_do.map((l) => LY_DO_NGAN[l.ma] ?? "x"))].sort();
  return `${maChu(t.muc)}.${ly.length ? ly.join("+") : "-"}`;
}

/** Nhãn đọc được cho người biên tập ở /quan-tri (giải mã ngược, không cần engine). */
export function nhanMau(loai: string, mau: string): string {
  const p = mau.split(".");
  if (loai === "nhip_3_thang") {
    const ly = p[1] && p[1] !== "-" ? p[1].split("+").map((x) => TEN_LY_DO[x] ?? x).join(", ") : "không có lý do riêng";
    return `${TEN_MUC[p[0] ?? ""] ?? p[0]} · ${ly}`;
  }
  const [loaiNb, tu, hoa, den] = p;
  const nguon = loaiNb === "mau" ? "mẫu KB" : loaiNb === "ky_xung" ? "Kỵ xung" : loaiNb === "loc_nhap" ? "Lộc nhập" : loaiNb === "tu_hoa" ? "tự hoá" : loaiNb;
  return `${nguon}: ${tu} → hoá ${hoa} → ${den === "tu" ? "tự hoá" : den}`;
}

/** Ngưỡng đủ mẫu (đúng + chưa đúng) để hiện tỉ lệ một mã. */
export const MAU_KIEM_CHUNG = 30;

export interface DongKiemChung { loai: string; mau: string; dung: number; chua_dung: number }
export interface KetQuaBangKiemChung { du: (DongKiemChung & { tong: number; ti_le_dung: number; nhan: string })[]; chuaDu: number; tongPhieu: number }

/** Lọc + xếp: chỉ mã đủ mẫu mới có tỉ lệ; xếp tỉ lệ "đúng" thấp lên đầu (KB cần xem lại trước). */
export function tinhKiemChung(ds: DongKiemChung[], nguong = MAU_KIEM_CHUNG): KetQuaBangKiemChung {
  const du = ds.map((d) => ({ ...d, tong: d.dung + d.chua_dung }))
    .filter((d) => d.tong >= nguong)
    .map((d) => ({ ...d, ti_le_dung: d.dung / d.tong, nhan: nhanMau(d.loai, d.mau) }))
    .sort((a, b) => a.ti_le_dung - b.ti_le_dung || b.tong - a.tong);
  return { du, chuaDu: ds.filter((d) => d.dung + d.chua_dung < nguong).length, tongPhieu: ds.reduce((s, d) => s + d.dung + d.chua_dung, 0) };
}
