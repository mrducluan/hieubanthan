"use client";
// TS-V3b — "Phái nào nói đúng về bạn?": phiếu bình chọn sau mỗi câu trả lời thần số. Chỉ đếm 3 con số TRÊN MÁY người
// dùng (localStorage), không gửi máy chủ, không gắn câu hỏi. Sau NGUONG_GOI_Y phiếu → gợi ý phái hợp nhất (đếm phiếu,
// không phải phép tính thần số) và mở báo cáo 3 phái (engine viết chương "phái nói đúng về bạn" từ 3 con số này).
import { useEffect, useState } from "react";

export type PhaiPhieu = "pitago" | "chaldea" | "kabbalah";
export type Phieu = Record<PhaiPhieu, number>;
export const CAC_PHAI_PHIEU: PhaiPhieu[] = ["pitago", "chaldea", "kabbalah"];
export const TEN_PHAI_PHIEU: Record<PhaiPhieu, string> = { pitago: "Pitago", chaldea: "Chaldea", kabbalah: "Qabalah" };
export const NGUONG_GOI_Y = 7;
const KHOA = "hbt.thanso_phieu";
const SU_KIEN = "hbt:phieu-phai";
const RONG: Phieu = { pitago: 0, chaldea: 0, kabbalah: 0 };

export function docPhieu(): Phieu {
  try {
    const v = JSON.parse(localStorage.getItem(KHOA) ?? "null") as Partial<Phieu> | null;
    if (!v || typeof v !== "object") return { ...RONG };
    return Object.fromEntries(CAC_PHAI_PHIEU.map((p) => [p, Number.isInteger(v[p]) && (v[p] as number) >= 0 ? Math.min(v[p] as number, 1000) : 0])) as Phieu;
  } catch { return { ...RONG }; }
}

export function boPhieu(p: PhaiPhieu): Phieu {
  const moi = { ...docPhieu(), [p]: docPhieu()[p] + 1 };
  try { localStorage.setItem(KHOA, JSON.stringify(moi)); } catch { /* chế độ riêng tư: chỉ đếm trong phiên */ }
  window.dispatchEvent(new CustomEvent(SU_KIEN, { detail: moi }));
  return moi;
}

export function xoaPhieu() {
  try { localStorage.removeItem(KHOA); } catch { /* bỏ qua */ }
  window.dispatchEvent(new CustomEvent(SU_KIEN, { detail: { ...RONG } }));
}

export const tongPhieu = (ph: Phieu) => ph.pitago + ph.chaldea + ph.kabbalah;

/** Phái nhiều phiếu nhất (có thể hoà → nhiều phái). Rỗng khi chưa có phiếu. */
export function phaiDanDau(ph: Phieu): PhaiPhieu[] {
  const max = Math.max(...CAC_PHAI_PHIEU.map((p) => ph[p]));
  return max > 0 ? CAC_PHAI_PHIEU.filter((p) => ph[p] === max) : [];
}

export function usePhieu(): Phieu {
  const [ph, setPh] = useState<Phieu>(RONG);
  useEffect(() => {
    setPh(docPhieu());
    const nghe = (e: Event) => setPh((e as CustomEvent<Phieu>).detail);
    window.addEventListener(SU_KIEN, nghe);
    return () => window.removeEventListener(SU_KIEN, nghe);
  }, []);
  return ph;
}
