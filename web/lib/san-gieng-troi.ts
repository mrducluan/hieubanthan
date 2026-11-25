// TY-2 gói 2 — sân / giếng trời trên sơ đồ nhà theo tỉ lệ: các dải ngang (y0, y1 theo chiều sâu, 0..1; 0 = mặt trước).
// Hàm thuần chỉ giữ HÌNH HỌC của điều người dùng vẽ (dải nằm trong nhà, không chồng nhau, đủ rộng để kéo chạm được).
// Số lớp, dãy nhà chính, phía cửa / chủ / bếp đo theo từng sân là của ENGINE (`theo_san` của /v1/phongthuy/vi-tri-vat).
// Không import `@/` — nạp được trong Node test.

export type Dai = [number, number];

export const TOI_DA_SAN = 14;           // khớp engine `mat_bang_khung.TOI_DA_SAN`
export const CAO_MAC_DINH_M = 1.2;      // dải mới cao ~1,2 m
export const CAO_TOI_THIEU_M = 0.4;     // dải hẹp hơn thì khó chạm, kéo
export const KHOI_TOI_THIEU_M = 0.4;    // khoảng cách tối thiểu tới mép nhà / dải bên cạnh

const lam = (n: number) => Math.round(n * 10000) / 10000;
const sapXep = (ds: Dai[]) => [...ds].sort((a, b) => a[0] - b[0]);

/** Đúng điều kiện engine: 0 < y0 < y1 < 1, không chồng nhau, ≤ 14 dải. */
export function hopLe(ds: readonly Dai[]): boolean {
  if (ds.length > TOI_DA_SAN) return false;
  let truoc = 0;
  for (const [a, b] of sapXep([...ds])) {
    if (!(a > 0 && a < b && b < 1)) return false;
    if (a <= truoc && truoc > 0) return false;
    truoc = b;
  }
  return true;
}

/** Chỉ số dải chứa y (0..1) hoặc -1. */
export function daiTai(ds: readonly Dai[], y: number): number {
  return ds.findIndex(([a, b]) => y >= a && y <= b);
}

/** Khoảng trống (lo, hi) quanh dải `i` (hoặc quanh điểm y khi `i` = -1) — đã chừa khoảng tối thiểu. */
function khoangTrong(ds: readonly Dai[], i: number, y: number, sauM: number): [number, number] {
  const g = KHOI_TOI_THIEU_M / sauM;
  let lo = g, hi = 1 - g;
  ds.forEach(([a, b], j) => {
    if (j === i) return;
    const giua = i >= 0 ? (ds[i]![0] + ds[i]![1]) / 2 : y;
    if (b <= giua) lo = Math.max(lo, b + g);
    else if (a >= giua) hi = Math.min(hi, a - g);
  });
  return [lo, hi];
}

/** Thêm một dải cao ~1,2 m giữa tại `y`. Trả danh sách mới (đã sắp xếp) và chỉ số dải mới, hoặc null khi không còn chỗ. */
export function themSan(ds: readonly Dai[], y: number, sauM: number, caoM = CAO_MAC_DINH_M): { ds: Dai[]; i: number } | null {
  if (ds.length >= TOI_DA_SAN || !(sauM > 0) || daiTai(ds, y) >= 0) return null;
  const [lo, hi] = khoangTrong(ds, -1, y, sauM);
  const toiThieu = CAO_TOI_THIEU_M / sauM;
  if (hi - lo < toiThieu) return null;
  const h = Math.min(caoM / sauM, hi - lo);
  const y0 = Math.min(Math.max(y - h / 2, lo), hi - h);
  const moi: Dai = [lam(y0), lam(y0 + h)];
  const ra = sapXep([...ds, moi]);
  return hopLe(ra) ? { ds: ra, i: ra.indexOf(moi) } : null;
}

/** Dời dải `i` sao cho mép trên ở `y0` (giữ chiều cao), kẹp trong khoảng trống. */
export function doiSan(ds: readonly Dai[], i: number, y0: number, sauM: number): Dai[] {
  const d = ds[i];
  if (!d) return [...ds];
  const h = d[1] - d[0];
  const [lo, hi] = khoangTrong(ds, i, 0, sauM);
  const a = Math.min(Math.max(y0, lo), Math.max(lo, hi - h));
  return ganLai(ds, i, [lam(a), lam(Math.min(a + h, hi))]);
}

/** Kéo một mép (trên / dưới) của dải `i` tới `y`; giữ chiều cao tối thiểu và khoảng trống. */
export function keoMep(ds: readonly Dai[], i: number, mep: "tren" | "duoi", y: number, sauM: number): Dai[] {
  const d = ds[i];
  if (!d) return [...ds];
  const [lo, hi] = khoangTrong(ds, i, 0, sauM);
  const toiThieu = CAO_TOI_THIEU_M / sauM;
  const moi: Dai = mep === "tren"
    ? [lam(Math.min(Math.max(y, lo), d[1] - toiThieu)), d[1]]
    : [d[0], lam(Math.max(Math.min(y, hi), d[0] + toiThieu))];
  return ganLai(ds, i, moi);
}

/** Đổi chiều cao dải `i` thêm `buocM` mét (giữ tâm khi được). */
export function doiCao(ds: readonly Dai[], i: number, buocM: number, sauM: number): Dai[] {
  const d = ds[i];
  if (!d) return [...ds];
  const [lo, hi] = khoangTrong(ds, i, 0, sauM);
  const h = Math.min(hi - lo, Math.max(CAO_TOI_THIEU_M / sauM, d[1] - d[0] + buocM / sauM));
  const tam = (d[0] + d[1]) / 2;
  const a = Math.min(Math.max(tam - h / 2, lo), hi - h);
  return ganLai(ds, i, [lam(a), lam(a + h)]);
}

export function xoaSan(ds: readonly Dai[], i: number): Dai[] {
  return ds.filter((_, j) => j !== i);
}

function ganLai(ds: readonly Dai[], i: number, moi: Dai): Dai[] {
  const ra = ds.map((x, j) => (j === i ? moi : x));
  return hopLe(ra) ? ra : [...ds];
}

/** CHỈ để vẽ nhãn "Lớp n" bên mép trái: các khoảng (y0, y1) giữa các dải. Số lớp thật lấy từ engine. */
export function khoiVe(ds: readonly Dai[]): Dai[] {
  const ra: Dai[] = [];
  let truoc = 0;
  for (const [a, b] of sapXep([...ds])) { ra.push([truoc, a]); truoc = b; }
  ra.push([truoc, 1]);
  return ra;
}
