// Trích xuất tín hiệu đường chỉ tay (Tâm Đạo, Trí Đạo, Sinh Đạo) 100% trên trình duyệt từ vùng lòng bàn tay (ROI).
// Không gửi ảnh lên máy chủ; kết quả luôn gắn nhãn `do_tin: "goi_y_tham_khao"` để vẽ lớp gợi ý tham khảo trên ảnh.
import type { DiemTay } from "./ban-tay-tu-dong";

export interface DuongChiSignal {
  do_ro: number;
  chieu_dai_uoc_luong: number;
  do_cong: number;
}

export interface KetQuaDuongChiCV {
  do_ro_tong: number;
  tam_dao: DuongChiSignal;
  tri_dao: DuongChiSignal;
  sinh_dao: DuongChiSignal;
  polylines: {
    tam_dao: [number, number][];
    tri_dao: [number, number][];
    sinh_dao: [number, number][];
  };
  do_tin: "goi_y_tham_khao";
}

const r3 = (v: number) => Number(Math.max(0, Math.min(1, v)).toFixed(3));
const r4 = (v: number) => Number(Math.max(0, Math.min(1, v)).toFixed(4));

/** Kiểm tra điểm (x, y) nằm trong đa giác bằng thuật toán ray-casting. */
function trongDaGiac(x: number, y: number, poly: [number, number][]): boolean {
  let trong = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i]![0], yi = poly[i]![1];
    const xj = poly[j]![0], yj = poly[j]![1];
    const cat = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi;
    if (cat) trong = !trong;
  }
  return trong;
}

/** Chuyển sang hệ toạ độ pixel và tính trung bình cục bộ O(1) qua bảng tổng tích luỹ (integral image). */
function tinhBanDoNep(
  gray: Float32Array,
  mask: Uint8Array,
  w: number,
  h: number,
): { ridge: Float32Array; stdPalm: number } {
  const sat = new Float64Array((w + 1) * (h + 1));
  let sum = 0, sum2 = 0, cnt = 0;

  for (let y = 0; y < h; y++) {
    let rowSum = 0;
    const off = y * w;
    const satRow = (y + 1) * (w + 1);
    const satPrev = y * (w + 1);
    for (let x = 0; x < w; x++) {
      const g = gray[off + x]!;
      rowSum += g;
      sat[satRow + x + 1] = sat[satPrev + x + 1]! + rowSum;
      if (mask[off + x]) {
        sum += g;
        sum2 += g * g;
        cnt++;
      }
    }
  }

  const meanPalm = cnt > 0 ? sum / cnt : 128;
  const stdPalm = cnt > 1 ? Math.sqrt(Math.max(1, sum2 / cnt - meanPalm * meanPalm)) : 20;

  const ridge = new Float32Array(w * h);
  const rad = Math.max(3, Math.min(9, Math.round(Math.min(w, h) * 0.035)));
  const d = Math.max(1, Math.min(3, Math.round(rad * 0.45)));

  for (let y = d; y < h - d; y++) {
    const y0 = Math.max(0, y - rad);
    const y1 = Math.min(h - 1, y + rad);
    const r0 = y0 * (w + 1);
    const r1 = (y1 + 1) * (w + 1);
    for (let x = d; x < w - d; x++) {
      const idx = y * w + x;
      if (!mask[idx]) continue;

      const x0 = Math.max(0, x - rad);
      const x1 = Math.min(w - 1, x + rad);
      const area = (x1 - x0 + 1) * (y1 - y0 + 1);
      const localMean = (sat[r1 + x1 + 1]! - sat[r0 + x1 + 1]! - sat[r1 + x0]! + sat[r0 + x0]!) / area;

      const g = gray[idx]!;
      // Độ tối cục bộ (nếp chỉ tay tối hơn vùng da lân cận)
      const dark = Math.max(0, localMean - g);

      // Đạo hàm bậc 2 (Hessian valley) theo 4 hướng: dọc, ngang, chéo 45°, chéo 135°
      const vVert = gray[(y - d) * w + x]! + gray[(y + d) * w + x]! - 2 * g;
      const vHorz = gray[y * w + (x - d)]! + gray[y * w + (x + d)]! - 2 * g;
      const vDiag1 = gray[(y - d) * w + (x - d)]! + gray[(y + d) * w + (x + d)]! - 2 * g;
      const vDiag2 = gray[(y - d) * w + (x + d)]! + gray[(y + d) * w + (x - d)]! - 2 * g;
      const valley = Math.max(0, vVert, vHorz, vDiag1, vDiag2) * 0.5;

      // Sobel gradient magnitude hỗ trợ biên nếp
      const gx = gray[y * w + (x + 1)]! - gray[y * w + (x - 1)]!;
      const gy = gray[(y + 1) * w + x]! - gray[(y - 1) * w + x]!;
      const grad = Math.hypot(gx, gy) * 0.25;

      ridge[idx] = dark * 0.55 + valley * 0.35 + grad * 0.1;
    }
  }

  return { ridge, stdPalm };
}

