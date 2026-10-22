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
