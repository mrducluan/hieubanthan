// Trích xuất đặc trưng 3D + blendshapes + ROI pixel ngay trên trình duyệt từ lưới 478 điểm MediaPipe.
// Hàm thuần — không DOM, không gọi mạng — chỉ trả số đo tổng hợp `Record<string, number>` (đã làm tròn 4 chữ số thập phân).
import type { Anh } from "./diem-moc";

export type Diem3D = { x: number; y: number; z?: number };
export type BlendshapeItem = { categoryName: string; score: number };
export type BlendshapesInput = Record<string, number> | BlendshapeItem[] | null | undefined;

type P3 = { x: number; y: number; z: number; hasZ: boolean };

const round4 = (n: number) => Math.round(n * 10000) / 10000;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const dist2d = (a: P3, b: P3) => Math.hypot(a.x - b.x, a.y - b.y);
const mid2d = (a: P3, b: P3): P3 => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
  z: (a.z + b.z) / 2,
  hasZ: a.hasZ && b.hasZ,
});

function median(vals: number[]): number | null {
  if (vals.length === 0) return null;
  const s = [...vals].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function rgbToYCbCr(r: number, g: number, b: number): [number, number, number] {
  const y = 0.299 * r + 0.587 * g + 0.114 * b;
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
  return [y, cb, cr];
}

function lumaAt(img: Anh, xi: number, yi: number): number | null {
  if (xi < 0 || yi < 0 || xi >= img.width || yi >= img.height) return null;
  const o = (yi * img.width + xi) * 4;
  return 0.299 * img.data[o]! + 0.587 * img.data[o + 1]! + 0.114 * img.data[o + 2]!;
}

function sampleYCbCrPatches(
  img: Anh,
  centers: P3[],
  radius: number,
): { y: number[]; cb: number[]; cr: number[] } {
  const y: number[] = [];
  const cb: number[] = [];
  const cr: number[] = [];
  const r = Math.max(1, Math.round(radius));
  const step = Math.max(1, Math.floor(r / 2));
  for (const c of centers) {
    const cx = Math.round(c.x);
    const cy = Math.round(c.y);
    for (let dy = -r; dy <= r; dy += step) {
      const py = cy + dy;
      if (py < 0 || py >= img.height) continue;
      for (let dx = -r; dx <= r; dx += step) {
        const px = cx + dx;
        if (px < 0 || px >= img.width) continue;
        const o = (py * img.width + px) * 4;
        const [yv, cbv, crv] = rgbToYCbCr(img.data[o]!, img.data[o + 1]!, img.data[o + 2]!);
        y.push(yv);
        cb.push(cbv);
        cr.push(crv);
      }
    }
  }
  return { y, cb, cr };
}

function normalizeBlendshapes(input: BlendshapesInput): Record<string, number> | null {
  if (!input) return null;
  if (Array.isArray(input)) {
    if (input.length === 0) return null;
    const out: Record<string, number> = {};
    for (const item of input) {
      if (item && typeof item.categoryName === "string" && Number.isFinite(item.score)) {
        out[item.categoryName] = item.score;
      }
    }
    return Object.keys(out).length > 0 ? out : null;
  }
  return Object.keys(input).length > 0 ? input : null;
}

export function trichXuatDacTrung3D(
  luoi: Diem3D[],
  blendshapes?: BlendshapesInput,
  imgData?: Anh | null,
  opts?: { chanTocUocLuong?: boolean },
): Record<string, number> {
  const out: Record<string, number> = {};
  const set = (k: string, v: number | null | undefined) => {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = round4(v);
  };

  if (opts?.chanTocUocLuong !== undefined) {
    set("chan_toc_uoc_luong", opts.chanTocUocLuong ? 1 : 0);
  }

  if (luoi.length < 468) return out;

  const w = imgData && imgData.width > 0 ? imgData.width : 1;
  const h = imgData && imgData.height > 0 ? imgData.height : 1;

  const p = (i: number): P3 => {
    const pt = luoi[i]!;
    const hasZ = typeof pt.z === "number" && Number.isFinite(pt.z);
    return { x: pt.x * w, y: pt.y * h, z: hasZ ? pt.z! * w : 0, hasZ };
  };

  // Inter-pupillary distance (between eye centers) in pixel-equivalent units
  const eyeCenterL = mid2d(p(33), p(133));
  const eyeCenterR = mid2d(p(362), p(263));
  const ipd = dist2d(eyeCenterL, eyeCenterR);
  if (!(ipd > 1e-4)) return out;

  // Eye geometry
  const eyeW_L = dist2d(p(33), p(133));
  const eyeW_R = dist2d(p(362), p(263));
  const avgEyeW = (eyeW_L + eyeW_R) / 2;
  const eyeH_L = dist2d(p(159), p(145));
  const eyeH_R = dist2d(p(386), p(374));
  const avgEyeH = (eyeH_L + eyeH_R) / 2;

  if (eyeW_L > 1e-4 && eyeW_R > 1e-4) {
    set("eye_aspect_ratio", (eyeH_L / eyeW_L + eyeH_R / eyeW_R) / 2);
  }

  // Dien trach ratio: avg vertical dist between lower brow (52,53,65 / 282,283,295) and upper eyelid (159 / 386), / eye height
  if (avgEyeH > 1e-4) {
    const browY_L = (p(52).y + p(53).y + p(65).y) / 3;
    const browY_R = (p(282).y + p(283).y + p(295).y) / 3;
    const dL = Math.max(0, p(159).y - browY_L);
    const dR = Math.max(0, p(386).y - browY_R);
    set("dien_trach_ratio", (dL + dR) / 2 / avgEyeH);
  }

  // Iris sclera exposure (tam bach duoi / tren) when 478 landmarks are available
  if (luoi.length >= 478 && eyeH_L > 1e-4 && eyeH_R > 1e-4) {
    const irisL = [469, 470, 471, 472].map((i) => p(i).y);
    const irisR = [474, 475, 476, 477].map((i) => p(i).y);
    const irisBotL = Math.max(...irisL);
    const irisBotR = Math.max(...irisR);
    const irisTopL = Math.min(...irisL);
    const irisTopR = Math.min(...irisR);
    const tbdL = Math.max(0, (p(145).y - irisBotL) / eyeH_L);
    const tbdR = Math.max(0, (p(374).y - irisBotR) / eyeH_R);
    const tbtL = Math.max(0, (irisTopL - p(159).y) / eyeH_L);
    const tbtR = Math.max(0, (irisTopR - p(386).y) / eyeH_R);
    set("tam_bach_duoi", (tbdL + tbdR) / 2);
    set("tam_bach_tren", (tbtL + tbtR) / 2);
  }

  // 3D Z prominence features (MediaPipe Z is negative closer to camera)
  const p133 = p(133), p362 = p(362), p168 = p(168);
  if (p133.hasZ && p362.hasZ && p168.hasZ) {
    set("son_can_z", ((p133.z + p362.z) / 2 - p168.z) / ipd);
  }

  const p50 = p(50), p280 = p(280), p6 = p(6), p197 = p(197), p195 = p(195);
  if (p50.hasZ && p280.hasZ && p6.hasZ && p197.hasZ && p195.hasZ) {
    set("song_mui_z", ((p50.z + p280.z) / 2 - (p6.z + p197.z + p195.z) / 3) / ipd);
  }

  // Dorsal hump deviation along bridge 168 -> 6 -> 197 -> 195 -> 5 -> 4
  const p5 = p(5), p4 = p(4);
  if (p168.hasZ && p6.hasZ && p197.hasZ && p195.hasZ && p5.hasZ && p4.hasZ) {
    const vx = p4.x - p168.x;
    const vy = p4.y - p168.y;
    const len2 = vx * vx + vy * vy;
    if (len2 > 1e-6) {
      let maxBump = 0;
      for (const pt of [p6, p197, p195, p5]) {
        const t = clamp01(((pt.x - p168.x) * vx + (pt.y - p168.y) * vy) / len2);
        const zChord = p168.z + t * (p4.z - p168.z);
        const bump = zChord - pt.z; // positive = outward toward camera
        if (bump > maxBump) maxBump = bump;
      }
      set("song_mui_go", maxBump / ipd);
    }
  }

  // Cheekbone forward projection
  const p234 = p(234), p454 = p(454);
  if (p234.hasZ && p454.hasZ && p50.hasZ && p280.hasZ) {
    set("luong_quyen_z", ((p234.z + p454.z) / 2 - (p50.z + p280.z) / 2) / ipd);
  }

  // Forehead convexity
  const p54 = p(54), p284 = p(284), p151 = p(151);
  if (p54.hasZ && p284.hasZ && p151.hasZ) {
    set("tran_convexity_z", ((p54.z + p284.z) / 2 - p151.z) / ipd);
  }

  // 2D structural ratios
  const alarW = dist2d(p(64), p(294));
  if (alarW > 1e-4) set("chuan_dau_ratio", dist2d(p(44), p(274)) / alarW);

  const mouthW = dist2d(p(61), p(291));
  if (mouthW > 1e-4) set("moi_day_ratio", dist2d(p(0), p(17)) / mouthW);

  const jawW = dist2d(p(172), p(397));
  if (jawW > 1e-4) set("cam_width_ratio", dist2d(p(148), p(377)) / jawW);

  if (avgEyeW > 1e-4) {
    const browLen = (dist2d(p(46), p(55)) + dist2d(p(276), p(285))) / 2;
    set("may_dai_ratio", browLen / avgEyeW);
  }

  // Blendshape expression features (with geometric fallback for smile)
  const bs = normalizeBlendshapes(blendshapes);
  if (bs && (bs.mouthSmileLeft !== undefined || bs.mouthSmileRight !== undefined)) {
    const smile = ((bs.mouthSmileLeft ?? 0) + (bs.mouthSmileRight ?? 0)) / 2;
    const frown = ((bs.mouthFrownLeft ?? 0) + (bs.mouthFrownRight ?? 0)) / 2;
    set("net_mat_smile", smile - frown);
  } else if (mouthW > 1e-4) {
    const midMouthY = (p(13).y + p(14).y) / 2;
    const cornerAvgY = (p(61).y + p(291).y) / 2;
    set("net_mat_smile", Math.max(-1, Math.min(1, (midMouthY - cornerAvgY) / mouthW)));
  }

  if (bs && (bs.browDownLeft !== undefined || bs.browDownRight !== undefined)) {
    set("net_mat_brow_down", ((bs.browDownLeft ?? 0) + (bs.browDownRight ?? 0)) / 2);
  }

  // Pixel ROI features (skin color, under-eye delta, lip Cr, brow density, forehead wrinkles)
  if (imgData && imgData.width > 0 && imgData.height > 0 && imgData.data.length >= imgData.width * imgData.height * 4) {
    const cheek = sampleYCbCrPatches(imgData, [50, 280, 101, 330].map(p), ipd * 0.06);
    const cheekLuma = median(cheek.y);
    const cheekCb = median(cheek.cb);
    const cheekCr = median(cheek.cr);
    set("sac_da_luma", cheekLuma);
    set("sac_da_cb", cheekCb);
    set("sac_da_cr", cheekCr);

    if (cheekLuma !== null) {
      const underEye = sampleYCbCrPatches(imgData, [111, 117, 340, 346].map(p), ipd * 0.04);
      const underEyeLuma = median(underEye.y);
      if (underEyeLuma !== null) set("le_duong_delta", cheekLuma - underEyeLuma);
    }

    if (cheekCr !== null) {
      const lip = sampleYCbCrPatches(imgData, [13, 14, 0, 17].map(p), ipd * 0.03);
      const lipCr = median(lip.cr);
      if (lipCr !== null) set("moi_cr", lipCr - cheekCr);
    }

    // Eyebrow density: relative darkness of eyebrow pixels vs forehead skin
    const browPts = [46, 53, 52, 65, 55, 70, 63, 105, 66, 107, 276, 283, 282, 295, 285, 300, 293, 334, 296, 336].map(p);
    const foreheadPts = [151, 9, 108, 337, 69, 299].map(p);
    const browLuma = median(sampleYCbCrPatches(imgData, browPts, ipd * 0.025).y);
    const foreheadLuma = median(sampleYCbCrPatches(imgData, foreheadPts, ipd * 0.04).y);
    if (browLuma !== null && foreheadLuma !== null && foreheadLuma > 10) {
      set("may_density", clamp01((foreheadLuma - browLuma) / foreheadLuma));
    }

    // Forehead horizontal Sobel edge density between landmarks 10 and 9
    const p10 = p(10), p9 = p(9);
    const yTopRaw = Math.min(p10.y, p9.y);
    const yBotRaw = Math.max(p10.y, p9.y);
    const fhH = yBotRaw - yTopRaw;
    if (fhH >= 6) {
      const cx = (p10.x + p9.x) / 2;
      const halfW = ipd * 0.35;
      const xStart = Math.max(1, Math.round(cx - halfW));
      const xEnd = Math.min(imgData.width - 2, Math.round(cx + halfW));
      const yStart = Math.max(1, Math.round(yTopRaw + fhH * 0.15));
      const yEnd = Math.min(imgData.height - 2, Math.round(yBotRaw - fhH * 0.15));
      let total = 0;
      let edges = 0;
      const step = Math.max(1, Math.floor((xEnd - xStart) / 80));
      for (let y = yStart; y <= yEnd; y += step) {
        for (let x = xStart; x <= xEnd; x += step) {
          const tl = lumaAt(imgData, x - 1, y - 1);
          const tc = lumaAt(imgData, x, y - 1);
          const tr = lumaAt(imgData, x + 1, y - 1);
          const bl = lumaAt(imgData, x - 1, y + 1);
          const bc = lumaAt(imgData, x, y + 1);
          const br = lumaAt(imgData, x + 1, y + 1);
          if (tl === null || tc === null || tr === null || bl === null || bc === null || br === null) continue;
          const gy = Math.abs(-tl - 2 * tc - tr + bl + 2 * bc + br);
          total++;
          if (gy > 36) edges++;
        }
      }
      if (total > 0) set("nep_tran_edge", clamp01(edges / total));
    }
  }

  return out;
}
