// Ý1 (0035) — dòng ho_so (service role, chỉ cột lá số) → đầu vào lá số cho engine /v1/push/thang-hai-la-so. CHỈ định dạng
// lại (web không tính gì): thiếu giờ / giới tính / nơi sinh, hoặc "không biết giờ" → null (không đọc theo giờ tạm). Không
// mang tên, email, user_id. Tách khỏi lib/tai-khoan.ts ("use client") để chạy được trong route cron (máy chủ).
import { NUOC_NGOAI } from "@/lib/hoso";

export interface HangLaSo {
  ngay_sinh: string; gio_sinh: string | null; gioi_tinh: "nam" | "nu" | null; vung: "north" | "south" | null;
  noi_sinh?: string | null; gio_mua_he?: boolean | null; do_tin_gio?: "exact" | "approx" | "unknown" | null;
  utc_noi_sinh?: number | string | null;
}
export interface LaSoPush {
  birth_date: string; birth_time: string; gender: "nam" | "nu"; noi_sinh: string;
  vung?: "north" | "south"; gio_mua_he?: boolean; utc_noi_sinh?: number; do_tin_gio?: "exact" | "approx";
}

export function laSoTuHangHoSo(h: HangLaSo | undefined): LaSoPush | null {
  if (!h || !h.gio_sinh || !h.gioi_tinh || !h.noi_sinh || h.do_tin_gio === "unknown") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(h.ngay_sinh) || !/^\d{2}:\d{2}/.test(h.gio_sinh)) return null;
  const nuocNgoai = h.noi_sinh === NUOC_NGOAI;
  const utc = typeof h.utc_noi_sinh === "string" && h.utc_noi_sinh.trim() !== "" ? Number(h.utc_noi_sinh) : h.utc_noi_sinh;
  return {
    birth_date: h.ngay_sinh, birth_time: h.gio_sinh.slice(0, 5), gender: h.gioi_tinh, noi_sinh: h.noi_sinh,
    ...(!nuocNgoai && h.vung && h.ngay_sinh < "1975-06-13" ? { vung: h.vung } : {}),
    ...(nuocNgoai && h.gio_mua_he ? { gio_mua_he: true } : {}),
    ...(nuocNgoai && typeof utc === "number" && Number.isFinite(utc) && utc >= -12 && utc <= 14 && Number.isInteger(utc * 4) ? { utc_noi_sinh: utc } : {}),
    ...(h.do_tin_gio === "exact" || h.do_tin_gio === "approx" ? { do_tin_gio: h.do_tin_gio } : {}),
  };
}
