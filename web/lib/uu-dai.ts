// UD-1 — "Ưu đãi có hạn" cho Luận giải toàn bộ (docs/UU-DAI-CO-HAN.md). Hàm THUẦN (không I/O) để máy chủ, giao diện và
// e2e dùng chung. Nguyên tắc: mọi con số người dùng thấy đều THẬT —
//   · giá gạch = giá thường đang áp dụng ngay trước và ngay sau đợt ưu đãi (không có "giá gốc" tự đặt);
//   · đồng hồ đếm tới đúng hạn chót chủ dự án đặt, hết hạn thì giá về giá thường (không tự gia hạn, không đếm lại mỗi người);
//   · "còn N suất" = số suất đặt − số lượt đã mở bằng giá ưu đãi đếm trong sổ Sao (hết suất thì ưu đãi dừng).
// Thiếu hạn chót / hết hạn / hết suất / mức giảm 0 → không có ưu đãi (null) và giao diện không hiện gì.

export type CauHinhUuDai = { bat: boolean; ten: string; giamPt: number; hetHan: string; soSuat: number; ma: string };

export type UuDai = {
  ten: string; ma: string;
  /** Giá đang áp dụng (Sao). */ gia: number;
  /** Giá thường (Sao) — con số bị gạch. */ gia_goc: number;
  /** Phần trăm giảm THỰC sau làm tròn giá. */ giam_pt: number;
  tiet_kiem: number;
  /** Hạn chót, ISO 8601 (cuối ngày theo giờ Việt Nam). */ het_luc: string;
  /** null = đợt này không giới hạn suất (hoặc chưa đếm được) → không hiện dòng suất. */
  con_suat: number | null; tong_suat: number | null;
};

/** Mức giảm tối đa. Giữ ≤ 50 % (trần giảm giá khuyến mại thông thường theo NĐ 81/2018). */
export const GIAM_TOI_DA = 50;
export const MA_HOP_LE = /^[a-z0-9]{2,12}$/;

/** "YYYY-MM-DD" → mốc cuối ngày đó theo giờ Việt Nam (ms). Sai định dạng / ngày không có thật → null. */
export function hetLuc(hetHan: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(hetHan.trim());
  if (!m) return null;
  const t = Date.parse(`${m[1]}-${m[2]}-${m[3]}T23:59:59+07:00`);
  if (!Number.isFinite(t)) return null;
  // Date.parse nhận "02-31" ở vài máy → kiểm lại ngày có thật.
  const d = new Date(t + 7 * 3600_000);
  return d.getUTCDate() === Number(m[3]) && d.getUTCMonth() + 1 === Number(m[2]) ? t : null;
}

/** Ghi chú trong sổ Sao của lượt mở bằng giá ưu đãi — cũng là dấu để đếm suất đã dùng. */
export const dauGhiChu = (ma: string) => ` · ưu đãi ${ma}`;

/** `daDung`: số lượt đã mở bằng giá ưu đãi của đợt `ma` (null = không đếm được). */
export function tinhUuDai(c: CauHinhUuDai, giaGoc: number, daDung: number | null, now: number = Date.now()): UuDai | null {
  if (!c.bat || !(giaGoc > 1)) return null;
  const pt = Math.min(GIAM_TOI_DA, Math.floor(c.giamPt));
  if (!(pt > 0)) return null;
  const het = hetLuc(c.hetHan);
  if (het === null || now > het) return null;
  const gia = Math.max(1, Math.round((giaGoc * (100 - pt)) / 100));
  if (gia >= giaGoc) return null;
  let con: number | null = null, tong: number | null = null;
  if (c.soSuat > 0 && MA_HOP_LE.test(c.ma) && daDung !== null) {
    tong = c.soSuat; con = Math.max(0, c.soSuat - daDung);
    if (con <= 0) return null;
  }
  return {
    ten: c.ten.trim() || "Ưu đãi có hạn", ma: MA_HOP_LE.test(c.ma) ? c.ma : "", gia, gia_goc: giaGoc,
    giam_pt: Math.round(((giaGoc - gia) / giaGoc) * 100), tiet_kiem: giaGoc - gia,
    het_luc: new Date(het).toISOString(), con_suat: con, tong_suat: tong,
  };
}

/** Thời gian còn lại → các ô của đồng hồ. Hết giờ → null. */
export function conLai(hetLucIso: string, now: number = Date.now()): { ngay: number; gio: number; phut: number; giay: number } | null {
  const ms = Date.parse(hetLucIso) - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return { ngay: Math.floor(s / 86400), gio: Math.floor((s % 86400) / 3600), phut: Math.floor((s % 3600) / 60), giay: s % 60 };
}

/** Dòng chữ nhỏ dưới giá: "Tiết kiệm 30 Sao (giảm 30%)". */
export const loiTietKiem = (u: Pick<UuDai, "tiet_kiem" | "giam_pt">) => `Tiết kiệm ${u.tiet_kiem} Sao (giảm ${u.giam_pt}%)`;

/** "hết 23:59 ngày 30/11". */
export function loiHan(hetLucIso: string): string {
  const d = new Date(Date.parse(hetLucIso) + 7 * 3600_000);
  return `hết 23:59 ngày ${d.getUTCDate()}/${d.getUTCMonth() + 1}`;
}
