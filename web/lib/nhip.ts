"use client";
// NHIP-1 — nhịp cá nhân gọn từ engine (/api/thanso/nhip). Web chỉ hiển thị; nhớ trong bộ nhớ theo ngày sinh + ngày xem.
import { useEffect, useState } from "react";
import { postJson } from "@/lib/goi-api";
import type { HoSo } from "@/lib/hoso";

export interface NhipThang { so: number; thang: number; nam: number; chu_de: string | null; nen: string | null }
export interface NhipNam { so: number; nam: number; chu_de: string | null; nen: string | null }
export interface Nhip {
  ngay_xem: string;
  ngay_ca_nhan: { so: number; nghia: string; tu_soi: string };
  thang_ca_nhan: NhipThang; thang_toi: NhipThang;
  nam_ca_nhan: NhipNam & { con_ngay: number; tong_ngay: number }; nam_toi: NhipNam;
  luu_y: string;
}

const boNho = new Map<string, Nhip>();
const khoaNgay = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());

/** "Ngày cá nhân 6: hợp dành cho gia đình…" → "Hợp dành cho gia đình…". */
export const boTienToNgay = (s: string) => { const t = s.replace(/^Ngày cá nhân \d+:\s*/, ""); return t.charAt(0).toUpperCase() + t.slice(1); };

export function useNhip(h: HoSo | null | undefined): Nhip | null {
  const khoa = h ? `${h.ngay}-${h.thang}-${h.nam}|${khoaNgay()}` : "";
  const [kq, setKq] = useState<Nhip | null>(boNho.get(khoa) ?? null);
  useEffect(() => {
    if (!h) { setKq(null); return; }
    const co = boNho.get(khoa);
    if (co) { setKq(co); return; }
    let huy = false;
    postJson<Nhip>("/api/thanso/nhip", { ngay: h.ngay, thang: h.thang, nam: h.nam })
      .then((d) => { boNho.set(khoa, d); if (!huy) setKq(d); })
      .catch(() => { /* lỗi mạng: khối nhịp tự ẩn, phần còn lại của trang vẫn dùng được */ });
    return () => { huy = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- khoa đại diện đủ cho h
  }, [khoa]);
  return kq;
}
