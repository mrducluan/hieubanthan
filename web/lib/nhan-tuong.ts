"use client";
// NT-1 — Nhân tướng học: kiểu dữ liệu + câu trả lời khảo sát LƯU TRÊN MÁY (`hbt.nhan_tuong.v1`). Web không tính gì:
// engine nhận {mã câu: mã lựa chọn} và trả bài đọc; ảnh (nếu người dùng chấm điểm) không bao giờ rời máy.
import { useEffect, useState } from "react";
import type { BaoCaoDoiSong, ChuongDoiSongMo, Muc } from "@/components/luan-giai/kieu";

export const KHOA_NHAN_TUONG = "hbt.nhan_tuong.v1";
export const SU_KIEN_NHAN_TUONG = "hbt-nhan-tuong";
export const TOI_THIEU_CAU = 6;   // đủ để bài đọc có nội dung; ít hơn vẫn xem được nhưng mời bổ sung

export type TraLoi = Record<string, string>;
export interface LuaChon { ma: string; nhan: string }
export interface CauHoi { ma: string; buoc: number; bo_vi: string; nhom: string; hoi: string; huong_dan: string; lua_chon: LuaChon[] }
export interface BuocKS { so: number; ten: string; goi_y: string }
export interface BoVi { ten: string; han?: string; vi_tri: string; vung: string; cung?: string; nghia: string }
/** ANH-2: một điểm mốc để người dùng tự chấm trên ảnh (engine KB `do_anh`). */
export interface DiemDo { ma: string; ten: string; nhom: string; mo: string; bat_buoc: boolean }
export interface KhaoSat {
  buoc: BuocKS[]; cau_hoi: CauHoi[]; bo_vi: Record<string, BoVi>; cung: Record<string, { ten: string; noi_ve: string; bo_vi: string[] }>;
  /** ANH-2: engine cũ chưa có → khối đo trên ảnh tự ẩn. */
  diem_do?: { nhom: Record<string, string>; diem: DiemDo[]; diem_nghieng?: DiemDo[] };
  truong_phai: Record<string, { ten: string; ngan: string; mo_ta: string }>;
  ngu_hinh: Record<string, { ten: string; hanh: string | null; dau_hieu: string }>;
}

export type { MucVung } from "@/lib/nhan-tuong-chung";
import type { MucVung } from "@/lib/nhan-tuong-chung";
export interface LuuNienVi { tuoi: number; vi: number; ten: string; bo_vi: string; ben: "trai" | "phai" | "giua"; nam: number | null; ten_bo_vi: string; vung: string | null; nhan_ben: string; quan_sat: string[]; muc: Muc | null;
  /** WS-4: chặng «流年運氣部位歌» (Thần Tướng Toàn Biên) cho đúng tuổi — engine cũ chưa có thì thiếu. */
  bai_ca?: { tu: number; den: number; han: string; y: string; sach: string; ten_bai: string } | null }
export interface ChuongNhanTuong extends ChuongDoiSongMo {
  thieu?: string | null;
  luu_nien?: { nam_nay: LuuNienVi; toi: LuuNienVi[]; tuoi_mu: number; nam_am_xem: number };
}
export interface BaoCaoNhanTuong extends BaoCaoDoiSong {
  ten: string; thieu: string[];
  chuong: ChuongNhanTuong[];
  da_tinh: { so_cau: number; so_dac_diem: number; dac_diem: string[]; ngu_hinh: { hinh: string; ten: string | null; diem: Record<string, number>; troi: string[] };
    ban_do: Record<string, MucVung>; ngay_xem: string };
}

export function docTraLoi(): TraLoi {
  try {
    const d = JSON.parse(localStorage.getItem(KHOA_NHAN_TUONG) ?? "null") as { v: 1; tra_loi: TraLoi } | null;
    return d && d.v === 1 && d.tra_loi && typeof d.tra_loi === "object" ? d.tra_loi : {};
  } catch { return {}; }
}

export function luuTraLoi(tl: TraLoi): void {
  try {
    const sach = Object.fromEntries(Object.entries(tl).filter(([k, v]) => /^[a-z0-9_]{2,40}$/.test(k) && /^[a-z0-9_]{2,40}$/.test(v)));
    localStorage.setItem(KHOA_NHAN_TUONG, JSON.stringify({ v: 1, tra_loi: sach, luc: new Date().toISOString() }));
    window.dispatchEvent(new Event(SU_KIEN_NHAN_TUONG));
  } catch { /* trình duyệt chặn lưu */ }
}

export function xoaTraLoi(): void {
  try { localStorage.removeItem(KHOA_NHAN_TUONG); window.dispatchEvent(new Event(SU_KIEN_NHAN_TUONG)); } catch { /* bỏ qua */ }
}

/** Câu trả lời trên máy; `undefined` lúc chưa đọc (SSR). */
export function useTraLoi(): TraLoi | undefined {
  const [tl, setTl] = useState<TraLoi | undefined>(undefined);
  useEffect(() => {
    const doc = () => setTl(docTraLoi());
    doc();
    window.addEventListener(SU_KIEN_NHAN_TUONG, doc);
    return () => window.removeEventListener(SU_KIEN_NHAN_TUONG, doc);
  }, []);
  return tl;
}

/** Số câu đã trả lời (bỏ "không chắc"). */
export const demTraLoi = (tl: TraLoi | undefined) => Object.values(tl ?? {}).filter((v) => v && v !== "khong_chac").length;

export { VUNG_MAT, laVung, TEN_HINH, type VungMat } from "@/lib/nhan-tuong-chung";
