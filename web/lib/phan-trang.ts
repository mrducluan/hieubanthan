// SEO-K (chủ dự án duyệt 2026-10-21) — phân trang blog: /blog = trang 1, /blog/trang/{n} (n ≥ 2) có canonical tự trỏ
// chính nó, không noindex (Google khuyên phân trang tự chuẩn hoá). Tương tự /blog/chuyen-muc/{slug}/trang/{n}.
export const BAI_MOI_TRANG = 24;

export const soTrang = (tong: number) => Math.max(1, Math.ceil(tong / BAI_MOI_TRANG));
export const catTrang = <T,>(ds: T[], n: number) => ds.slice((n - 1) * BAI_MOI_TRANG, n * BAI_MOI_TRANG);
export const duongTrangSo = (goc: string, n: number) => (n <= 1 ? goc : `${goc}/trang/${n}`);

/** "2" → 2; trang 1 viết dạng /trang/1, số 0, chữ, số có 0 đầu → null (route trả 404 hoặc chuyển về gốc). */
export function docSoTrang(s: string): number | null {
  return /^[1-9]\d{0,3}$/.test(s) ? Number(s) : null;
}
