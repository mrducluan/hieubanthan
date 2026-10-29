// KV-THANG "Tháng của tôi" (docs/DE-XUAT-CO-CHE-V2.md) — nhật ký ngày ghé TRÊN MÁY: mỗi ngày mở Hôm nay ghi một dòng
// {ngày, số ngày cá nhân engine trả, tháng cá nhân, mã lá đã lật}. Từ đó dựng lịch ghé tháng này, tổng kết tháng trước và
// huy hiệu "Đủ 9 nhịp" mà không gọi engine thêm, không cần tài khoản. Khoá theo BĂM HỒ SƠ (ngày sinh + tên, chỉ trên máy):
// đổi hồ sơ trên cùng máy → nhật ký khác, không thừa kế của người trước. Tài khoản: máy chủ ghi lượt ghé thật trong
// diem_danh() (migration 0032) — KHÔNG đổ nhật ký máy lên máy chủ (tự khai, không kiểm chứng được).
// Hàm thuần (không React) để trang + e2e dùng chung. ≤ 400 dòng (~10 KB).
export const KHOA_NHAT_KY = "hbt.nhat_ky.v1";
export const TOI_DA_DONG = 400;
export const MA_LA = ["viec", "cau_hoi", "gio"] as const;

/** Một ngày ghé: n = yyyy-mm-dd (ngày xem engine trả, giờ VN), s = số ngày cá nhân 1–9, k = tháng cá nhân 1–9, l = lá đã lật. */
export interface MucNhatKy { n: string; s: number; k?: number; l?: string }
interface Kho { h: string; ds: MucNhatKy[] }

/** Băm hồ sơ (FNV-1a, chỉ để tách nhật ký giữa hai hồ sơ trên cùng máy — không gửi đi, không phải bảo mật). */
export function maHoSo(h: { ngay: number; thang: number; nam: number; ho_ten: string }): string {
  const s = `${h.ngay}-${h.thang}-${h.nam}|${h.ho_ten.trim().toLowerCase()}`;
  let x = 2166136261;
  for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619); }
  return (x >>> 0).toString(16).padStart(8, "0");
}

const NGAY = /^\d{4}-\d{2}-\d{2}$/;
function hopLe(m: unknown): m is MucNhatKy {
  if (!m || typeof m !== "object") return false;
  const x = m as Record<string, unknown>;
  return typeof x.n === "string" && NGAY.test(x.n) && typeof x.s === "number" && x.s >= 1 && x.s <= 9
    && (x.k === undefined || (typeof x.k === "number" && x.k >= 1 && x.k <= 9))
    && (x.l === undefined || (typeof x.l === "string" && (MA_LA as readonly string[]).includes(x.l)));
}

function docKho(): Kho | null {
  try {
    const j = JSON.parse(localStorage.getItem(KHOA_NHAT_KY) ?? "null") as Partial<Kho> | null;
    return j && typeof j.h === "string" && Array.isArray(j.ds) ? { h: j.h, ds: j.ds.filter(hopLe) } : null;
  } catch { return null; }
}
function ghiKho(k: Kho): void {
  try { localStorage.setItem(KHOA_NHAT_KY, JSON.stringify(k)); } catch { /* chế độ riêng tư: bỏ qua */ }
}

/** Nhật ký của đúng hồ sơ này (băm khớp), sắp theo ngày tăng dần. Hồ sơ khác → rỗng. */
export function docNhatKy(hoSo: Parameters<typeof maHoSo>[0]): MucNhatKy[] {
  const k = docKho();
  if (!k || k.h !== maHoSo(hoSo)) return [];
  return [...k.ds].sort((a, b) => (a.n < b.n ? -1 : a.n > b.n ? 1 : 0));
}

function capNhat(hoSo: Parameters<typeof maHoSo>[0], ngay: string, sua: (cu: MucNhatKy | undefined) => MucNhatKy | null): MucNhatKy[] {
  if (!NGAY.test(ngay)) return docNhatKy(hoSo);
  const h = maHoSo(hoSo);
  const kho = docKho();
  const ds = kho && kho.h === h ? kho.ds : [];   // hồ sơ khác → bắt đầu nhật ký mới (của người này)
  const cu = ds.find((m) => m.n === ngay);
  const moi = sua(cu);
  if (!moi) return ds;
  const khac = ds.filter((m) => m.n !== ngay);
  khac.push(moi);
  khac.sort((a, b) => (a.n < b.n ? -1 : a.n > b.n ? 1 : 0));
  const cat = khac.length > TOI_DA_DONG ? khac.slice(khac.length - TOI_DA_DONG) : khac;
  ghiKho({ h, ds: cat });
  return cat;
}

