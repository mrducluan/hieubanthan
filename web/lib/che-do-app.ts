// Trang đang mở ở chế độ app đã cài (Thêm vào màn hình chính / Cài ứng dụng)? Dùng cho đo lường + ẩn lời mời cài.
export const dangChayApp = (): boolean =>
  typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone === true);