/** Nội suy tuyến tính hai điểm 2D. */
function lerp2(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

/** Tìm đường polyline mượt có năng lượng nếp cực đại trong một dải giải phẫu bằng quy hoạch động (Viterbi). */
function truyVetDai(
  ridge: Float32Array,
  mask: Uint8Array,
  w: number,
  h: number,
  bx: number,
  by: number,
  cw: number,
  ch: number,
  stdPalm: number,
  startEdge: [number, number],
  endEdge: [number, number],
  downVec: [number, number],
  vMin: number,
  vMax: number,
  soBuoc = 14,
  soMau = 11,
): { signal: DuongChiSignal; polyline: [number, number][] } {
  const pts: [number, number][][] = [];
  const scores: number[][] = [];

  for (let i = 0; i < soBuoc; i++) {
    const t = i / (soBuoc - 1);
    const base = lerp2(startEdge, endEdge, t);
    const colPts: [number, number][] = [];
    const colScores: number[] = [];
    for (let j = 0; j < soMau; j++) {
      const s = vMin + ((vMax - vMin) * j) / (soMau - 1);
      const px = base[0] + downVec[0] * s;
      const py = base[1] + downVec[1] * s;
      const lx = Math.round(px - bx);
      const ly = Math.round(py - by);
      colPts.push([px, py]);
      if (lx >= 1 && lx < w - 1 && ly >= 1 && ly < h - 1 && mask[ly * w + lx]) {
        // Lấy cực đại nhỏ 3x3 quanh điểm mẫu để chống nhiễu 1 pixel
        let best = ridge[ly * w + lx]!;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const val = ridge[(ly + dy) * w + (lx + dx)]!;
            if (val > best) best = val;
          }
        }
        colScores.push(best);
      } else {
        colScores.push(-1);
      }
    }
    pts.push(colPts);
    scores.push(colScores);
  }

  // DP tìm đường đi mượt (phạt bước nhảy lớn theo chỉ số j)
  const dp: number[][] = Array.from({ length: soBuoc }, () => new Array<number>(soMau).fill(-1e9));
  const prev: number[][] = Array.from({ length: soBuoc }, () => new Array<number>(soMau).fill(-1));
  const phat = Math.max(1.5, stdPalm * 0.12);

  for (let j = 0; j < soMau; j++) {
    dp[0]![j] = scores[0]![j]! >= 0 ? scores[0]![j]! : -5;
  }

  for (let i = 1; i < soBuoc; i++) {
    for (let j = 0; j < soMau; j++) {
      const sc = scores[i]![j]! >= 0 ? scores[i]![j]! : -5;
      let bestVal = -1e9;
      let bestK = j;
      for (let k = Math.max(0, j - 2); k <= Math.min(soMau - 1, j + 2); k++) {
        const cand = dp[i - 1]![k]! + sc - Math.abs(j - k) * phat;
        if (cand > bestVal) {
          bestVal = cand;
          bestK = k;
        }
      }
      dp[i]![j] = bestVal;
      prev[i]![j] = bestK;
    }
  }

  let endJ = 0;
  for (let j = 1; j < soMau; j++) {
    if (dp[soBuoc - 1]![j]! > dp[soBuoc - 1]![endJ]!) endJ = j;
  }

  const chosenPts: [number, number][] = new Array(soBuoc);
  const chosenScores: number[] = new Array(soBuoc);
  let cur = endJ;
  for (let i = soBuoc - 1; i >= 0; i--) {
    chosenPts[i] = pts[i]![cur]!;
    chosenScores[i] = Math.max(0, scores[i]![cur]!);
    cur = prev[i]![cur] ?? cur;
  }

  // Tính 3 chỉ số: độ rõ, chiều dài ước lượng, độ cong
  const nguong = Math.max(3.5, stdPalm * 0.22);
  let tongNangLuong = 0;
  let soDiemRo = 0;
  for (const s of chosenScores) {
    tongNangLuong += s;
    if (s >= nguong) soDiemRo++;
  }
  const avgEnergy = tongNangLuong / soBuoc;
  const doRo = r3(Math.min(1, avgEnergy / Math.max(10, stdPalm * 0.65)));
  const chieuDai = r3(soDiemRo / soBuoc);

  // Độ cong: khoảng lệch vuông góc lớn nhất so với dây cung nối đầu-cuối
  const pA = chosenPts[0]!, pB = chosenPts[soBuoc - 1]!;
  const chord = Math.hypot(pB[0] - pA[0], pB[1] - pA[1]) || 1;
  let maxDev = 0;
  for (const [x, y] of chosenPts) {
    const dev = Math.abs((pB[1] - pA[1]) * x - (pB[0] - pA[0]) * y + pB[0] * pA[1] - pB[1] * pA[0]) / chord;
    if (dev > maxDev) maxDev = dev;
  }
  const doCong = r3(Math.min(1, (maxDev / chord) * 2.5));

  const polyline: [number, number][] = chosenPts.map(([x, y]) => [r4(x / cw), r4(y / ch)]);
  return {
    signal: { do_ro: doRo, chieu_dai_uoc_luong: chieuDai, do_cong: doCong },
    polyline,
  };
}

