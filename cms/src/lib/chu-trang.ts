// ND-7 — "Chữ trên trang" phía CMS: lọc ô `chu` trước khi lưu theo bảng chữ của URL (mac_dinh.chu, do sổ trang của web
// gửi). Chỉ giữ khoá có trong bảng, chữ thuần (bỏ thẻ HTML), cắt theo giới hạn, bỏ ô trống / trùng chữ gốc. Web lọc lại
// lần nữa khi đọc (web/lib/chu-trang.ts locChu) — hai lớp, cùng luật.

export type MucChuCms = { nhan?: string; mac_dinh?: string; toi_da?: number; nhom?: string };
export type BangChuCms = Record<string, MucChuCms>;

const KHOA = /^[a-z0-9_]+(\.[a-z0-9_]+)*$/;
export const TOI_DA_CHU = 300;

export const bangCua = (macDinh: unknown): BangChuCms => {
  const chu = (macDinh && typeof macDinh === "object" ? (macDinh as { chu?: unknown }).chu : null);
  return chu && typeof chu === "object" && !Array.isArray(chu) ? (chu as BangChuCms) : {};
};

/** Ô `chu` sau khi lọc; không còn gì → null (cột jsonb để trống). */
export function locChuCms(bang: BangChuCms, chu: unknown): Record<string, string> | null {
  if (!chu || typeof chu !== "object" || Array.isArray(chu)) return null;
  const ra: Record<string, string> = {};
  for (const [k, v] of Object.entries(chu as Record<string, unknown>)) {
    const m = bang[k];
    if (!m || !KHOA.test(k) || typeof v !== "string") continue;
    const s = v.replace(/<[^>]*>/g, "").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, " ").trim().slice(0, m.toi_da ?? TOI_DA_CHU).trim();
    if (s && s !== m.mac_dinh) ra[k] = s;
  }
  return Object.keys(ra).length ? ra : null;
}

/** Chữ biên tập viên đã gõ (để kiểm định ranh giới chung). */
export const chuDaSua = (chu: unknown): string[] =>
  chu && typeof chu === "object" && !Array.isArray(chu) ? Object.values(chu as Record<string, unknown>).filter((v): v is string => typeof v === "string") : [];

// ---------------------------------------------------------------- ND-7 đợt 2: "Hình trên trang"
export type MucHinhCms = { nhan?: string; mac_dinh?: string; goi_y?: string; nhom?: string };
export type AnhChup = { id: number | string; url: string; alt: string; width?: number | null; height?: number | null;
  sizes?: Record<string, { url?: string | null; width?: number | null; height?: number | null }> };

export const bangHinhCua = (macDinh: unknown): Record<string, MucHinhCms> => {
  const h = (macDinh && typeof macDinh === "object" ? (macDinh as { hinh?: unknown }).hinh : null);
  return h && typeof h === "object" && !Array.isArray(h) ? (h as Record<string, MucHinhCms>) : {};
};

/** Mã ảnh trong ô `hinh`: giao diện lưu số id; bản đã chụp lưu { id, url… }. */
export const maAnh = (v: unknown): number | string | null => {
  if (typeof v === "number" || (typeof v === "string" && /^\d{1,12}$/.test(v))) return v;
  const id = v && typeof v === "object" ? (v as { id?: unknown }).id : null;
  return typeof id === "number" || (typeof id === "string" && /^\d{1,12}$/.test(id)) ? id : null;
};

/** Ô `hinh` sau khi lọc: chỉ khoá có trong bảng hình; mỗi ảnh chụp lại từ Thư viện ảnh (url, alt, kích thước, các cỡ) để
 *  web đọc không cần gọi thêm. Ảnh không còn trong thư viện → bỏ (web về hình gốc). */
export async function chupHinh(bang: Record<string, MucHinhCms>, hinh: unknown,
  timAnh: (id: number | string) => Promise<Record<string, unknown> | null>): Promise<Record<string, AnhChup> | null> {
  if (!hinh || typeof hinh !== "object" || Array.isArray(hinh)) return null;
  const ra: Record<string, AnhChup> = {};
  for (const [k, v] of Object.entries(hinh as Record<string, unknown>)) {
    const id = maAnh(v);
    if (!bang[k] || id === null) continue;
    const m = await timAnh(id);
    if (!m || typeof m.url !== "string") continue;
    const sizes: AnhChup["sizes"] = {};
    for (const [c, s] of Object.entries((m.sizes ?? {}) as Record<string, { url?: string | null; width?: number | null; height?: number | null }>)) {
      if (s?.url) sizes[c] = { url: s.url, width: s.width ?? null, height: s.height ?? null };
    }
    ra[k] = { id: m.id as number | string, url: m.url, alt: String(m.alt ?? ""), width: (m.width as number) ?? null, height: (m.height as number) ?? null, sizes };
  }
  return Object.keys(ra).length ? ra : null;
}
