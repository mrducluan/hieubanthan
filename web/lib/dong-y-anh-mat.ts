"use client";
// ANH-1 — Thoả thuận xử lý ẢNH GƯƠNG MẶT (dữ liệu sinh trắc — Luật BVDLCN 91/2025: đồng ý RIÊNG, rõ ràng, theo mục đích,
// không tích sẵn, rút được). Khác đồng ý ĐY-1 (ngày giờ sinh): đây là đồng ý thứ hai, hỏi đúng chỗ tải ảnh ở trang Nhân
// tướng học. Mục đích duy nhất: gửi ≤ 3 ảnh chân dung của CHÍNH người dùng (đã thu nhỏ trên máy, bỏ EXIF) tới dịch vụ AI
// nhận diện bên thứ ba qua máy chủ Hiểu Bản Thân trong MỘT lượt gọi để gợi ý lựa chọn khảo sát; không lưu, không huấn
// luyện, mọi gợi ý người dùng tự xác nhận. Lưu trên máy: `hbt.dong_y_anh_mat.v1 = { phien_ban, luc }`; đổi PHIEN_BAN khi
// nội dung xử lý đổi → hỏi lại. Thu hồi = xoá bản đồng ý (ảnh vốn không lưu nên không có gì để xoá thêm). `xoaHoSo()` cũng
// xoá khoá này (KHOA_THEO_HO_SO). Chỉ gửi mã bản lên đo lường, không gửi ảnh / tên tệp.
import { useSyncExternalStore } from "react";
import { ghi } from "@/lib/do-luong";

export const KHOA_DONG_Y_ANH_MAT = "hbt.dong_y_anh_mat.v1";
/** Bản thoả thuận hiện hành (không chứa 4 chữ số liền). */
export const PHIEN_BAN_DONG_Y_ANH = "am1";

export interface DongYAnhMat { phien_ban: string; luc: string }

const nghe = new Set<() => void>();
let daDoc = false;
let hienTai: DongYAnhMat | null = null;

function doc(): DongYAnhMat | null {
  if (typeof window === "undefined") return null;
  if (!daDoc) {
    daDoc = true;
    try {
      const raw = window.localStorage.getItem(KHOA_DONG_Y_ANH_MAT);
      const v = raw ? (JSON.parse(raw) as Partial<DongYAnhMat> | null) : null;
      hienTai = v && v.phien_ban === PHIEN_BAN_DONG_Y_ANH && typeof v.luc === "string" ? { phien_ban: v.phien_ban, luc: v.luc } : null;
    } catch { hienTai = null; }
  }
  return hienTai;
}
function bao() { nghe.forEach((f) => f()); }
function dangKy(f: () => void) {
  nghe.add(f);
  const khac = (e: StorageEvent) => { if (e.key === KHOA_DONG_Y_ANH_MAT || e.key === null) { daDoc = false; f(); } };
  window.addEventListener("storage", khac);
  return () => { nghe.delete(f); window.removeEventListener("storage", khac); };
}

export const daDongYAnhMat = (): boolean => doc() !== null;

/** Người dùng tích ô thoả thuận rồi bấm "Đọc ảnh" — ghi đúng lúc hành động. */
export function ghiDongYAnhMat(): DongYAnhMat {
  const moi: DongYAnhMat = { phien_ban: PHIEN_BAN_DONG_Y_ANH, luc: new Date().toISOString() };
  hienTai = moi; daDoc = true;
  try { window.localStorage.setItem(KHOA_DONG_Y_ANH_MAT, JSON.stringify(moi)); } catch { /* chế độ riêng tư */ }
  ghi("consent_given", { phien_ban: PHIEN_BAN_DONG_Y_ANH });
  bao();
  return moi;
}

export function thuHoiDongYAnhMat(): void {
  hienTai = null; daDoc = true;
  try { window.localStorage.removeItem(KHOA_DONG_Y_ANH_MAT); } catch { /* bỏ qua */ }
  ghi("consent_withdrawn", { phien_ban: PHIEN_BAN_DONG_Y_ANH });
  bao();
}

/** `undefined` lúc SSR / chưa đọc, `null` = chưa đồng ý. */
export function useDongYAnhMat(): DongYAnhMat | null | undefined {
  return useSyncExternalStore(dangKy, doc, () => undefined);
}

export function ngayDongYAnhMat(d: DongYAnhMat | null | undefined): string | null {
  if (!d) return null;
  const t = new Date(d.luc);
  return Number.isNaN(t.getTime()) ? null : t.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