/**
 * Trích xuất tín hiệu 3 đường chỉ chính (Tâm Đạo, Trí Đạo, Sinh Đạo) từ ảnh bàn tay trên canvas và 21 điểm mốc 2D.
 * Chạy hoàn toàn trên thiết bị người dùng, không dùng mô hình nặng.
 */
export function trichXuatDuongChi(canvas: HTMLCanvasElement, diem2d: DiemTay[]): KetQuaDuongChiCV | null {
  if (!canvas || diem2d.length !== 21) return null;
  const cw = canvas.width, ch = canvas.height;
  if (cw < 32 || ch < 32) return null;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const px = (i: number): [number, number] => [diem2d[i]![0] * cw, diem2d[i]![1] * ch];
  // Đa giác lòng bàn tay: cổ tay(0), CMC/MCP cái(1,2), MCP trỏ/giữa/áp út/út(5,9,13,17)
  const polyIdx = [0, 1, 2, 5, 9, 13, 17];
  const poly = polyIdx.map(px);

  let minX = cw, minY = ch, maxX = 0, maxY = 0;
  for (const [x, y] of poly) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  const bx = Math.max(0, Math.floor(minX) - 4);
  const by = Math.max(0, Math.floor(minY) - 4);
  const bw = Math.min(cw - bx, Math.ceil(maxX - bx) + 8);
  const bh = Math.min(ch - by, Math.ceil(maxY - by) + 8);
  if (bw < 24 || bh < 24) return null;

  const imgData = ctx.getImageData(bx, by, bw, bh).data;
  const gray = new Float32Array(bw * bh);
  const mask = new Uint8Array(bw * bh);

  for (let y = 0; y < bh; y++) {
    const gy = by + y;
    const rowOff = y * bw;
    for (let x = 0; x < bw; x++) {
      const gx = bx + x;
      const pOff = (rowOff + x) * 4;
      gray[rowOff + x] = 0.299 * imgData[pOff]! + 0.587 * imgData[pOff + 1]! + 0.114 * imgData[pOff + 2]!;
      if (trongDaGiac(gx, gy, poly)) {
        mask[rowOff + x] = 1;
      }
    }
  }

  const { ridge, stdPalm } = tinhBanDoNep(gray, mask, bw, bh);

  const p0 = px(0), p1 = px(1), p2 = px(2), p5 = px(5), p9 = px(9), p17 = px(17);
  // Vector hướng xuống cổ tay từ gốc ngón giữa
  const downVec: [number, number] = [p0[0] - p9[0], p0[1] - p9[1]];

  // 1. Tâm Đạo (Heart line): dải trên lòng bàn tay, từ mép ngón út (17) chạy sang phía ngón trỏ (5)
  const tam = truyVetDai(
    ridge, mask, bw, bh, bx, by, cw, ch, stdPalm,
    lerp2(p17, p0, 0.08),
    lerp2(p5, p0, 0.08),
    downVec,
    0.10, 0.34,
  );

  // 2. Trí Đạo (Head line): dải giữa lòng bàn tay, từ phía ngón trỏ/cái chạy sang phía cạnh út
  const tri = truyVetDai(
    ridge, mask, bw, bh, bx, by, cw, ch, stdPalm,
    lerp2(p5, p2, 0.35),
    lerp2(p17, p0, 0.38),
    downVec,
    0.05, 0.30,
  );

  // 3. Sinh Đạo (Life line): uốn quanh gò Kim Tinh từ kẽ trỏ-cái (giữa 5 và 2) xuống gần cổ tay (0)
  const sinhStart = lerp2(p5, p2, 0.45);
  const sinhEnd = lerp2(p0, p1, 0.25);
  // Vector hướng từ gốc ngón cái (1-2) vào giữa lòng bàn tay (hướng về 17)
  const thumbMid = lerp2(p1, p2, 0.5);
  const palmCenter = lerp2(p9, p0, 0.5);
  const outVec: [number, number] = [palmCenter[0] - thumbMid[0], palmCenter[1] - thumbMid[1]];
  const sinh = truyVetDai(
    ridge, mask, bw, bh, bx, by, cw, ch, stdPalm,
    sinhStart,
    sinhEnd,
    outVec,
    -0.05, 0.48,
  );

  const doRoTong = r3((tam.signal.do_ro + tri.signal.do_ro + sinh.signal.do_ro) / 3);

  return {
    do_ro_tong: doRoTong,
    tam_dao: tam.signal,
    tri_dao: tri.signal,
    sinh_dao: sinh.signal,
    polylines: {
      tam_dao: tam.polyline,
      tri_dao: tri.polyline,
      sinh_dao: sinh.polyline,
    },
    do_tin: "goi_y_tham_khao",
  };
}
