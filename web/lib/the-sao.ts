// CHANG-4 / thẻ chia sẻ Chiêm tinh (khâu MỜI) — hằng dùng chung cho trình duyệt + máy chủ (không node:crypto):
// thứ tự 12 cung hoàng đạo (trùng engine `calc/chiem_tinh_lich.CUNG_HOANG_DAO`, máy chủ đối chiếu mã engine trả) và tên thẻ.
// Thẻ "Bản đồ sao của tôi" (miền mã `sao|`) chỉ mang tên hiển thị + cung Mặt Trời / Mặt Trăng / Mọc; thẻ "Hợp đôi chiêm
// tinh" (miền `sao2|`) chỉ mang tên người gửi, cung Mặt Trời hai người và ≤ 3 chủ đề tương tác — KHÔNG ngày giờ, nơi sinh,
// không tên người kia, không điểm số (docs/THE-CHIA-SE.md).
export const CUNG_12 = [
  "bach_duong", "kim_nguu", "song_tu", "cu_giai", "su_tu", "xu_nu",
  "thien_binh", "bo_cap", "nhan_ma", "ma_ket", "bao_binh", "song_ngu",
] as const;
export type MaCung = (typeof CUNG_12)[number];

export const tenTheSao = (t: string) => (t.trim() ? `Bản đồ sao của ${t.trim()}` : "Bản đồ sao của tôi");
export const tenTheSao2 = (a: string) => (a.trim() ? `${a.trim()} & người ấy` : "Bạn & người ấy");

/** Ba câu mời ở trang nhận thẻ bản đồ sao (mã biến thể `b` 0–2 trong mã ký, đo `bien_the`). */
export const MOI_SAO = [
  "Mặt Trời, Mặt Trăng, cung Mọc của bạn là gì?",
  "Đoán xem bạn giống người gửi ở cung nào?",
  "Bản đồ sao của bạn có mấy điểm trùng?",
] as const;
