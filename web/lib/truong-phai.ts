// TP-1 (chủ dự án duyệt 2026-11-27) — trường phái dùng chung, phía trình duyệt.
// Sổ (mô tả, nguồn, mặc định) do engine trả ở GET /v1/truong-phai (qua /api/truong-phai) — web không viết tri thức.
// Công tắc lịch MỚI (Dương Công kỵ) nhớ trên máy và đi theo header `x-duong-cong` ở MỌI lượt gọi /api/* cùng site
// (`kemNgonNgu` gắn, proxy chuyển tiếp) — engine kiểm, lạ → 422. Mặc định không gửi gì → kết quả y như cũ.
"use client";
import { useEffect, useState } from "react";

export type DuongCong = "lich_viet" | "hiep_ky";
export const DUONG_CONG_MAC_DINH: DuongCong = "lich_viet";
const KHOA_DUONG_CONG = "hbt.lich.duong_cong";
const SU_KIEN = "hbt:truong-phai";

export function docDuongCong(): DuongCong {
  try {
    const v = localStorage.getItem(KHOA_DUONG_CONG);
    return v === "hiep_ky" ? "hiep_ky" : DUONG_CONG_MAC_DINH;
  } catch { return DUONG_CONG_MAC_DINH; }
}

export function datDuongCong(v: DuongCong): void {
  try {
    if (v === DUONG_CONG_MAC_DINH) localStorage.removeItem(KHOA_DUONG_CONG);
    else localStorage.setItem(KHOA_DUONG_CONG, v);
  } catch { /* chế độ riêng tư: chỉ đổi trong phiên */ }
  window.dispatchEvent(new CustomEvent(SU_KIEN, { detail: { duong_cong: v } }));
}

/** Giá trị đang chọn; `null` lúc chưa đọc máy (lượt dựng đầu ở máy chủ) → coi như mặc định. */
export function useDuongCong(): [DuongCong, (v: DuongCong) => void] {
  const [v, setV] = useState<DuongCong>(DUONG_CONG_MAC_DINH);
  useEffect(() => {
    setV(docDuongCong());
    const nghe = () => setV(docDuongCong());
    window.addEventListener(SU_KIEN, nghe);
    window.addEventListener("storage", nghe);
    return () => { window.removeEventListener(SU_KIEN, nghe); window.removeEventListener("storage", nghe); };
  }, []);
  return [v, datDuongCong];
}

/** Header trường phái cho một lượt gọi cùng site (rỗng khi đang dùng mặc định). */
export function dauTruongPhai(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const dc = docDuongCong();
  return dc === DUONG_CONG_MAC_DINH ? {} : { "x-duong-cong": dc };
}

// ---- Sổ trường phái (đọc một lần mỗi phiên trang) ---------------------------------------------------------------
export interface LuaChonPhai { ma: string; ten: string; mo_ta: string; mac_dinh: boolean; nguon: { sach: string; trich?: string } }
export interface DiemPhai {
  ma: string; mon: string; ten: string; mo_ta: string; truong_api: string | null; anh_huong: string[];
  lua_chon: LuaChonPhai[]; loi_khac?: Record<string, string>;
}
export interface SoTruongPhai { nguyen_tac: string[]; mon: string[]; diem: DiemPhai[] }

const _so = new Map<string, Promise<SoTruongPhai | null>>();

export function laySoTruongPhai(en = false): Promise<SoTruongPhai | null> {
  const k = en ? "en" : "vi";
  let p = _so.get(k);
  if (!p) {
    p = fetch(`/api/truong-phai${en ? "?ngon_ngu=en" : ""}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    _so.set(k, p);
  }
  return p;
}

export function useDiemPhai(ma: string, en = false): DiemPhai | null {
  const [d, setD] = useState<DiemPhai | null>(null);
  useEffect(() => {
    let huy = false;
    laySoTruongPhai(en).then((s) => { if (!huy) setD(s?.diem.find((x) => x.ma === ma) ?? null); });
    return () => { huy = true; };
  }, [ma, en]);
  return d;
}

/** Một chỗ cách kia làm khác kết quả này (engine trả trong phản hồi lịch, chỉ khi có). */
export interface DiemKhac { ma: string; hien: string; khac: string; loi: string; nut: string; co_kieng?: boolean; them?: string[]; bot?: string[] }
