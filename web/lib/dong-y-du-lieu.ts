"use client";
// ĐY-1 — Đồng ý xử lý dữ liệu cá nhân (Luật BVDLCN 91/2025/QH15: đồng ý rõ ràng, theo mục đích, không tích sẵn, rút
// được, im lặng không phải đồng ý). Mục đích duy nhất của đồng ý này: gửi họ tên + ngày giờ sinh (+ giới tính, nơi sinh)
// tới máy chủ tính toán (Singapore) để TÍNH TẠI CHỖ — không lưu khi chưa đăng nhập. Đồng ý lưu vào tài khoản, ảnh nhà,
// ghi chú góp ý, tự lưu bài, nhắc việc… là các đồng ý RIÊNG, hỏi đúng chỗ (ô không tích sẵn).
//
// Lưu trên máy: `hbt.dong_y_dl.v1 = { phien_ban, luc }`. Đổi PHIEN_BAN_DONG_Y (khi chính sách đổi NỘI DUNG xử lý — mục
// đích, bên nhận, nơi xử lý) → bản đồng ý cũ hết hiệu lực, form hỏi lại. Thu hồi = xoá đồng ý + xoá hồ sơ trên máy.
// Không gửi gì lên máy chủ ngoài hai sự kiện đo đếm `consent_given{phien_ban}` / `consent_withdrawn` (chỉ mã bản).
import { useSyncExternalStore } from "react";
import { ghi } from "@/lib/do-luong";
import { xoaHoSo } from "@/lib/hoso";

export const KHOA_DONG_Y_DL = "hbt.dong_y_dl.v1";
/** Bản đồng ý hiện hành. KHÔNG chứa 4 chữ số liền (bộ lọc đo lường chặn chuỗi giống năm sinh). */
export const PHIEN_BAN_DONG_Y = "dl1";

export interface DongYDuLieu { phien_ban: string; luc: string }

const nghe = new Set<() => void>();
let daDoc = false;
let hienTai: DongYDuLieu | null = null;

function doc(): DongYDuLieu | null {
  if (typeof window === "undefined") return null;
  if (!daDoc) {
    daDoc = true;
    try {
      const raw = window.localStorage.getItem(KHOA_DONG_Y_DL);
      const v = raw ? (JSON.parse(raw) as Partial<DongYDuLieu> | null) : null;
      hienTai = v && v.phien_ban === PHIEN_BAN_DONG_Y && typeof v.luc === "string" ? { phien_ban: v.phien_ban, luc: v.luc } : null;
    } catch {
      hienTai = null;
    }
  }
  return hienTai;
}
function bao() { nghe.forEach((f) => f()); }

/** Đồng ý còn hiệu lực (đúng bản hiện hành) hay không. */
export const daDongY = (): boolean => doc() !== null;

/** Người dùng bấm "Đồng ý…" trên form hồ sơ. */
export function ghiDongY(): DongYDuLieu {
  const moi: DongYDuLieu = { phien_ban: PHIEN_BAN_DONG_Y, luc: new Date().toISOString() };
  hienTai = moi; daDoc = true;
  try { window.localStorage.setItem(KHOA_DONG_Y_DL, JSON.stringify(moi)); } catch { /* chế độ riêng tư: chỉ giữ trong phiên */ }
  ghi("consent_given", { phien_ban: PHIEN_BAN_DONG_Y });
  bao();
  return moi;
}

/** Thu hồi đồng ý: xoá bản đồng ý VÀ hồ sơ trên máy (dữ liệu nhập theo đồng ý đó), quay về trạng thái đầu. */
export function thuHoiDongY(): void {
  hienTai = null; daDoc = true;
  try { window.localStorage.removeItem(KHOA_DONG_Y_DL); } catch { /* bỏ qua */ }
  xoaHoSo();
  ghi("consent_withdrawn");
  bao();
}

function dangKy(f: () => void) {
  nghe.add(f);
  const onStorage = (e: StorageEvent) => { if (e.key === KHOA_DONG_Y_DL) { daDoc = false; f(); } };
  window.addEventListener("storage", onStorage);
  return () => { nghe.delete(f); window.removeEventListener("storage", onStorage); };
}

/** `undefined` = đang hydrate · `null` = chưa đồng ý (hoặc bản cũ) · object = đã đồng ý bản hiện hành. */
export function useDongYDuLieu(): DongYDuLieu | null | undefined {
  return useSyncExternalStore(dangKy, doc, () => undefined);
}

/** "26/10/2026" — chỉ để hiển thị ngày đã đồng ý. */
export function ngayDongY(d: DongYDuLieu | null | undefined): string | null {
  if (!d) return null;
  const t = new Date(d.luc);
  return Number.isNaN(t.getTime()) ? null : t.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
