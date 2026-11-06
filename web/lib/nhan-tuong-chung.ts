// NT-1 — phần dùng chung máy chủ + trình duyệt (không "use client"): danh mục vùng trên bản đồ mặt, tên hành.
import type { Muc } from "@/components/luan-giai/kieu";

export type MucVung = Muc | "trung_tinh";

/** Mọi vùng vẽ trên bản đồ mặt (id trong SVG) — một nguồn với KB `bo_vi[].vung` của engine. */
export const VUNG_MAT = [
  "tran_tren", "tran_giua", "tran_ben", "thai_duong", "an_duong", "long_may", "dien_trach", "mat", "ngu_vi", "le_duong", "son_can",
  "song_mui", "quyen", "chuan_dau", "canh_mui", "nhan_trung", "phap_lenh", "mieng", "thua_tuong", "cam", "ham", "tai", "toan_mat",
] as const;
export type VungMat = (typeof VUNG_MAT)[number];
export const laVung = (s: string | null | undefined): s is VungMat => Boolean(s) && (VUNG_MAT as readonly string[]).includes(s as string);

export const TEN_HINH: Record<string, string> = { kim: "Kim", moc: "Mộc", thuy: "Thuỷ", hoa: "Hoả", tho: "Thổ", pha: "Hình pha" };
