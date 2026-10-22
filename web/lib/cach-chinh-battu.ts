"use client";
// BT-DC — "Cách nào đúng với mình?" (Bát tự). Engine đã chấm mức của HAI cách lấy dụng thần cho từng năm đã qua; ở đây
// chỉ ghi câu trả lời người dùng và SO MÃ (trả lời trùng mức của cách nào → cách ấy được một điểm) theo `luat` engine
// trả. Lưu TRÊN MÁY (localStorage) theo từng lá số; không gửi câu trả lời, không gửi năm lên máy chủ hay PostHog.
import { createContext, useContext, useEffect, useState } from "react";

export type Cach = "cach_1" | "cach_2";
export type MucCach = "thuan" | "can_bang" | "can_chu_dong";
export type TraLoi = MucCach | "khong_nho";

export interface CauDoiChieu {
  ma: string; loai: "nam" | "van"; nhan: string; hoi: string; cach_1: MucCach; cach_2: MucCach; can_cu: string[];
}
export interface DoiChieuCach {
  phien_ban: string; chon: null; co_cau_hoi: boolean; ly_do: string | null; loi_ly_do: string | null;
  cach: Record<Cach, { ten: string; mo_ta: string; hanh: string[] }>;
  cau: CauDoiChieu[]; lua_chon: { ma: TraLoi; nhan: string }[];
  luat: { toi_thieu: number; chenh: number };
  ket_luan: Record<"cach_1" | "cach_2" | "nghieng_1" | "nghieng_2" | "chua_ro", string>;
  cach_cuc: string; than: string;
}

export interface KetQuaDoiChieu { khop_1: number; khop_2: number; so_cau: number; ma: keyof DoiChieuCach["ket_luan"] | null }

/** Đếm số câu khớp từng cách (bỏ "không nhớ"); `ma` = khoá lời kết luận khi đủ `luat.toi_thieu` câu, chưa đủ → null. */
export function ketQua(dc: Pick<DoiChieuCach, "cau" | "luat">, traLoi: Record<string, TraLoi>): KetQuaDoiChieu {
  let khop_1 = 0, khop_2 = 0, so_cau = 0;
  for (const c of dc.cau) {
    const t = traLoi[c.ma];
    if (!t || t === "khong_nho") continue;
    so_cau += 1;
    if (t === c.cach_1) khop_1 += 1;
    if (t === c.cach_2) khop_2 += 1;
  }
  if (so_cau < dc.luat.toi_thieu) return { khop_1, khop_2, so_cau, ma: null };
  const chenh = khop_1 - khop_2;
  const ma = chenh >= dc.luat.chenh ? "cach_1" : -chenh >= dc.luat.chenh ? "cach_2"
    : chenh === 1 ? "nghieng_1" : chenh === -1 ? "nghieng_2" : "chua_ro";
  return { khop_1, khop_2, so_cau, ma };
}

const KHOA = "hbt.battu.doi_chieu.v1";
const SU_KIEN = "hbt:battu-cach";
interface MotLa { tra_loi: Record<string, TraLoi>; chinh?: Cach }

/** Khoá lá số trên máy: chỉ dùng để tách hồ sơ (cùng thông tin hồ sơ đã lưu trên máy), không gửi đi đâu. */
export function khoaLaSo(laSo: { birth_date?: string; birth_time?: string | null; gender?: string } | null): string | null {
  return laSo?.birth_date ? `${laSo.birth_date}|${laSo.birth_time ?? ""}|${laSo.gender ?? ""}` : null;
}

function docTat(): Record<string, MotLa> {
  try {
    const v = JSON.parse(localStorage.getItem(KHOA) ?? "null");
    return v && typeof v === "object" ? v : {};
  } catch { return {}; }
}

export function docLa(khoa: string | null): MotLa {
  const v = khoa ? docTat()[khoa] : undefined;
  return { tra_loi: v?.tra_loi && typeof v.tra_loi === "object" ? v.tra_loi : {}, ...(v?.chinh ? { chinh: v.chinh } : {}) };
}

export function ghiLa(khoa: string, moi: MotLa) {
  const tat = { ...docTat(), [khoa]: moi };
  const ds = Object.keys(tat);
  if (ds.length > 8 && ds[0] !== khoa) delete tat[ds[0]!];   // giữ tối đa 8 lá số trên máy
  try { localStorage.setItem(KHOA, JSON.stringify(tat)); } catch { /* chế độ riêng tư: chỉ nhớ trong phiên */ }
  window.dispatchEvent(new CustomEvent(SU_KIEN, { detail: { khoa, moi } }));
}

/** Cách người dùng chọn làm chính cho lá số đang xem (undefined khi chưa chọn). */
export function useCachChinh(khoa: string | null): Cach | undefined {
  const [c, setC] = useState<Cach | undefined>();
  useEffect(() => {
    setC(docLa(khoa).chinh);
    const nghe = (e: Event) => {
      const d = (e as CustomEvent<{ khoa: string; moi: MotLa }>).detail;
      if (d.khoa === khoa) setC(d.moi.chinh);
    };
    window.addEventListener(SU_KIEN, nghe);
    return () => window.removeEventListener(SU_KIEN, nghe);
  }, [khoa]);
  return c;
}

/** Báo cáo Bát tự đời sống đọc cách chính qua context (trang Bát tự bọc quanh luận giải). */
export const CachChinhBatTu = createContext<{ cach?: Cach; ten?: Record<Cach, string> }>({});
export const useCachChinhBaoCao = () => useContext(CachChinhBatTu);