/** Ghi lượt ghé hôm nay (số ngày cá nhân + tháng cá nhân do engine trả). Gọi lại trong ngày chỉ cập nhật, không thêm dòng. */
export function ghiGhe(hoSo: Parameters<typeof maHoSo>[0], ngay: string, so: number, thangCaNhan?: number | null): MucNhatKy[] {
  if (!(so >= 1 && so <= 9)) return docNhatKy(hoSo);
  const k = thangCaNhan && thangCaNhan >= 1 && thangCaNhan <= 9 ? thangCaNhan : undefined;
  return capNhat(hoSo, ngay, (cu) => ({ ...(cu ?? {}), n: ngay, s: so, ...(k ? { k } : {}) }));
}

/** Ghi lá đã lật của ngày (chỉ khi ngày đó đã có dòng ghé). */
export function ghiLa(hoSo: Parameters<typeof maHoSo>[0], ngay: string, la: string): MucNhatKy[] {
  if (!(MA_LA as readonly string[]).includes(la)) return docNhatKy(hoSo);
  return capNhat(hoSo, ngay, (cu) => (cu ? { ...cu, l: la } : null));
}

/** Tháng trước của một ngày yyyy-mm-dd. */
export function thangTruoc(ngay: string): { nam: number; thang: number } {
  const [y, m] = ngay.split("-").map(Number) as [number, number];
  return m === 1 ? { nam: y - 1, thang: 12 } : { nam: y, thang: m - 1 };
}

/** Thống kê một tháng từ nhật ký (máy hoặc máy chủ): số ngày ghé, ngày (1–31) đã ghé, số lá đã lật, số nhịp khác nhau
 *  (số ngày cá nhân 1–9 đã đi qua), đủ 9 nhịp chưa, tháng cá nhân (dòng gần nhất có k). */
export interface ThongKeThang {
  nam: number; thang: number; so_ngay: number; ngay: number[]; so_la: number; so_khac: number; du_9: boolean; thang_ca_nhan: number | null;
}
export function thongKeThang(ds: MucNhatKy[], nam: number, thang: number): ThongKeThang {
  const tien = `${nam}-${String(thang).padStart(2, "0")}-`;
  const trong = ds.filter((m) => m.n.startsWith(tien));
  const ngay = [...new Set(trong.map((m) => Number(m.n.slice(8, 10))))].filter((d) => d >= 1 && d <= 31).sort((a, b) => a - b);
  const khac = new Set(trong.map((m) => m.s));
  const k = [...trong].reverse().find((m) => typeof m.k === "number")?.k ?? null;
  return { nam, thang, so_ngay: ngay.length, ngay, so_la: trong.filter((m) => m.l).length, so_khac: khac.size, du_9: khac.size >= 9, thang_ca_nhan: k };
}

/** Tháng đầu tiên (yyyy-mm) trong nhật ký có đủ 9 nhịp — để cấp huy hiệu máy "du_9_nhip" một lần. null = chưa. */
export function thangDu9(ds: MucNhatKy[]): { nam: number; thang: number; ngay_cuoi: string } | null {
  const theoThang = new Map<string, Set<number>>();
  const cuoi = new Map<string, string>();
  for (const m of ds) {
    const t = m.n.slice(0, 7);
    if (!theoThang.has(t)) theoThang.set(t, new Set());
    theoThang.get(t)!.add(m.s);
    if (!cuoi.has(t) || cuoi.get(t)! < m.n) cuoi.set(t, m.n);
  }
  for (const [t, s] of [...theoThang.entries()].sort()) {
    if (s.size >= 9) { const [y, mo] = t.split("-").map(Number) as [number, number]; return { nam: y, thang: mo, ngay_cuoi: cuoi.get(t)! }; }
  }
  return null;
}

/** Xoá nhật ký (khi xoá hồ sơ trên máy — ĐY-1 thu hồi đồng ý). */
export function xoaNhatKy(): void {
  try { localStorage.removeItem(KHOA_NHAT_KY); } catch { /* bỏ qua */ }
}
