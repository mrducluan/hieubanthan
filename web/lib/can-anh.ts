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

// ---- TY-2 đợt 4 — "máy đọc bản vẽ": engine trả CHỖ gợi ý theo toạ độ 0..1 của ẢNH đã gửi (ảnh đã xoay như người dùng
// đang thấy). Các hàm dưới chỉ đổi toạ độ hiển thị ảnh → khung → khung sau khi căn; phương, Cửa – Chủ – Bếp vẫn do engine.

export interface ChoBanVe { ma: string; x: number; y: number; do_tin: number; ly_do: string }
export interface KhungBanVe { x0: number; y0: number; x1: number; y1: number }

/** Điểm (theo ảnh đã xoay, 0..1) → điểm trên khung lúc CHƯA căn: ảnh phủ vừa khung, giữ tỉ lệ, canh giữa. */
export function anhSangKhung(p: Diem, anhRong: number, anhCao: number, khungRong: number, khungSau: number): Diem {
  const ia = anhRong / anhCao, fa = khungRong / khungSau;
  if (!(ia > 0) || !(fa > 0)) return p;
  if (ia > fa) { const h = fa / ia; return [p[0], (1 - h) / 2 + p[1] * h]; }
  const w = ia / fa;
  return [(1 - w) / 2 + p[0] * w, p[1]];
}

/** Ảnh → khung sau khi căn. Ra ngoài khung quá `bien` → null (chỗ ấy không thuộc phần nhà đang vẽ). */
export function anhSangSoDo(p: Diem, anhRong: number, anhCao: number, khungRong: number, khungSau: number,
  can: CanAnh | null | undefined, bien = 0.03): Diem | null {
  const q = apDiem(can, anhSangKhung(p, anhRong, anhCao, khungRong, khungSau));
  if (q[0] < -bien || q[0] > 1 + bien || q[1] < -bien || q[1] > 1 + bien) return null;
  return [kep01(q[0]), kep01(q[1])];
}

/** Đường bao nhà máy thấy → phép căn ảnh theo khung (như người dùng tự chạm hai góc). */
export function canTuKhung(k: KhungBanVe, anhRong: number, anhCao: number, khungRong: number, khungSau: number): CanAnh | null {
  const a = anhSangKhung([k.x0, k.y0], anhRong, anhCao, khungRong, khungSau);
  const b = anhSangKhung([k.x1, k.y1], anhRong, anhCao, khungRong, khungSau);
  return tinhCan(a, b);
}

/** Xoay một điểm của ảnh theo chiều kim đồng hồ `goc` độ (bội 90) — khớp cách canvas xoay ảnh nền. */
export function xoayDiem(p: Diem, goc: number): Diem {
  let [x, y] = p;
  for (let i = 0; i < (((goc / 90) % 4) + 4) % 4; i++) [x, y] = [1 - y, x];
  return [x, y];
}

/** Cửa chính máy thấy không nằm ở mặt trước (sơ đồ để mặt trước ở TRÊN) → số độ nên xoay thêm (90 / 180 / 270) để cửa lên
 *  gần mép trên nhất; đã ở nửa trên → 0. */
export function gocNenXoay(cua: Diem | null | undefined): number {
  if (!cua || cua[1] <= 0.35) return 0;
  let tot = 0, yTot = cua[1];
  for (const g of [90, 180, 270]) {
    const y = xoayDiem(cua, g)[1];
    if (y < yTot - 1e-9) { tot = g; yTot = y; }
  }
  return yTot <= 0.35 ? tot : 0;
}

/** Xoay cả kết quả (chỗ + đường bao) khi người dùng xoay ảnh sau lúc đọc — khỏi gửi lại ảnh. */
export function xoayKetQua<T extends { cho: ChoBanVe[]; khung: KhungBanVe | null }>(kq: T, goc: number): T {
  const cho = kq.cho.map((c) => { const [x, y] = xoayDiem([c.x, c.y], goc); return { ...c, x, y }; });
  let khung: KhungBanVe | null = null;
  if (kq.khung) {
    const a = xoayDiem([kq.khung.x0, kq.khung.y0], goc), b = xoayDiem([kq.khung.x1, kq.khung.y1], goc);
    khung = { x0: Math.min(a[0], b[0]), y0: Math.min(a[1], b[1]), x1: Math.max(a[0], b[0]), y1: Math.max(a[1], b[1]) };
  }
  return { ...kq, cho, khung };
}
