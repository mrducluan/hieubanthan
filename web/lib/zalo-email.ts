// DN-2 — email đại diện của tài khoản đăng nhập bằng Zalo (dùng được ở trình duyệt; phần OAuth ở lib/zalo.ts, chỉ máy chủ).
/** Email đại diện = "zalo-<mã>@hieuban.com" (tên miền chính, có bản ghi MX nên Supabase nhận là email hợp lệ). Không có hộp
 *  thư thật cho các địa chỉ này; hệ thống không gửi thư tới chúng (đăng nhập bằng liên kết một lần do máy chủ tự xác nhận). */
export const MIEN_EMAIL_ZALO = "hieuban.com";
const TIEN_TO = "zalo-";

/** Mã người dùng Zalo (theo từng app) → email đại diện cố định của tài khoản Supabase. */
export function emailZalo(id: string): string | null {
  return /^\d{1,30}$/.test(id) ? `${TIEN_TO}${id}@${MIEN_EMAIL_ZALO}` : null;
}
export const laEmailZalo = (email: string | null | undefined) =>
  !!email && new RegExp(`^${TIEN_TO}\\d{1,30}@${MIEN_EMAIL_ZALO.replace(".", "\\.")}$`, "i").test(email.trim());
