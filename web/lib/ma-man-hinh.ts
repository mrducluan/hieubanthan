// Mã ?tu= CỐ ĐỊNH cho mã QR ở dải chân lá số / biểu đồ HIỆN TRÊN MÀN HÌNH (ChanLaSo, ChanQr). Chụp màn hình không phát
// sinh sự kiện nào để ghép với một mã ngẫu nhiên, và mã ngẫu nhiên mỗi lần vẽ còn làm QR lệch giữa máy chủ ↔ trình duyệt
// (hydration) → mỗi MẢNG một mã: người quét mở link → share_clicked{kind: "ms"}, tạo hồ sơ → referral_signup{ma_moi}
// (GhiVaoTrang đọc đúng dạng `xx.<10 hex>`). Bảng quản trị gom mã "ms." vào dòng "Chụp màn hình" (lib/pheu-the.ts).
// Chỉ là nhãn mảng — không có dữ liệu cá nhân. Ảnh bấm "Tải ảnh" vẫn dùng mã ngẫu nhiên riêng (lib/chan-anh.ts).
export const TIEN_TO_MAN_HINH = "ms.";

const THEO_MANG: Array<[RegExp, string]> = [
  [/^\/tu-vi\/la-so-mau(\/|$)/, "ms.0000000a05"],
  [/^\/tu-vi(\/|$)/, "ms.0000000a01"],
  [/^\/bat-tu(\/|$)/, "ms.0000000a02"],
  [/^\/kinh-dich(\/|$)/, "ms.0000000a03"],
  [/^\/phong-thuy(\/|$)/, "ms.0000000a04"],
];

/** Mã ?tu= theo đường dẫn trang (đoạn đầu = mảng); trang khác → mã chung. */
export function maManHinh(duong: string): string {
  return THEO_MANG.find(([re]) => re.test(duong))?.[1] ?? "ms.0000000a00";
}

/** Link đầy đủ trong mã QR: trang + ?tu=<mã màn hình>. */
export function linkQrManHinh(goc: string, duong: string): string {
  return `${goc}${duong}?tu=${maManHinh(duong)}`;
}
