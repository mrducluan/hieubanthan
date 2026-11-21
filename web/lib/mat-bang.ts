"use client";
// DC-MB — "Hồ sơ cửa hàng" trên máy: loại hình, độ hướng mặt tiền, năm xây (đúng năm / khoảng năm / không rõ) của mặt bằng
// kinh doanh, để lần sau mở tab Mặt bằng & Khai trương không phải nhập lại. CHỈ trên máy (không gửi máy chủ, không tài khoản).
// Xoá cùng hồ sơ (`xoaHoSo` — khoá nằm trong KHOA_THEO_HO_SO) và ở "Dữ liệu của tôi".
import { useSyncExternalStore } from "react";
import { SU_KIEN_NGUOI_THAN } from "@/lib/hoso";

export const KHOA_MAT_BANG = "hbt.mat_bang.v1";
const SU_KIEN = "hbt-mat-bang";

export type LoaiHinh = "van_phong" | "cua_hang" | "quan_ca_phe" | "xuong_kho";
export type CachNamXay = "chinh_xac" | "khoang" | "khong_ro";

export interface HoSoMatBang {
  v: 1;
  loai_hinh: LoaiHinh;
  do_huong: number;
  cach_nam: CachNamXay;
  /** Năm xây đúng (cach_nam = chinh_xac) hoặc năm đại diện của khoảng (cach_nam = khoang). Không rõ → không có. */
  nam_xay?: number;
}

const LOAI: LoaiHinh[] = ["van_phong", "cua_hang", "quan_ca_phe", "xuong_kho"];
const CACH: CachNamXay[] = ["chinh_xac", "khoang", "khong_ro"];

function hopLe(x: unknown): x is HoSoMatBang {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return o.v === 1 && LOAI.includes(o.loai_hinh as LoaiHinh) && typeof o.do_huong === "number" && o.do_huong >= 0 && o.do_huong < 360
    && CACH.includes(o.cach_nam as CachNamXay)
    && (o.nam_xay === undefined || (typeof o.nam_xay === "number" && Number.isInteger(o.nam_xay) && o.nam_xay >= 1864 && o.nam_xay <= 2043));
}

let cache: { raw: string | null; val: HoSoMatBang | null } = { raw: null, val: null };

export function docMatBang(): HoSoMatBang | null {
  try {
    const raw = window.localStorage.getItem(KHOA_MAT_BANG);
    if (raw === cache.raw) return cache.val;
    let val: HoSoMatBang | null = null;
    if (raw) { const o: unknown = JSON.parse(raw); if (hopLe(o)) val = o; }
    cache = { raw, val };
    return val;
  } catch {
    return null;
  }
}

function bao() { try { window.dispatchEvent(new Event(SU_KIEN)); } catch { /* bỏ qua */ } }

export function luuMatBang(h: HoSoMatBang): void {
  try { window.localStorage.setItem(KHOA_MAT_BANG, JSON.stringify(h)); } catch { /* bỏ qua */ }
  bao();
}

export function xoaMatBang(): void {
  try { window.localStorage.removeItem(KHOA_MAT_BANG); } catch { /* bỏ qua */ }
  bao();
}

function dangKy(f: () => void) {
  const onStorage = (e: StorageEvent) => { if (e.key === KHOA_MAT_BANG || e.key === null) f(); };
  window.addEventListener(SU_KIEN, f);
  window.addEventListener(SU_KIEN_NGUOI_THAN, f);   // xoaHoSo() cùng tab bắn sự kiện này
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(SU_KIEN, f); window.removeEventListener(SU_KIEN_NGUOI_THAN, f); window.removeEventListener("storage", onStorage);
  };
}

/** `undefined` = đang hydrate · `null` = chưa lưu. */
export function useMatBang(): HoSoMatBang | null | undefined {
  return useSyncExternalStore(dangKy, docMatBang, () => undefined);
}
