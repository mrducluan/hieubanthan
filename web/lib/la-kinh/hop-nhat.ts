// Thuật toán hợp nhất mẫu cảm biến La Kinh (Circular Mean + Wrapped MAD Outlier Rejection + Phone Flatness).
// Lưu ý: độ ổn định (R%) đo mức độ ít rung của cảm biến, KHÔNG chứng minh hết nhiễu từ trường hay độ lệch Bắc từ vs Bắc thật.

export interface MauCamBien {
  deg: number;
  /** webkitCompassAccuracy trên iOS (độ); null/undefined trên Android/Desktop. */
  accuracy?: number | null;
  beta?: number | null;
  gamma?: number | null;
}

export interface KetQuaHopNhat {
  mean: number;
  std: number;
  /** Mean Resultant Length R (0..1) — thước đo độ tụ của các mẫu góc. */
  R: number;
  /** Phần trăm ổn định (0..100). */
  onDinhPct: number;
  /** Sai số ước lượng hiển thị (±σ° hoặc iOS accuracy nếu lớn hơn). */
  saiSoDo: number;
  /** Số mẫu ngoại lai bị loại bởi bộ lọc MAD tuần hoàn. */
  soLoaiBo: number;
  /** Điện thoại có đang giữ đủ phẳng (< 25° nghiêng) hay không. */
  phang: boolean;
  gocNghieng: number;
}

/** Hiệu góc có dấu trong [-180, 180] giữa `a` và `b`. */
export function hieuGoc(a: number, b: number): number {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

/** Kiểm tra độ phẳng của điện thoại khi đo la bàn (tránh sai lệch trục từ kế khi cầm dốc). */
export function kiemTraPhang(
  beta?: number | null,
  gamma?: number | null,
  nguongDo = 25,
): { phang: boolean; gocNghieng: number } {
  if (typeof beta !== "number" && typeof gamma !== "number") {
    return { phang: true, gocNghieng: 0 };
  }
  const b = typeof beta === "number" && Number.isFinite(beta) ? Math.abs(beta) : 0;
  const g = typeof gamma === "number" && Number.isFinite(gamma) ? Math.abs(gamma) : 0;
  const gocNghieng = Math.round(Math.max(b, g) * 10) / 10;
  return { phang: gocNghieng <= nguongDo, gocNghieng };
}

function trungVi(nums: number[]): number {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function tinhVong(samples: MauCamBien[]): { mean: number; R: number; std: number } {
  let sumS = 0;
  let sumC = 0;
  let sumW = 0;
  for (const s of samples) {
    const w = typeof s.accuracy === "number" && s.accuracy > 0 ? 1 / Math.max(1, s.accuracy) : 1;
    const rad = (s.deg * Math.PI) / 180;
    sumS += w * Math.sin(rad);
    sumC += w * Math.cos(rad);
    sumW += w;
  }
  if (sumW <= 0) return { mean: 0, R: 0, std: 0 };
  const sMean = sumS / sumW;
  const cMean = sumC / sumW;
  const mean = ((Math.atan2(sMean, cMean) * 180) / Math.PI + 360) % 360;
  const R = Math.min(1, Math.max(1e-9, Math.hypot(sMean, cMean)));
  const std = (Math.sqrt(-2 * Math.log(R)) * 180) / Math.PI;
  return {
    mean: Math.round(mean * 10) / 10,
    R: Math.round(R * 1000) / 1000,
    std: Math.round(std * 10) / 10,
  };
}

/** Hợp nhất chuỗi mẫu cảm biến với lọc ngoại lai MAD tuần hoàn & trọng số độ chính xác. */
export function hopNhatLaBan(samples: MauCamBien[]): KetQuaHopNhat {
  if (!samples.length) {
    return { mean: 0, std: 0, R: 0, onDinhPct: 0, saiSoDo: 0, soLoaiBo: 0, phang: true, gocNghieng: 0 };
  }
  const banDau = tinhVong(samples);
  let giu = samples;
  if (samples.length >= 4) {
    const lechs = samples.map((s) => Math.abs(hieuGoc(s.deg, banDau.mean)));
    const mad = trungVi(lechs);
    const nguong = Math.max(5, 2.5 * 1.4826 * mad);
    const loc = samples.filter((_, i) => lechs[i]! <= nguong);
    if (loc.length >= 2) giu = loc;
  }

  const sau = tinhVong(giu);
  const accs = giu
    .map((s) => s.accuracy)
    .filter((a): a is number => typeof a === "number" && Number.isFinite(a) && a > 0);
  const accTrungVi = accs.length ? trungVi(accs) : 0;
  const cuoi = giu[giu.length - 1]!;
  const doPhang = kiemTraPhang(cuoi.beta, cuoi.gamma);

  return {
    mean: sau.mean,
    std: sau.std,
    R: sau.R,
    onDinhPct: Math.round(sau.R * 100),
    saiSoDo: Math.round(Math.max(sau.std, accTrungVi) * 10) / 10,
    soLoaiBo: samples.length - giu.length,
    phang: doPhang.phang,
    gocNghieng: doPhang.gocNghieng,
  };
}

export function trungBinhGoc(angles: number[]): { mean: number; std: number } {
  const kq = hopNhatLaBan(angles.map((deg) => ({ deg })));
  return { mean: kq.mean, std: kq.std };
}
