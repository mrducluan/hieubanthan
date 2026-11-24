// LK-1 — phần THUẦN của la bàn điện thoại: giải mã cảm biến (alpha / beta / gamma → hướng đầu máy), làm mượt KIM lúc
// ngắm và chuẩn hoá số để vẽ. KHÔNG tính số độ được chốt: mẫu thô gửi engine (`/api/phongthuy/do-huong` nhận `mau`),
// engine tính trung bình, độ rung, mức ổn định, so hai lần đo. Tệp này không import alias `@/` (test node đọc thẳng).

const RAD = Math.PI / 180;

/** Máy dựng quá mức này (|beta| hoặc |gamma|, độ) → mẫu bị coi là "nghiêng": không thu, giao diện nhắc đặt máy phẳng. */
export const NGUONG_NGHIENG = 60;
/** Một lần đo "giữ yên" kéo dài bấy nhiêu mili giây, tối đa bấy nhiêu mẫu (khớp trần của engine). */
export const THOI_GIAN_GIU_MS = 1500;
export const TOI_DA_MAU = 240;

/** Đưa góc về [0, 360). */
export function chuanDo(d: number): number {
  const r = ((d % 360) + 360) % 360;
  return r >= 360 ? 0 : r;   // −1e-13 % 360 + 360 có thể ra đúng 360 do làm tròn số thực
}

/** Hiệu góc có dấu a − b trong [−180, 180). */
export function hieuGoc(a: number, b: number): number {
  return ((((a - b) % 360) + 540) % 360) - 180;
}

/** Số độ NGUYÊN để hiện (0–359): làm tròn TRƯỚC rồi mới chuẩn hoá — 359,6° hiện "0", không bao giờ "360". */
export function doHienThi(d: number): number {
  return chuanDo(Math.round(d));
}

/** Mẫu thô gửi engine: 2 chữ số thập phân, luôn trong [0, 360) (359,996 → 0, không phải 360). */
export function lamTronMau(d: number): number {
  const r = Math.round(chuanDo(d) * 100) / 100;
  return r >= 360 ? 0 : r;
}

/** Hướng la bàn (0 = Bắc, theo chiều kim) của CẠNH TRÊN máy, chiếu xuống mặt phẳng ngang.
 *  Ma trận quay của đặc tả DeviceOrientation (R = Rz(alpha)·Rx(beta)·Ry(gamma), trục đất: x Đông, y Bắc, z lên trời);
 *  cạnh trên máy là trục y của máy = cột thứ hai của R = (−sinα·cosβ, cosα·cosβ, sinβ) → hướng = atan2(Đông, Bắc).
 *  Khi |beta| < 90° kết quả đúng bằng 360 − alpha (gamma không làm đổi hướng cạnh trên); quá 90° (máy ngả ra sau) hướng lật
 *  180° — chỗ công thức "360 − alpha" sai. Máy dựng đứng (cosβ ≈ 0) không xác định được → null. */
export function huongDinhMay(alpha: number, beta: number, gamma: number): number | null {
  if (![alpha, beta, gamma].every((x) => Number.isFinite(x))) return null;
  const cX = Math.cos(beta * RAD);
  if (Math.abs(cX) < 1e-6) return null;
  const dong = -Math.sin(alpha * RAD) * cX;
  const bac = Math.cos(alpha * RAD) * cX;
  return chuanDo(Math.atan2(dong, bac) / RAD);
}

/** Các trường của sự kiện cảm biến mà bộ giải mã cần (iOS có thêm hai trường webkit*). */
export interface SuKienTho {
  alpha?: number | null; beta?: number | null; gamma?: number | null; absolute?: boolean;
  webkitCompassHeading?: number | null; webkitCompassAccuracy?: number | null;
}
export interface MauGiaiMa {
  /** Hướng (độ, bắc từ) của cạnh trên MÀN HÌNH đang cầm — đã cộng góc xoay màn hình. */
  do: number;
  /** Máy dựng quá `NGUONG_NGHIENG` → không thu mẫu này. */
  nghieng: boolean;
  /** iOS `webkitCompassAccuracy` NGUYÊN GỐC (âm = la bàn chưa hiệu chỉnh); máy khác: null. */
  saiSo: number | null;
}

/** Sự kiện cảm biến → hướng đầu máy. `tuyetDoi`: sự kiện là `deviceorientationabsolute`. `gocManHinh`:
 *  `screen.orientation.angle` (máy xoay ngang thì cạnh trên màn hình lệch cạnh trên máy đúng bấy nhiêu độ).
 *  Sự kiện không tuyệt đối (alpha tính từ lúc mở trang, không phải từ Bắc) → null. */
