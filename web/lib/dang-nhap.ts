// Cách đăng nhập đang mở (DN-1). Một env công khai, không cần sửa code khi bật / tắt:
//   NEXT_PUBLIC_DANG_NHAP = "google,zalo,facebook,apple"   (thêm "sdt" để mở lại đăng nhập bằng số điện thoại,
//   thêm "email" để mở lại nhận mã qua email — DN-4, chủ dự án tắt 18/11/2026)
// Zalo (DN-2) không phải nhà cung cấp có sẵn của Supabase: nút trỏ tới /auth/zalo (máy chủ web tự làm OAuth, lib/zalo.ts),
// cần thêm env máy chủ ZALO_APP_ID + ZALO_APP_SECRET.
// Chưa đặt (máy dev, CI) → Google + email. Đã đặt → email chỉ hiện khi có "email". Nút chỉ nên bật SAU khi nhà cung cấp đã bật ở Supabase → Authentication →
// Providers, không thì người dùng bấm vào sẽ gặp lỗi. Số điện thoại tắt mặc định: mỗi SMS tốn phí (docs/DANG-NHAP.md).
export type NhaCungCap = "google" | "zalo" | "facebook" | "apple";
export type CachDangNhap = { oauth: NhaCungCap[]; sdt: boolean; email: boolean };

const THU_TU: NhaCungCap[] = ["google", "zalo", "apple", "facebook"];

export function docCachDangNhap(gt: string | undefined): CachDangNhap {
  const ds = new Set((gt ?? "google,email").toLowerCase().split(/[\s,]+/).filter(Boolean));
  return { oauth: THU_TU.filter((p) => ds.has(p)), sdt: ds.has("sdt"), email: ds.has("email") };
}

export const cachDangNhap = (): CachDangNhap => docCachDangNhap(process.env.NEXT_PUBLIC_DANG_NHAP);
