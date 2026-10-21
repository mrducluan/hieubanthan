"use client";
// KC-2 — "Hồ sơ nhà" lưu TRÊN MÁY (localStorage), như hồ sơ người (lib/hoso.ts): hướng cửa / ban công, năm xây, người cùng ở,
// bố cục đã khai. Mọi khối Phong thuỷ (Nhà của bạn, Khảo sát nhà, Huyền Không, Đo hướng) đọc – ghi chung; thẻ "Tháng này
// nhà bạn" ở Hôm nay đọc từ đây. Không gửi máy chủ trừ lúc gọi engine tính; đồng bộ tài khoản là TUỲ CHỌN (lib/tai-khoan-nha.ts,
// migration 0018) khi người dùng tự bấm "Lưu nhà vào tài khoản".
import { useSyncExternalStore } from "react";
import { z } from "zod";

export const KHOA_HO_SO_NHA = "hbt.nha.v1";
const HUONG8 = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"] as const;

export const ThanhVienNha = z.object({
  vai: z.enum(["vo", "chong", "con", "cha_me", "khac"]),
  nam: z.number().int().min(1900).max(2100),
  gioi_tinh: z.enum(["nam", "nu"]),
});
export const HoSoNha = z.object({
  v: z.literal(1),
  /** Tên gọi tuỳ ý để phân biệt (vd "Nhà đang ở", "Căn định mua") — không bắt buộc, ≤ 40 ký tự. */
  ten_goi: z.string().trim().max(40).optional(),
  huong_do: z.number().min(0).lt(360).optional(),
  huong: z.enum(HUONG8).optional(),
  theo: z.enum(["cua", "ban_cong"]).default("cua"),
  nam_xay: z.number().int().min(1864).max(2150).optional(),
  toa: z.string().max(10).optional(),
  thanh_vien: z.array(ThanhVienNha).max(6).default([]),
  /** Bố cục đã khai ở Khảo sát nhà (schema BoCuc 0.1 của engine) — giữ nguyên để gửi lại. */
  bo_cuc: z.object({
    vi_tri: z.record(z.string().max(30), z.string().max(12)).optional(),
    huong_do: z.record(z.string().max(30), z.number().min(0).lt(360)).optional(),
    dau_hieu: z.array(z.string().max(40)).optional(),
  }).optional(),
  cap_nhat_luc: z.string(),
});
export type HoSoNha = z.infer<typeof HoSoNha>;
export type HoSoNhaVao = Partial<Omit<HoSoNha, "v" | "cap_nhat_luc">>;

const nghe = new Set<() => void>();
let daDoc = false;
let hienTai: HoSoNha | null = null;

function doc(): HoSoNha | null {
  if (typeof window === "undefined") return null;
  if (!daDoc) {
    daDoc = true;
    try {
      const raw = window.localStorage.getItem(KHOA_HO_SO_NHA);
      const kq = raw ? HoSoNha.safeParse(JSON.parse(raw)) : null;
      hienTai = kq?.success ? kq.data : null;
    } catch { hienTai = null; }
  }
  return hienTai;
}
function bao() { nghe.forEach((f) => f()); }

/** Ghi đè / gộp vào hồ sơ nhà hiện có (gộp nông theo trường; `bo_cuc` thay cả khối). */
export function luuHoSoNha(them: HoSoNhaVao): HoSoNha {
  const cu = doc();
  const moi = HoSoNha.parse({ ...(cu ?? { v: 1, theo: "cua", thanh_vien: [] }), ...them, v: 1, cap_nhat_luc: new Date().toISOString() });
  hienTai = moi; daDoc = true;
  try { window.localStorage.setItem(KHOA_HO_SO_NHA, JSON.stringify(moi)); } catch { /* chế độ riêng tư */ }
  bao();
  return moi;
}
export function xoaHoSoNha(): void {
  hienTai = null; daDoc = true;
  try { window.localStorage.removeItem(KHOA_HO_SO_NHA); } catch { /* bỏ qua */ }
  bao();
}
function dangKy(f: () => void) {
  nghe.add(f);
  const onStorage = (e: StorageEvent) => { if (e.key === KHOA_HO_SO_NHA) { daDoc = false; f(); } };
  window.addEventListener("storage", onStorage);
  return () => { nghe.delete(f); window.removeEventListener("storage", onStorage); };
}
/** `undefined` = đang hydrate · `null` = chưa có nhà. */
export function useHoSoNha(): HoSoNha | null | undefined {
  return useSyncExternalStore(dangKy, doc, () => undefined);
}
/** Đầu vào `nha` cho /api/phongthuy/luan-giai và /api/phongthuy/thang-nay từ hồ sơ nhà (null nếu chưa có hướng). */
export function nhaTuHoSo(n: HoSoNha | null | undefined): { huong_do?: number; huong?: string; nam_xay?: number; toa?: string; theo: "cua" | "ban_cong" } | null {
  if (!n || (n.huong_do == null && !n.huong)) return null;
  return { ...(n.huong_do != null ? { huong_do: n.huong_do } : { huong: n.huong }), ...(n.nam_xay ? { nam_xay: n.nam_xay } : {}), ...(n.toa ? { toa: n.toa } : {}), theo: n.theo };
}
export function tenNha(n: HoSoNha | null | undefined): string {
  if (!n) return "nhà của bạn";
  return n.ten_goi || (n.huong_do != null ? `nhà hướng ${n.huong_do}°` : n.huong ? `nhà hướng ${n.huong}` : "nhà của bạn");
}