export function giaiMa(e: SuKienTho, tuyetDoi: boolean, gocManHinh = 0): MauGiaiMa | null {
  const goc = Number.isFinite(gocManHinh) ? gocManHinh : 0;
  const b = typeof e.beta === "number" && Number.isFinite(e.beta) ? e.beta : 0;
  const g = typeof e.gamma === "number" && Number.isFinite(e.gamma) ? e.gamma : 0;
  const nghieng = Math.abs(b) > NGUONG_NGHIENG || Math.abs(g) > NGUONG_NGHIENG;
  if (typeof e.webkitCompassHeading === "number" && Number.isFinite(e.webkitCompassHeading)) {
    // iOS đã bù nghiêng sẵn; chỉ cộng góc xoay màn hình.
    const ss = typeof e.webkitCompassAccuracy === "number" && Number.isFinite(e.webkitCompassAccuracy) ? e.webkitCompassAccuracy : null;
    return { do: chuanDo(e.webkitCompassHeading + goc), nghieng, saiSo: ss };
  }
  if (!(tuyetDoi || e.absolute === true) || typeof e.alpha !== "number") return null;
  const h = huongDinhMay(e.alpha, b, g);
  if (h == null) return null;
  return { do: chuanDo(h + goc), nghieng, saiSo: null };
}

/** Chọn sự kiện nào được đọc khi nghe CẢ HAI loại (`deviceorientationabsolute` và `deviceorientation`).
 *  - iOS: `deviceorientation` có `webkitCompassHeading` (đã tính từ Bắc) → "ios".
 *  - `deviceorientationabsolute` (Android Chrome, WebView): alpha tính từ Bắc từ → "tuyet_doi".
 *  - `deviceorientation` tự khai `absolute: true` (trình duyệt không có sự kiện tuyệt đối riêng) → "tuyet_doi", NHƯNG chỉ
 *    khi chưa thấy sự kiện tuyệt đối riêng nào — tránh trộn hai nguồn khác cách hợp nhất cảm biến.
 *  - Còn lại (alpha TƯƠNG ĐỐI, tính từ lúc mở trang — Chrome từ bản 50) → null: đọc vào là lệch tuỳ ý so với Bắc. */
export function nguonSuKien(loai: string, e: SuKienTho, daThayTuyetDoi: boolean): "ios" | "tuyet_doi" | null {
  if (typeof e.webkitCompassHeading === "number" && Number.isFinite(e.webkitCompassHeading)) return "ios";
  if (loai === "deviceorientationabsolute") return "tuyet_doi";
  if (loai === "deviceorientation" && e.absolute === true && !daThayTuyetDoi) return "tuyet_doi";
  return null;
}

/** Sai số iOS "xấu nhất" đã thấy trong một lần đo: âm (chưa hiệu chỉnh) xấu hơn mọi số dương; còn lại lấy số lớn hơn. */
export function saiSoXauNhat(cu: number | null, moi: number | null): number | null {
  if (moi == null) return cu;
  if (cu == null) return moi;
  if (cu < 0 || moi < 0) return -1;
  return Math.max(cu, moi);
}

/** Trung bình vòng của vài mẫu gần nhất — CHỈ để kim đỡ giật lúc ngắm (không phải số được chốt). Rỗng → null. */
export function kimMuot(mau: readonly number[]): number | null {
  if (!mau.length) return null;
  let s = 0, c = 0;
  for (const d of mau) { s += Math.sin(d * RAD); c += Math.cos(d * RAD); }
  if (Math.hypot(s, c) < 1e-9) return chuanDo(mau[mau.length - 1]!);   // các mẫu triệt tiêu nhau: lấy mẫu mới nhất
  return chuanDo(Math.atan2(s, c) / RAD);
}

/** Góc quay "không gói" cho CSS: đi từ góc đang vẽ `truoc` (có thể > 360 hay âm) tới `dich` theo đường ngắn nhất —
 *  359° → 0° quay 1°, không quay ngược cả vòng. */
export function gocLienTuc(truoc: number, dich: number): number {
  return truoc + hieuGoc(dich, truoc);
}

/** Nhóm số mẫu để đo lường (không gửi con số thật). */
export function nhomSoMau(n: number): "it" | "vua" | "nhieu" {
  return n < 20 ? "it" : n < 80 ? "vua" : "nhieu";
}
