// Cách đăng nhập đang mở (DN-1). Một env công khai, không cần sửa code khi bật / tắt:
//   NEXT_PUBLIC_DANG_NHAP = "google,facebook,apple"   (thêm "sdt" để mở lại đăng nhập bằng số điện thoại)
// Chưa đặt → chỉ Google (+ email luôn có). Nút chỉ nên bật SAU khi nhà cung cấp đã bật ở Supabase → Authentication →
// Providers, không thì người dùng bấm vào sẽ gặp lỗi. Số điện thoại tắt mặc định: mỗi SMS tốn phí (docs/DANG-NHAP.md).
export type NhaCungCap = "google" | "facebook" | "apple";
export type CachDangNhap = { oauth: NhaCungCap[]; sdt: boolean };

const THU_TU: NhaCungCap[] = ["google", "apple", "facebook"];

export function docCachDangNhap(gt: string | undefined): CachDangNhap {
  const ds = new Set((gt ?? "google").toLowerCase().split(/[\s,]+/).filter(Boolean));
  return { oauth: THU_TU.filter((p) => ds.has(p)), sdt: ds.has("sdt") };
}

export const cachDangNhap = (): CachDangNhap => docCachDangNhap(process.env.NEXT_PUBLIC_DANG_NHAP);
