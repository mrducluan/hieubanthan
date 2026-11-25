// TY-2 gói 3 — "Căn ảnh theo khung": người dùng chạm góc trước – trái rồi góc sau – phải của nhà TRÊN ẢNH bản vẽ; web dựng
// một phép biến đổi HIỂN THỊ (chỉ phóng / dời ảnh nền) để hai góc ấy trùng hai góc của khung nhà theo tỉ lệ. Toạ độ 0..1 theo
// khung đang hiện (đã xoay). Chỉ là cách vẽ ảnh của chính người dùng — không phải phép tính phong thuỷ, không lưu, không gửi đi.
// Không import `@/` — nạp được trong Node test.

export type Diem = [number, number];
/** Ảnh đặt sao cho điểm (x1, y1) của ảnh về (0, 0) của khung, phóng sx, sy. */
export type CanAnh = { x1: number; y1: number; sx: number; sy: number };

/** Khoảng cách tối thiểu giữa hai góc (theo mỗi chiều, phần của khung) — chạm sát nhau thì phóng quá lớn, dễ sai. */
export const KHOANG_TOI_THIEU = 0.05;

export const kep01 = (n: number) => Math.min(1, Math.max(0, n));

/** Hai góc → phép căn; góc thứ hai không nằm dưới – phải góc đầu ít nhất `toiThieu` theo cả hai chiều → null. */
export function tinhCan(p1: Diem, p2: Diem, toiThieu = KHOANG_TOI_THIEU): CanAnh | null {
  const [x1, y1] = p1, [x2, y2] = p2;
  if (![x1, y1, x2, y2].every((n) => Number.isFinite(n) && n >= 0 && n <= 1)) return null;
  if (x2 - x1 < toiThieu || y2 - y1 < toiThieu) return null;
  return { x1, y1, sx: 1 / (x2 - x1), sy: 1 / (y2 - y1) };
}

/** Điểm của ảnh (theo khung lúc chưa căn) → vị trí trên khung sau khi căn. */
export function apDiem(c: CanAnh | null | undefined, p: Diem): Diem {
  if (!c) return p;
  return [(p[0] - c.x1) * c.sx, (p[1] - c.y1) * c.sy];
}

/** CSS transform cho phần tử ảnh phủ kín khung (transform-origin 0 0). Không căn → undefined (giữ nguyên). */
export function cssCan(c: CanAnh | null | undefined): string | undefined {
  if (!c) return undefined;
  const r = (n: number) => Math.round(n * 10000) / 10000;
  return `scale(${r(c.sx)}, ${r(c.sy)}) translate(${r(-c.x1 * 100)}%, ${r(-c.y1 * 100)}%)`;
}
