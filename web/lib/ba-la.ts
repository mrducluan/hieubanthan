// BT-UI — "Ba lá của ngày" (thay Lá bài đầu ngày): Lá Tarot · Lá Con số · Lá Thời khắc. Engine chọn và soạn cả ba
// (luangiai/ba_la_ngay.py — tất định theo hồ sơ + ngày, không random, miễn phí, không giải thưởng); web chỉ lật, nhớ lá
// đã lật trên máy (hbt.ba_la.v1) và CHỌN "giờ tốt sắp tới" trong danh sách engine trả theo đồng hồ máy. Hàm thuần để
// trang + e2e dùng chung.
import type { LaGon } from "@/lib/tarot-chung";

export type MaBaLa = "tarot" | "so" | "thoi_khac";
export const THU_TU_BA_LA: MaBaLa[] = ["tarot", "so", "thoi_khac"];
export const TEN_BA_LA: Record<MaBaLa, string> = { tarot: "Lá Tarot", so: "Lá Con số", thoi_khac: "Lá Thời khắc" };

export interface GioTot { chi: string; khung: string; than: string; tu: number; den: number }
export interface BaLa {
  tarot: LaGon & { tu_khoa: string[]; y: string; viec: string; cau_tu_soi: string; duong: string | null };
  so: { so: number; nghia: string; viec: { ma: string; ten: string; nhan: string | null; cach_lam: string; tu_soi: string | null } | null; cau_hoi: string | null };
  thoi_khac: { gio: GioTot[]; hoang_dao: boolean; nen: string[]; kieng: string[]; que: { so: number; ten: string; y: string | null; duong: string | null } | null };
  /** Lá Tarot riêng có được lên thẻ chia sẻ / lời nhắn soạn sẵn không (engine: phép băm có muối bí mật). Thiếu = không. */
  chia_se_tarot?: boolean;
  cau_cua_ngay: string;
  cach_chon: string;
}

/** Giờ hoàng đạo đang diễn ra hoặc sắp tới (theo phút trong ngày của đồng hồ máy); hết giờ tốt trong ngày → null. */
export function gioSapToi(gio: GioTot[], phut: number): { gio: GioTot; dang: boolean; conPhut: number } | null {
  for (const g of [...gio].sort((a, b) => a.tu - b.tu)) {
    if (phut >= g.tu && phut < g.den) return { gio: g, dang: true, conPhut: g.den - phut };
    if (phut < g.tu) return { gio: g, dang: false, conPhut: g.tu - phut };
  }
  return null;
}

/** "còn 2 giờ 15 phút" / "còn 40 phút". */
export function chuConPhut(p: number): string {
  const h = Math.floor(p / 60), m = p % 60;
  return h > 0 ? `${h} giờ${m ? ` ${m} phút` : ""}` : `${m} phút`;
}

/** Ngày hôm nay theo đồng hồ máy (yyyy-mm-dd) — cùng cách trang Hôm nay xin thẻ. */
export function ngayMayIso(): string {
  try { return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
  catch { return new Date().toISOString().slice(0, 10); }
}
/** Phút trong ngày theo đồng hồ máy; trang mở qua nửa đêm (ngày máy ≠ ngày của thẻ) → null: không gán giờ tốt hôm qua cho hôm nay. */
export function phutCuaNgay(ngayThe: string): number | null {
  if (ngayMayIso() !== ngayThe) return null;
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export const KHOA_BA_LA = "hbt.ba_la.v1";
/** Các lá đã lật của đúng ngày này (chỉ trên máy), theo thứ tự lật. */
export function baLaDaLat(ngay: string): MaBaLa[] {
  try {
    const j = JSON.parse(localStorage.getItem(KHOA_BA_LA) ?? "null") as { ngay?: string; lat?: unknown } | null;
    if (!j || j.ngay !== ngay || !Array.isArray(j.lat)) return [];
    return [...new Set(j.lat.filter((x): x is MaBaLa => THU_TU_BA_LA.includes(x as MaBaLa)))];
  } catch { return []; }
}
export function nhoBaLa(ngay: string, lat: MaBaLa[]): void {
  try { localStorage.setItem(KHOA_BA_LA, JSON.stringify({ ngay, lat })); } catch { /* chế độ riêng tư */ }
}

/** Nhật ký tháng (lib/nhat-ky-ngay + diem_danh 0032) chỉ nhận ba mã lá cũ → ghi theo mã tương ứng, không cần migration:
 *  ngày có lật ít nhất một lá = một "ngày lật lá" trong tổng kết tháng. */
export const MA_NHAT_KY: Record<MaBaLa, "viec" | "cau_hoi" | "gio"> = { so: "viec", tarot: "cau_hoi", thoi_khac: "gio" };
