// CTA-2 — cấu hình "Lối đi tiếp cuối trang": kiểu dữ liệu + bộ lọc dùng chung (CMS global `loi-di-tiep`, tab "Lối đi tiếp"
// của Trang website, bộ mặc định trong code). Không import gì ngoài JSON → dùng được ở mọi nơi (máy chủ, test).
// Web LỌC LẠI mọi thẻ từ CMS: đường dẫn trong site, chữ thuần cắt độ dài, chip / hình thuộc danh mục cố định.
import MAC_DINH from "@/lib/loi-di-tiep-mac-dinh.json";

export type KieuHinh = "than-so" | "tu-vi" | "kinh-dich" | "bat-tu" | "phong-thuy";
export type MaNhan = "kien_thuc" | "cong_cu" | "thu_vien";
export type TheTho = { duong: string; ten: string; mo_ta: string; nhan: MaNhan; hinh: KieuHinh };
export type CauHinhLoiDi = {
  bat: boolean; cum_truoc: boolean; tu_xep: boolean;
  /** khoá = trang trụ ("/tu-vi"…) hoặc "chung" */ nhom: Record<string, TheTho[]>;
};

export const NHAN: Record<MaNhan, "Kiến thức" | "Công cụ" | "Thư viện"> = { kien_thuc: "Kiến thức", cong_cu: "Công cụ", thu_vien: "Thư viện" };
const HINH = new Set<KieuHinh>(["than-so", "tu-vi", "kinh-dich", "bat-tu", "phong-thuy"]);
const TRONG_SITE = /^\/(?![/\\])[^\s\\<>"']*$/;
const chu = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");

/** Một thẻ thô (CMS / JSON) → thẻ sạch, hoặc null nếu thiếu / sai. */
export function locThe(x: unknown): TheTho | null {
  if (!x || typeof x !== "object") return null;
  const o = x as Record<string, unknown>;
  const duong = chu(o.duong, 120), ten = chu(o.ten, 60), mo_ta = chu(o.mo_ta, 180);
  if (!TRONG_SITE.test(duong) || !ten || !mo_ta) return null;
  const nhan = (["kien_thuc", "cong_cu", "thu_vien"] as const).find((k) => k === o.nhan) ?? "kien_thuc";
  const hinh = HINH.has(o.hinh as KieuHinh) ? (o.hinh as KieuHinh) : "than-so";
  return { duong, ten, mo_ta, nhan, hinh };
}
export const locDsThe = (ds: unknown, toiDa = 8): TheTho[] =>
  (Array.isArray(ds) ? ds : []).map(locThe).filter((t): t is TheTho => t !== null).slice(0, toiDa);

function nhomTu(ds: unknown): Record<string, TheTho[]> {
  const ra: Record<string, TheTho[]> = {};
  for (const n of Array.isArray(ds) ? ds : []) {
    const tru = (n as { tru?: unknown })?.tru;
    if (typeof tru !== "string" || !(tru === "chung" || /^\/[a-z-]+$/.test(tru)) || ra[tru]) continue;
    ra[tru] = locDsThe((n as { the?: unknown }).the);
  }
  return ra;
}

export const CAU_HINH_MAC_DINH: CauHinhLoiDi = { bat: true, cum_truoc: true, tu_xep: false, nhom: nhomTu(MAC_DINH.nhom) };

/** Global CMS thô → cấu hình. CMS lỗi / trống → mặc định code. Nhóm có trong CMS thì thay HẲN nhóm đó (kể cả rỗng). */
export function cauHinhTuCms(g: unknown): CauHinhLoiDi {
  if (!g || typeof g !== "object") return CAU_HINH_MAC_DINH;
  const o = g as Record<string, unknown>;
  const nhomCms = Array.isArray(o.nhom) && o.nhom.length ? nhomTu(o.nhom) : null;
  return {
    bat: o.bat !== false, cum_truoc: o.cum_truoc !== false, tu_xep: o.tu_xep === true,
    nhom: nhomCms ?? CAU_HINH_MAC_DINH.nhom,
  };
}
