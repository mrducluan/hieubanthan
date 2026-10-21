// TCS-1 — hằng dùng chung cho thẻ / ảnh chia sẻ (máy chủ + trình duyệt). Không tính gì: chỉ nhãn hiển thị cho mã
// engine trả (cùng chữ với KB engine `tuvi_hai_nguoi_kb.json`) + cách chọn URL cho mã QR in trên ảnh.
import { dungLuongByte } from "@/lib/qr";

/** Mọi ảnh chia sẻ / tải về đều in tên miền này + mã QR trỏ về đây (kể cả khi xem trên bản thử nghiệm). */
export const TEN_MIEN = "hieuban.com";
export const GOC_QR = `https://${TEN_MIEN}`;

/** Phiên bản QR tối đa cho URL thẻ (v8 = 49 ô/cạnh, ≤ 152 byte) — dài hơn thì dùng URL dự phòng ngắn để mã thưa,
 *  quét được cả khi ảnh bị nén (Zalo, Messenger, story). */
export const QR_PHIEN_BAN_THE = 8;

/** URL thẻ nếu vừa mã QR thưa, không thì URL dự phòng (trang hành động kế tiếp của người nhận + ?tu=). */
export function urlQr(urlThe: string, duPhong: string, phienBanToiDa = QR_PHIEN_BAN_THE): string {
  return new TextEncoder().encode(urlThe).length <= dungLuongByte(phienBanToiDa) ? urlThe : duPhong;
}

/** Mã ?tu= hợp lệ (tiền tố 2 chữ + 10 hex) — cùng mẫu với GhiVaoTrang. */
export const MAU_TU = /^[a-z]{2}\.[a-f0-9]{10}$/;

export const TEN_QUAN_HE_HAI: Record<string, string> = {
  nguoi_yeu: "Người yêu", vo_chong: "Vợ chồng", ban_be: "Bạn bè", dong_nghiep: "Đồng nghiệp",
  doi_tac: "Đối tác", sep: "Sếp", cha_me_con: "Cha mẹ – con", gia_dinh: "Gia đình",
};
export const NHAN_MUC_HAI: Record<string, string> = {
  de_hoa_hop: "Dễ hoà hợp", hop_neu_hieu: "Hợp nếu hiểu nhau",
  can_dung_hoa_nhieu: "Cần dung hoà nhiều", nhieu_khac_biet: "Nhiều khác biệt — cần nói rõ",
};
/** Tên ngắn tiêu chí trên thẻ (tên đầy đủ ở khối "Xem lá số 2 người"). */
export const TEN_TIEU_CHI_HAI: Record<string, string> = {
  menh: "Bản mệnh", can: "Cách nghĩ", chi: "Con giáp", cung_phi: "Chỗ ở chung", tu_vi: "Lá số Tử vi",
};
/** Màu dịu theo mức (không đỏ) — khớp DiemHaiNguoi.tsx. */
export const MAU_MUC_HAI: Record<string, string> = {
  de_hoa_hop: "#6fd3b5", hop_neu_hieu: "#e9c46a", can_dung_hoa_nhieu: "#f5aa50", nhieu_khac_biet: "#e0965a",
};
export const tenHai = (a: string, b: string) => [a.trim() || "Bạn", b.trim() || "Người ấy"] as const;
