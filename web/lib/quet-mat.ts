// QBG-1 — "Quét 3 góc như Face ID": hàm THUẦN đánh giá từng khung hình camera (chạy trên máy người dùng, ảnh không rời máy).
// Không tính tướng: chỉ đọc lưới 478 điểm của bộ tìm điểm mốc (MediaPipe, lib/quet-mat-bo-do) để biết mặt đã đúng góc chưa,
// đủ gần / đủ sáng / đủ nét chưa → tự chụp. Ảnh chụp được đi vào đúng luồng cũ: ảnh thẳng → tự tìm 20 điểm (ANH-3),
// ảnh nghiêng → người dùng chấm đường viền (ANH-4) → engine đo. Mọi ngưỡng ở `NGUONG` để chỉnh một chỗ.

export type Buoc = "thang" | "trai" | "phai";
export const CAC_BUOC: Buoc[] = ["thang", "trai", "phai"];
export const TEN_BUOC: Record<Buoc, string> = { thang: "Nhìn thẳng", trai: "Quay trái", phai: "Quay phải" };

type P = { x: number; y: number; z?: number };

/** Chỉ số lưới MediaPipe Face Mesh dùng tới (người = chủ thể ảnh; ảnh camera trước CHƯA lật gương). */
const I = {
  ma_phai_nguoi: 234, ma_trai_nguoi: 454,       // viền gò má: 234 nằm bên TRÁI ảnh (má phải của người)
  duoi_mat_phai: 33, duoi_mat_trai: 263,
  dau_mui: 1, giua_moi: 13, cam: 152, dinh_tran: 10,
} as const;

export const NGUONG = {
  thang_yaw: 9,            // độ: |quay ngang| tối đa cho ảnh chính diện
  thang_roll: 8,           // độ: đầu nghiêng sang vai
  cui_min: 0.42, cui_max: 0.9,   // tỉ lệ (mũi − mắt) / (miệng − mắt): nhỏ = ngửa, lớn = cúi
  rong_min: 0.28, rong_max: 0.9, // bề ngang gò má / bề ngang phần khung đang hiện (oval chiếm ~60 % bề ngang màn)
  tam_lech: 0.2,          // tâm mặt lệch khỏi giữa khung (theo cạnh khung)
  sang_min: 55, sang_max: 235,   // độ sáng trung bình vùng mặt (0..255)
  net_min: 18,             // độ nét tối thiểu (phương sai Laplace, ảnh xám 96 px)
  nghieng_chup: 55,        // độ: quay đủ để chụp ảnh nghiêng (bộ đo còn bám mặt)
  nghieng_mat_dau: 38,     // độ: đã quay ≥ ngưỡng này rồi mất dấu mặt = đã quay gần hẳn 90° → vẫn chụp
  giu_ms: 900,             // giữ yên bao lâu thì chụp (đếm 3-2-1)
  rung_do: 5,              // độ: trong lúc giữ mà góc đổi quá ngưỡng → đếm lại
} as const;

export interface GocMat {
  yaw: number;   // độ, > 0 = người quay sang TRÁI của chính họ
  roll: number;  // độ
  cui: number;   // tỉ lệ cúi / ngửa (xem NGUONG.cui_*)
  rong: number;  // bề ngang mặt / bề ngang khung
  tam: { x: number; y: number }; // tâm mặt 0..1 theo khung
}

const DO = 180 / Math.PI;
const kep = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Lưới 478 điểm (toạ độ 0..1) + kích thước khung → góc mặt. Lưới thiếu điểm → null. */
export function gocMat(luoi: P[], w: number, h: number): GocMat | null {
  const g = (i: number) => luoi[i];
  const a = g(I.ma_phai_nguoi), b = g(I.ma_trai_nguoi), m = g(I.dau_mui), e1 = g(I.duoi_mat_phai), e2 = g(I.duoi_mat_trai),
    mo = g(I.giua_moi), c = g(I.cam), t = g(I.dinh_tran);
  if (!a || !b || !m || !e1 || !e2 || !mo || !c || !t || !w || !h) return null;
  const ax = a.x * w, bx = b.x * w, ngang = bx - ax;
  if (Math.abs(ngang) < 1e-6) return null;
  // Đầu ~ hình trụ: đầu mũi nhô ra trước nên lệch khỏi giữa hai viền má theo sin(góc quay).
  const r = (m.x * w - ax) / ngang;
  const yaw = Math.asin(kep((r - 0.5) * 2, -1, 1)) * DO;
  const roll = Math.atan2((e2.y - e1.y) * h, (e2.x - e1.x) * w) * DO;
  const yMat = ((e1.y + e2.y) / 2) * h, yMieng = mo.y * h;
  const cui = Math.abs(yMieng - yMat) < 1e-6 ? 0.65 : (m.y * h - yMat) / (yMieng - yMat);
  const xs = [a.x, b.x], ys = [t.y, c.y];
  return {
    yaw, roll, cui,
    rong: Math.abs(b.x - a.x),
    tam: { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 },
  };
}

/** Video phủ kín màn (object-cover) nên bị cắt mép: đổi cỡ + tâm mặt sang phần khung ĐANG HIỆN để "lại gần / lệch" khớp
 *  đúng cái người dùng thấy trong khung oval. vw×vh = khung camera, cw×ch = kích thước phần tử video trên màn. */
export function theoKhungHien(g: GocMat, vw: number, vh: number, cw: number, ch: number): GocMat {
  if (!vw || !vh || !cw || !ch) return g;
  const k = Math.max(cw / vw, ch / vh);
  const fx = Math.min(1, cw / (vw * k)), fy = Math.min(1, ch / (vh * k));
  return { ...g, rong: g.rong / fx, tam: { x: 0.5 + (g.tam.x - 0.5) / fx, y: 0.5 + (g.tam.y - 0.5) / fy } };
}

