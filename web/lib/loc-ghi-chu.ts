// TS-V3 tầng HỌC — lọc ghi chú góp ý trước khi lưu: bỏ email, đường link, chuỗi số dài (điện thoại, CCCD, ngày sinh
// viết liền) và ngày tháng năm dạng 24/10/1988. Máy chủ SQL còn chặn thêm một lớp (gui_phan_hoi_thanso).
export function locGhiChu(s: string | undefined | null): string | null {
  if (!s) return null;
  const t = s
    .normalize("NFC")
    .replace(/\S+@\S+/g, "[đã ẩn]")
    .replace(/(https?:\/\/|www\.)\S+/gi, "[đã ẩn]")
    .replace(/\b\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}\b/g, "[đã ẩn]")
    .replace(/\d[\d .-]{4,}\d/g, "[đã ẩn]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 300);
  return t || null;
}
