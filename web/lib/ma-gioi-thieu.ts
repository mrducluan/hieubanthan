// Mã giới thiệu (?gt=) — chỉ localStorage, KHÔNG import Supabase: GhiGioiThieu nằm trong layout (mọi trang),
// kéo lib/sao.ts vào sẽ tải thêm ~70 KB thư viện tài khoản cho cả người không đăng nhập (PERF-1).
const KHOA_GT = "hbt.gt";
const HAN_GT_NGAY = 30;

/** Ghi mã giới thiệu từ URL (?gt=abcd1234) — giữ 30 ngày trên máy, tới khi người dùng tạo tài khoản. */
export function ghiMaGioiThieuTuUrl(search: string): void {
  const ma = new URLSearchParams(search).get("gt");
  if (!ma || !/^[a-z0-9]{8}$/.test(ma)) return;
  try { localStorage.setItem(KHOA_GT, JSON.stringify({ ma, luc: Date.now() })); } catch { /* bỏ qua */ }
}

export function maGioiThieuDaNho(): string | null {
  try {
    const v = JSON.parse(localStorage.getItem(KHOA_GT) ?? "null") as { ma: string; luc: number } | null;
    if (!v || Date.now() - v.luc > HAN_GT_NGAY * 86_400_000) return null;
    return v.ma;
  } catch { return null; }
}

export function quenMaGioiThieu(): void {
  try { localStorage.removeItem(KHOA_GT); } catch { /* bỏ qua */ }
}
