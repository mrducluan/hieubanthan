// ANH-3 — đổi kết quả bộ tìm điểm mốc gương mặt (lưới 478 điểm, chạy trên máy người dùng) thành các điểm mốc của phép đo
// hieuban (`do_anh.diem` trong KB). Đây là bước NHẬN DIỆN VỊ TRÍ trên ảnh, không tính gì về tướng: mọi tỉ lệ, ngưỡng, gợi ý
// vẫn do engine `/v1/nhan-tuong/do-mat` làm (một bộ tính). Hàm thuần — không DOM, không thư viện — để kiểm được bằng số.
//
// "trai / phai" = bên trái / phải CỦA ẢNH (như KB). Lưới không có chân tóc và tai: chân tóc dò bằng màu (từ đỉnh trán của
// lưới đi lên theo trục mặt, tìm chỗ hết da) — dò không ra thì để người dùng tự chấm; tai luôn để người dùng (không bắt buộc).

export type Diem = { x: number; y: number };
export type Anh = { data: Uint8ClampedArray; width: number; height: number };

// Chỉ số trên lưới 478 điểm (Face Mesh). Viền mặt hai bên, từ đỉnh trán xuống cằm.
const VIEN_A = [10, 109, 67, 103, 54, 21, 162, 127, 234, 93, 132, 58, 172, 136, 150, 149, 176, 148, 152];
const VIEN_B = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152];
/** Điểm lấy thẳng (hoặc trung bình) từ lưới; cặp [bên A, bên B] — gán trái / phải theo vị trí trên ảnh. */
const CAP: Record<string, [number[], number[]]> = {
  ma: [[234], [454]], ham: [[172], [397]], may: [[55, 107], [285, 336]],
  mat_ngoai: [[33], [263]], mat_trong: [[133], [362]], canh_mui: [[64, 48], [294, 278]], mep: [[61], [291]],
};
const DUOI_MAY: [number[], number[]] = [[46, 70], [276, 300]];

type P = [number, number];
const tb = (ps: P[]): P => [ps.reduce((s, p) => s + p[0], 0) / ps.length, ps.reduce((s, p) => s + p[1], 0) / ps.length];

/** x của đường viền tại độ cao y (nội suy tuyến tính); null khi đường không cắt y. */
function xTai(vien: P[], y: number): number | null {
  for (let i = 0; i + 1 < vien.length; i++) {
    const [a, b] = [vien[i]!, vien[i + 1]!];
    if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) return a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]);
  }
  return null;
}

/**
 * Lưới điểm (toạ độ 0..1 của ảnh) → điểm mốc hieuban (toạ độ 0..1). `w`, `h` = kích thước ảnh (để đổi về cùng đơn vị khi
 * xoay theo đường hai đuôi mắt). Không có chân tóc — gọi `timChanToc` riêng. Lưới thiếu điểm → null.
 */
export function tuLuoi(luoi: { x: number; y: number }[], w: number, h: number): Record<string, Diem> | null {
  if (luoi.length < 468 || !(w > 0 && h > 0)) return null;
  const px = (i: number): P => [luoi[i]!.x * w, luoi[i]!.y * h];
  // xoay về khung mặt thẳng (đường hai đuôi mắt nằm ngang) để "ngang đuôi lông mày" đúng nghĩa khi đầu hơi nghiêng
  const [m1, m2] = [px(33), px(263)];
  const goc = Math.atan2(m2[1] - m1[1], m2[0] - m1[0]);
  const lat = goc > Math.PI / 2 || goc < -Math.PI / 2 ? goc - Math.PI * Math.sign(goc) : goc;
  const c = Math.cos(-lat), s = Math.sin(-lat), tam = tb([m1, m2]);
  const vao = (p: P): P => [tam[0] + (p[0] - tam[0]) * c - (p[1] - tam[1]) * s, tam[1] + (p[0] - tam[0]) * s + (p[1] - tam[1]) * c];
  const ra = (p: P): P => [tam[0] + (p[0] - tam[0]) * c + (p[1] - tam[1]) * s, tam[1] - (p[0] - tam[0]) * s + (p[1] - tam[1]) * c];
  const q = (i: number) => vao(px(i));
  const nhom = (ids: number[]) => tb(ids.map(q));

  const kq: Record<string, P> = {};
  const dat = (ten: string, a: P, b: P) => { const [t, p] = a[0] <= b[0] ? [a, b] : [b, a]; kq[`${ten}_trai`] = t; kq[`${ten}_phai`] = p; };
  for (const [ten, [a, b]] of Object.entries(CAP)) dat(ten, nhom(a), nhom(b));
  // mép trán ngang đuôi lông mày = chỗ viền mặt cắt độ cao đuôi mày
  const vA = VIEN_A.map(q), vB = VIEN_B.map(q);
  const yA = nhom(DUOI_MAY[0])[1], yB = nhom(DUOI_MAY[1])[1];
  const xA = xTai(vA, yA), xB = xTai(vB, yB);
  if (xA == null || xB == null) return null;
  dat("thai", [xA, yA], [xB, yB]);
  kq.cam = q(152);
  kq.chan_mui = q(2);
  kq.giua_moi = nhom([13, 14]);

  const out: Record<string, Diem> = {};
  for (const [k, p] of Object.entries(kq)) {
    const [x, y] = ra(p);
    out[k] = { x: Math.min(1, Math.max(0, x / w)), y: Math.min(1, Math.max(0, y / h)) };
  }
  return out;
}

