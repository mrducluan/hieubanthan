"use client";
// Lựa chọn chỉ tay của người dùng — CHỈ MÃ, nhớ trên máy (localStorage `hbt.chi_tay.v1`): hình vân tự chọn (thư viện 67 hình),
// lựa chọn tự quan sát từng cung trên ảnh tay (CT-2: "gò nổi đầy", "trũng"…), tay đang xem. Không bao giờ lưu ảnh hay toạ độ.
// Dùng chung giữa khối chụp ảnh đầu trang (ChupBanTay) và khối chọn vân (ChonVanTay) — hai khối nằm cách nhau trên trang nên
// trạng thái đi qua kho nhỏ này (useSyncExternalStore), không qua props.
// Bản cũ lưu MẢNG mã vân → đọc được như `{ van }` (tương thích).
import { useSyncExternalStore } from "react";
import { KHOA_CHI_TAY } from "@/lib/chi-tay";

export type Tay = "trai" | "phai";
export interface ChonChiTay { van: string[]; cung: Record<string, string>; duong: Record<string, string>; tay: Tay | null }

const RONG: ChonChiTay = { van: [], cung: {}, duong: {}, tay: null };
const MA = /^[a-z_]{2,20}$/;
const MA_VAN = /^[a-z0-9-]{2,40}$/;
const nghe = new Set<() => void>();
let daDoc = false;
let hienTai: ChonChiTay = RONG;

function docKho(): ChonChiTay {
  try {
    const v: unknown = JSON.parse(localStorage.getItem(KHOA_CHI_TAY) ?? "null");
    if (Array.isArray(v)) return { ...RONG, van: v.filter((x): x is string => typeof x === "string" && MA_VAN.test(x)).slice(0, 30) };
    if (!v || typeof v !== "object") return RONG;
    const o = v as Partial<Record<keyof ChonChiTay, unknown>>;
    const van = Array.isArray(o.van) ? o.van.filter((x): x is string => typeof x === "string" && MA_VAN.test(x)).slice(0, 30) : [];
    const ma = (x: unknown, toiDa: number) => {
      const ra: Record<string, string> = {};
      if (x && typeof x === "object") {
        for (const [k, gt] of Object.entries(x as Record<string, unknown>).slice(0, toiDa)) if (MA.test(k) && typeof gt === "string" && MA.test(gt)) ra[k] = gt;
      }
      return ra;
    };
    return { van, cung: ma(o.cung, 12), duong: ma(o.duong, 8), tay: o.tay === "trai" || o.tay === "phai" ? o.tay : null };
  } catch { return RONG; }
}

function doc(): ChonChiTay {
  if (typeof window === "undefined") return RONG;
  if (!daDoc) { daDoc = true; hienTai = docKho(); }
  return hienTai;
}

function ghiKho(moi: ChonChiTay): void {
  hienTai = moi; daDoc = true;
  try {
    if (!moi.van.length && !Object.keys(moi.cung).length && !Object.keys(moi.duong).length && !moi.tay) localStorage.removeItem(KHOA_CHI_TAY);
    else localStorage.setItem(KHOA_CHI_TAY, JSON.stringify({ v: 2, ...moi }));
  } catch { /* chế độ riêng tư */ }
  nghe.forEach((f) => f());
}

function dangKy(f: () => void) {
  nghe.add(f);
  const khac = (e: StorageEvent) => { if (e.key === KHOA_CHI_TAY || e.key === null) { daDoc = false; f(); } };
  window.addEventListener("storage", khac);
  return () => { nghe.delete(f); window.removeEventListener("storage", khac); };
}

export function useChonChiTay(): ChonChiTay {
  return useSyncExternalStore(dangKy, doc, () => RONG);
}

export const datVan = (van: string[]) => ghiKho({ ...doc(), van: van.slice(0, 30) });
export const datTay = (tay: Tay) => ghiKho({ ...doc(), tay });
/** Đặt (hoặc bỏ, khi `luaChon` null) lựa chọn tự quan sát của một cung. Tối đa 12 cung. */
export function datCung(ma: string, luaChon: string | null): void {
  if (!MA.test(ma) || (luaChon !== null && !MA.test(luaChon))) return;
  const { [ma]: _cu, ...con } = doc().cung;
  if (luaChon === null) { ghiKho({ ...doc(), cung: con }); return; }
  if (Object.keys(con).length >= 12) return;
  ghiKho({ ...doc(), cung: { ...con, [ma]: luaChon } });
}
export const boHetCung = () => ghiKho({ ...doc(), cung: {} });
/** Đặt / bỏ lựa chọn tự soi một câu về đường chỉ (ba đường lớn, độ sâu, đường dọc, vân nhỏ). */
export function datDuong(ma: string, luaChon: string | null): void {
  if (!MA.test(ma) || (luaChon !== null && !MA.test(luaChon))) return;
  const { [ma]: _cu, ...con } = doc().duong;
  ghiKho({ ...doc(), duong: luaChon === null ? con : { ...con, [ma]: luaChon } });
}
export const boHet = () => ghiKho({ ...RONG, tay: doc().tay });
