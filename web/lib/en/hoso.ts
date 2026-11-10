"use client";
// EN-ALL GĐ 1 việc 4 — hồ sơ bản Anh là CÙNG hồ sơ chung của site (`hbt.hoso.v1`, lib/hoso.ts) + cách tính Đường đời chung
// (`hbt.thanso_dd`, lib/quy-uoc-dd.ts): đổi ngôn ngữ không mất hồ sơ, người dùng không nhập lại. File này chỉ là lớp đổi
// tên trường cho các trang /en còn viết riêng (Numerology, Tarot) cho tới khi chúng dùng thẳng component chung.
//
// Hồ sơ cũ của bản Anh (`hbt.en.profile.v1`, QTE-3): đọc MỘT lần rồi chuyển sang hồ sơ chung — chỉ xoá khoá cũ sau khi đã
// ghi xong hồ sơ chung; máy đã có hồ sơ chung thì hồ sơ chung thắng (khoá cũ bỏ đi, không ghi đè người dùng bản Việt).
// Vẫn chỉ trên máy; "Clear" ở bản Anh = xoá hồ sơ trên máy như nút xoá của bản Việt.
import { useCallback, useEffect, useMemo } from "react";
import { HoSo, KHOA_HO_SO, luuHoSo, useHoSo, xoaHoSo, capNhatHoSo, hoTenList } from "@/lib/hoso";
import { docQuyUocDD, ghiQuyUocDD, useQuyUocDD, type QuyUocDD } from "@/lib/quy-uoc-dd";

/** Khoá hồ sơ cũ của bản Anh (QTE-3) — chỉ còn để chuyển một lần. */
export const KHOA_CU = "hbt.en.profile.v1";
export interface ProfileEn { name: string; nickname?: string; day: number; month: number; year: number; method: QuyUocDD }

/** Chuyển hồ sơ cũ `hbt.en.profile.v1` → hồ sơ chung. Gọi được nhiều lần (chạy thật một lần). Trả true khi vừa chuyển. */
export function chuyenHoSoCu(): boolean {
  try {
    const raw = localStorage.getItem(KHOA_CU);
    if (!raw) return false;
    const x = JSON.parse(raw) as Partial<ProfileEn> | null;
    const daCo = HoSo.safeParse(JSON.parse(localStorage.getItem(KHOA_HO_SO) ?? "null")).success;
    let chuyen = false;
    if (!daCo && x && typeof x.name === "string" && x.name.trim() && Number.isInteger(x.day) && Number.isInteger(x.month) && Number.isInteger(x.year)) {
      luuHoSo({ ho_ten: x.name.trim().slice(0, 80), ...(x.nickname?.trim() ? { ten_khac: x.nickname.trim().slice(0, 80) } : {}),
        ngay: x.day!, thang: x.month!, nam: x.year! });
      if (x.method === "tong_het" || x.method === "tung_phan") ghiQuyUocDD(x.method);
      chuyen = true;
    }
    localStorage.removeItem(KHOA_CU);   // đã chuyển xong (hoặc hồ sơ chung đã có / hồ sơ cũ hỏng) → bỏ khoá cũ
    return chuyen;
  } catch {
    return false;   // luuHoSo ném (dữ liệu cũ không hợp lệ) hoặc storage bị chặn → giữ nguyên khoá cũ, không mất dữ liệu
  }
}

/** Hồ sơ chung đọc theo tên trường bản Anh. `undefined` lúc chưa đọc (SSR), `null` khi chưa có. */
export function useProfileEn(): [ProfileEn | null | undefined, (p: ProfileEn | null) => void] {
  useEffect(() => { chuyenHoSoCu(); }, []);
  const h = useHoSo();
  const method = useQuyUocDD();
  // Một đối tượng ổn định mỗi lần hồ sơ / cách tính đổi (trang dùng làm phụ thuộc của lời gọi engine).
  const p = useMemo<ProfileEn | null | undefined>(() => (h === undefined ? undefined : h === null ? null
    : { name: h.ho_ten, ...(h.ten_khac ? { nickname: h.ten_khac } : {}), day: h.ngay, month: h.thang, year: h.nam, method }), [h, method]);
  const ghi = useCallback((x: ProfileEn | null) => {
    if (!x) { xoaHoSo(); return; }
    const ten = { ho_ten: x.name.trim(), ten_khac: x.nickname?.trim() || undefined, ngay: x.day, thang: x.month, nam: x.year };
    // Cùng ngày sinh → chỉ đổi tên (giữ giờ, nơi sinh, giới tính đã nhập ở bản Việt); khác ngày sinh → hồ sơ mới.
    const cu = h && h.ngay === x.day && h.thang === x.month && h.nam === x.year;
    if (cu) capNhatHoSo(ten); else luuHoSo(ten);
    if (x.method !== docQuyUocDD()) ghiQuyUocDD(x.method);
  }, [h]);
  return [p, ghi];
}

export function hoTen(p: ProfileEn): string[] {
  return hoTenList({ ho_ten: p.name, ten_khac: p.nickname });
}
