"use client";
// KC-5 — tín hiệu ngầm thay bình chọn: đếm trên máy người dùng mở cách đọc nào ("Ba cách đọc cùng một quẻ": Nghĩa Lý /
// Mai Hoa / Lục Hào). Đủ 5 lần cho một phái và nhiều hơn các phái khác → mặc định chế độ đọc theo phái đó (người dùng
// vẫn đổi được; đã tự chọn tay thì không ghi đè). Không gửi chữ, chỉ gửi mã lên PostHog ở nơi gọi.
const KHOA = "hbt.thoi_quen_kd.v1";
const KHOA_TAY = "hbt.thoi_quen_kd.tay";
export const NGUONG = 5;
type Dem = Record<string, number>;

function doc(): Dem {
  try { const j = JSON.parse(localStorage.getItem(KHOA) ?? "{}"); return j && typeof j === "object" ? j : {}; } catch { return {}; }
}
export function ghiMoPhai(phai: string): Dem {
  const d = doc();
  d[phai] = (d[phai] ?? 0) + 1;
  try { localStorage.setItem(KHOA, JSON.stringify(d)); } catch { /* bỏ qua */ }
  return d;
}
/** Phái người dùng hay mở nhất, nếu đã ≥ NGUONG lần và hơn mọi phái khác. */
export function phaiUuThich(): string | null {
  const d = doc();
  const xep = Object.entries(d).sort((a, b) => b[1] - a[1]);
  const [nhat, nhi] = [xep[0], xep[1]];
  if (!nhat || nhat[1] < NGUONG) return null;
  if (nhi && nhi[1] >= nhat[1]) return null;
  return nhat[0];
}
/** Người dùng đã tự chọn chế độ bằng tay → không tự đổi nữa. */
export function daChonTay(): boolean { try { return localStorage.getItem(KHOA_TAY) === "1"; } catch { return false; } }
export function danhDauChonTay(): void { try { localStorage.setItem(KHOA_TAY, "1"); } catch { /* bỏ qua */ } }
/** Phái đọc → chế độ hỏi Kinh Dịch tương ứng. */
export const CHE_DO_THEO_PHAI: Record<string, string> = { nghia_ly: "nghia_ly", luc_hao: "day_du" };