export type LoiKhung =
  | "khong_thay" | "nhieu_mat" | "xa" | "gan" | "lech" | "nghieng_dau" | "cui" | "ngua"
  | "quay_lai_thang" | "quay_them" | "sai_ben" | "toi" | "choi" | "mo";

export const LOI_KHUNG: Record<LoiKhung, string> = {
  khong_thay: "Đưa khuôn mặt vào khung",
  nhieu_mat: "Chỉ để một khuôn mặt trong khung",
  xa: "Lại gần hơn một chút",
  gan: "Lùi ra xa một chút",
  lech: "Đưa mặt vào giữa khung",
  nghieng_dau: "Giữ đầu thẳng, đừng nghiêng sang vai",
  cui: "Ngẩng lên một chút",
  ngua: "Cúi xuống một chút",
  quay_lai_thang: "Nhìn thẳng vào máy",
  quay_them: "Quay thêm chút nữa",
  sai_ben: "Quay sang bên kia",
  toi: "Hơi tối — ra chỗ sáng hơn",
  choi: "Quá chói — tránh đèn chiếu thẳng",
  mo: "Ảnh bị mờ — giữ yên máy",
};

/** Hướng quay so với bước đang làm: "trai" cần yaw > 0, "phai" cần yaw < 0. */
const dau = (b: Buoc) => (b === "trai" ? 1 : b === "phai" ? -1 : 0);

/** Tiến độ quay (0..1) cho vòng vạch quanh khung oval. Bước thẳng: 1 khi đã thẳng. */
export function tienDo(goc: GocMat | null, buoc: Buoc): number {
  if (!goc) return 0;
  if (buoc === "thang") return kep(1 - (Math.abs(goc.yaw) - NGUONG.thang_yaw) / 30, 0, 1);
  return kep((goc.yaw * dau(buoc)) / NGUONG.nghieng_chup, 0, 1);
}

/** Một khung hình đã đủ điều kiện chụp cho bước này chưa; chưa thì lỗi đầu tiên cần sửa (một lời nhắc mỗi lúc). */
export function danhGia(goc: GocMat | null, buoc: Buoc, soMat = 1, sang?: number): { ok: boolean; loi: LoiKhung | null } {
  const sai = (loi: LoiKhung) => ({ ok: false, loi });
  if (soMat > 1) return sai("nhieu_mat");
  if (!goc || soMat === 0) return sai("khong_thay");
  if (buoc === "thang") {
    if (goc.rong < NGUONG.rong_min) return sai("xa");
    if (goc.rong > NGUONG.rong_max) return sai("gan");
    if (Math.abs(goc.tam.x - 0.5) > NGUONG.tam_lech || Math.abs(goc.tam.y - 0.5) > NGUONG.tam_lech + 0.05) return sai("lech");
    if (Math.abs(goc.yaw) > NGUONG.thang_yaw) return sai("quay_lai_thang");
    if (Math.abs(goc.roll) > NGUONG.thang_roll) return sai("nghieng_dau");
    if (goc.cui < NGUONG.cui_min) return sai("ngua");
    if (goc.cui > NGUONG.cui_max) return sai("cui");
  } else {
    // Ảnh nghiêng: mặt quay đi nên bề ngang nhìn thấy hẹp lại — chỉ chặn quá xa / quá gần thô.
    if (goc.rong < NGUONG.rong_min * 0.55) return sai("xa");
    if (goc.rong > NGUONG.rong_max) return sai("gan");
    const y = goc.yaw * dau(buoc);
    if (y < -12) return sai("sai_ben");
    if (y < NGUONG.nghieng_chup) return sai("quay_them");
  }
  if (sang != null) {
    if (sang < NGUONG.sang_min) return sai("toi");
    if (sang > NGUONG.sang_max) return sai("choi");
  }
  return { ok: true, loi: null };
}

/** Bước nghiêng: bộ đo mất dấu mặt SAU KHI người dùng đã quay đúng chiều quá ngưỡng → coi là đã quay gần hẳn 90°. */
export function matDauDoQuayHan(yawCaoNhat: number, buoc: Buoc): boolean {
  return buoc !== "thang" && yawCaoNhat * dau(buoc) >= NGUONG.nghieng_mat_dau;
}

/** Ảnh xám (w×h, 0..255) → độ sáng trung bình + độ nét (phương sai toán tử Laplace). */
export function sangVaNet(xam: ArrayLike<number>, w: number, h: number): { sang: number; net: number } {
  let tong = 0;
  for (let i = 0; i < w * h; i++) tong += xam[i]!;
  const sang = w * h ? tong / (w * h) : 0;
  let n = 0, s = 0, s2 = 0;
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const o = y * w + x;
    const l = xam[o - 1]! + xam[o + 1]! + xam[o - w]! + xam[o + w]! - 4 * xam[o]!;
    n++; s += l; s2 += l * l;
  }
  const tb = n ? s / n : 0;
  return { sang, net: n ? s2 / n - tb * tb : 0 };
}

/** RGBA → xám (BT.601). */
export function sangXam(rgba: ArrayLike<number>): Uint8ClampedArray {
  const ra = new Uint8ClampedArray(rgba.length / 4);
  for (let i = 0, j = 0; j < ra.length; i += 4, j++) ra[j] = 0.299 * rgba[i]! + 0.587 * rgba[i + 1]! + 0.114 * rgba[i + 2]!;
  return ra;
}
