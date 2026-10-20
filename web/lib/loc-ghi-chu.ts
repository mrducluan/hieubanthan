// TS-V3 tầng HỌC — lọc ghi chú góp ý trước khi lưu: bỏ email (kể cả có dấu cách), đường link, mạng xã hội / Zalo,
// chuỗi số dài kể cả có dấu cách, chấm, gạch, ngoặc (điện thoại, CCCD), ngày tháng năm (dạng số hoặc chữ), năm 19xx/20xx.
// Tên người không lọc tự động được — giao diện dặn không ghi tên. SQL (gui_phan_hoi_thanso) còn chặn thêm một lớp.
const AN = "[đã ẩn]";

export function locGhiChu(s: string | undefined | null): string | null {
  if (!s) return null;
  const t = s
    .normalize("NFC")
    .replace(/\S+\s*@\s*\S+(\s*\.\s*[a-z]{2,})*/gi, AN)
    .replace(/(https?:\/\/|www\.)\S+/gi, AN)
    .replace(/\b[\w-]+\s*\.\s*(com|vn|net|org|me|io)\b(\/\S*)?/gi, AN)
    .replace(/\b(zalo|fb|facebook|face|t\.me|telegram|tele|ig|insta|instagram|tiktok|tik tok|skype|viber)\b\s*[:：]?\s*\S+/gi, AN)
    .replace(/\b(ngày|ngay)\s*\d{1,2}\s*(tháng|thang)\s*\d{1,2}(\s*(năm|nam)\s*\d{2,4})?/gi, AN)
    .replace(/\b(tháng|thang)\s*\d{1,2}\s*(năm|nam)\s*\d{2,4}/gi, AN)
    .replace(/\b\d{1,2}\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{2,4}\b/g, AN)
    .replace(/\+?\(?\d[\d\s.\-_/()]{5,}\d/g, (m) => (m.replace(/\D/g, "").length >= 6 ? AN : m))
    .replace(/\b(19|20)\d{2}\b/g, AN)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
  return t || null;
}
