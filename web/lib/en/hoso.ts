"use client";
// QTE — hồ sơ người dùng bản tiếng Anh, CHỈ trên máy (`hbt.en.profile.v1`): tên, ngày sinh, cách cộng Đường đời. Không đồng bộ,
// xoá bằng nút "Clear". Dùng cho /en/numerology (bài đọc + hỏi đáp) và /en/tarot (lá của ngày, năm sinh cho lá đại diện).
import { useEffect, useState } from "react";

export const KHOA = "hbt.en.profile.v1";
export interface ProfileEn { name: string; nickname?: string; day: number; month: number; year: number; method: "tung_phan" | "tong_het" }

export function docProfile(): ProfileEn | null {
  try {
    const x = JSON.parse(localStorage.getItem(KHOA) ?? "null") as ProfileEn | null;
    return x && typeof x.name === "string" && Number.isInteger(x.day) && Number.isInteger(x.month) && Number.isInteger(x.year) ? x : null;
  } catch { return null; }
}
export function ghiProfile(p: ProfileEn | null) {
  try { p ? localStorage.setItem(KHOA, JSON.stringify(p)) : localStorage.removeItem(KHOA); } catch { /* storage blocked */ }
}
/** `undefined` lúc chưa đọc (SSR), `null` khi chưa có. */
export function useProfileEn(): [ProfileEn | null | undefined, (p: ProfileEn | null) => void] {
  const [p, setP] = useState<ProfileEn | null | undefined>(undefined);
  useEffect(() => { setP(docProfile()); }, []);
  return [p, (x) => { ghiProfile(x); setP(x); }];
}
export function hoTen(p: ProfileEn): string[] {
  return [p.name.trim(), ...(p.nickname?.trim() ? [p.nickname.trim()] : [])];
}