function ycc(r: number, g: number, b: number): P & [number, number, number] {
  return [0.299 * r + 0.587 * g + 0.114 * b, 128 - 0.168736 * r - 0.331264 * g + 0.5 * b, 128 + 0.5 * r - 0.418688 * g - 0.081312 * b] as P & [number, number, number];
}
function mau(a: Anh, x: number, y: number): [number, number, number] | null {
  const xi = Math.round(x), yi = Math.round(y);
  if (xi < 0 || yi < 0 || xi >= a.width || yi >= a.height) return null;
  const o = (yi * a.width + xi) * 4;
  return ycc(a.data[o]!, a.data[o + 1]!, a.data[o + 2]!);
}
const trungVi = (v: number[]) => { const s = [...v].sort((p, q) => p - q); return s[Math.floor(s.length / 2)] ?? 0; };

/**
 * Dò chân tóc giữa trán: lấy màu da ở trán (quanh các điểm trán của lưới), đi từ đỉnh trán của lưới lên theo trục cằm → trán,
 * mỗi bước xét một dải ngang; dải đầu tiên mà phần lớn KHÔNG còn giống màu da (và giữ như vậy thêm vài bước) là chân tóc.
 * Trả toạ độ 0..1, hoặc null khi không chắc (hói, tóc trùng màu da, ảnh cắt sát trán…) — khi đó người dùng tự chấm.
 */
export function timChanToc(luoi: { x: number; y: number }[], a: Anh): Diem | null {
  if (luoi.length < 468) return null;
  const px = (i: number): P => [luoi[i]!.x * a.width, luoi[i]!.y * a.height];
  const dinh = px(10), cam = px(152);
  const cao = Math.hypot(dinh[0] - cam[0], dinh[1] - cam[1]);
  const ngang = Math.hypot(px(454)[0] - px(234)[0], px(454)[1] - px(234)[1]);
  if (cao < 40 || ngang < 30) return null;
  const u: P = [(dinh[0] - cam[0]) / cao, (dinh[1] - cam[1]) / cao];   // hướng lên trên của mặt
  const v: P = [-u[1], u[0]];                                         // ngang mặt

  // màu da tham chiếu: trán giữa + hai bên trán (dưới đỉnh lưới, chưa tới tóc)
  const mY: number[] = [], mB: number[] = [], mR: number[] = [];
  const r = Math.max(2, cao * 0.02);
  for (const i of [151, 9, 108, 337, 69, 299]) {
    const [cx, cy] = px(i);
    for (let dx = -r; dx <= r; dx += Math.max(1, r / 3)) for (let dy = -r; dy <= r; dy += Math.max(1, r / 3)) {
      const m = mau(a, cx + dx, cy + dy);
      if (m) { mY.push(m[0]); mB.push(m[1]); mR.push(m[2]); }
    }
  }
  if (mY.length < 10) return null;
  const Y0 = trungVi(mY), B0 = trungVi(mB), R0 = trungVi(mR);
  // trán phải cùng màu da với má — khác hẳn thì trán đang bị tóc mái / mũ che → không đoán
  const mm: [number, number, number][] = [];
  for (const i of [50, 280, 101, 330]) { const m = mau(a, ...px(i)); if (m) mm.push(m); }
  if (mm.length < 2) return null;
  const Ym = trungVi(mm.map((m) => m[0])), Bm = trungVi(mm.map((m) => m[1])), Rm = trungVi(mm.map((m) => m[2]));
  if (Math.hypot(B0 - Bm, R0 - Rm) > 16 || Math.abs(Y0 - Ym) > Math.max(45, Ym * 0.4)) return null;
  const giongDa = (m: [number, number, number]) => {
    const dc = Math.hypot(m[1] - B0, m[2] - R0);
    const dy = m[0] - Y0;
    return dc < 14 && dy > -Math.max(30, Y0 * 0.3) && dy < Math.max(55, Y0 * 0.45);
  };

  const buoc = Math.max(1, cao / 400), xa = cao * 0.5, nuaDai = ngang * 0.12, k = Math.max(3, Math.round((cao * 0.02) / buoc));
  let dau = -1, lien = 0;
  for (let t = 0; t <= xa; t += buoc) {
    let da = 0, dem = 0;
    for (let j = -7; j <= 7; j++) {
      const x = dinh[0] + u[0] * t + v[0] * (nuaDai * j / 7), y = dinh[1] + u[1] * t + v[1] * (nuaDai * j / 7);
      const m = mau(a, x, y);
      if (!m) continue;
      dem++; if (giongDa(m)) da++;
    }
    if (dem < 8) return null;                       // ra ngoài ảnh trước khi thấy tóc
    if (da / dem < 0.4) {
      if (lien === 0) dau = t;
      if (++lien >= k) {
        if (dau < cao * 0.01) return null;            // ngay đỉnh lưới đã không giống da → tóc mái / che trán: không đoán
        const x = dinh[0] + u[0] * dau, y = dinh[1] + u[1] * dau;
        return { x: x / a.width, y: y / a.height };
      }
    } else lien = 0;
  }
  return null;
}
