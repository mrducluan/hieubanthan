// CHANG-3 — lời báo lỗi theo ngôn ngữ trang. Máy chủ / engine thường trả lời báo đúng ngôn ngữ, nhưng một số lỗi (kiểm
// đầu vào của engine, lỗi mạng trung gian) vẫn có thể là chữ Việt. Bản Anh không bao giờ hiện chữ Việt: lời có dấu tiếng
// Việt (hoặc trống) → dùng lời dự phòng tiếng Anh của component.

/** Có chữ cái mang dấu tiếng Việt (ă â đ ê ô ơ ư và các thanh). */
export function coChuViet(s: string): boolean {
  return /[ăâđêôơưàáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i.test(s);
}

/** Lời lỗi hiển thị: `loi` của máy chủ khi hợp ngôn ngữ, không thì `duPhong`. */
export function loiTheoNgonNgu(loi: unknown, en: boolean, duPhong: string): string {
  if (typeof loi !== "string" || !loi.trim()) return duPhong;
  if (en && coChuViet(loi)) return duPhong;
  return loi;
}
