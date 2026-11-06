"use client";
// Thoả thuận xử lý dữ liệu GƯƠNG MẶT ở trang Nhân tướng học (Luật BVDLCN 91/2025: đồng ý RIÊNG, rõ ràng, theo TỪNG mục đích,
// không tích sẵn, rút được). Hai mục đích, hai thoả thuận — khác người nhận nên không gộp:
//  • ANH-2 "đo trên ảnh" (`dm1`): ảnh KHÔNG rời máy; chỉ toạ độ các điểm mốc người dùng tự chấm (+ tỉ lệ khung ảnh) đi qua
//    máy chủ tính toán của Hiểu Bản Thân một lượt để đo tỉ lệ, không lưu. Không có bên thứ ba.
//  • ANH-1 "máy AI gợi ý" (`am1`): ≤ 3 ảnh (đã thu nhỏ, bỏ EXIF trên máy) đi qua máy chủ tới dịch vụ AI nhận diện bên thứ ba
//    một lượt; không lưu, không huấn luyện.
// Mỗi thoả thuận lưu trên máy `{ phien_ban, luc }`; đổi phiên bản khi nội dung xử lý đổi → hỏi lại. `xoaHoSo()` xoá cả hai
// (KHOA_THEO_HO_SO). Chỉ gửi mã bản lên đo lường.
import { useSyncExternalStore } from "react";
import { ghi } from "@/lib/do-luong";

export interface DongYAnhMat { phien_ban: string; luc: string }

function taoDongY(khoa: string, phienBan: string) {
  const nghe = new Set<() => void>();
  let daDoc = false;
  let hienTai: DongYAnhMat | null = null;
  const doc = (): DongYAnhMat | null => {
    if (typeof window === "undefined") return null;
    if (!daDoc) {
      daDoc = true;
      try {
        const raw = window.localStorage.getItem(khoa);
        const v = raw ? (JSON.parse(raw) as Partial<DongYAnhMat> | null) : null;
        hienTai = v && v.phien_ban === phienBan && typeof v.luc === "string" ? { phien_ban: v.phien_ban, luc: v.luc } : null;
      } catch { hienTai = null; }
    }
    return hienTai;
  };
  const bao = () => nghe.forEach((f) => f());
  const dangKy = (f: () => void) => {
    nghe.add(f);
    const khac = (e: StorageEvent) => { if (e.key === khoa || e.key === null) { daDoc = false; f(); } };
    window.addEventListener("storage", khac);
    return () => { nghe.delete(f); window.removeEventListener("storage", khac); };
  };
  return {
    khoa, phienBan,
    da: (): boolean => doc() !== null,
    /** Ghi đúng lúc người dùng bấm hành động, theo ô họ vừa tích. */
    ghi: (): DongYAnhMat => {
      const moi: DongYAnhMat = { phien_ban: phienBan, luc: new Date().toISOString() };
      hienTai = moi; daDoc = true;
      try { window.localStorage.setItem(khoa, JSON.stringify(moi)); } catch { /* chế độ riêng tư */ }
      ghi("consent_given", { phien_ban: phienBan });
      bao();
      return moi;
    },
    thuHoi: (): void => {
      hienTai = null; daDoc = true;
      try { window.localStorage.removeItem(khoa); } catch { /* bỏ qua */ }
      ghi("consent_withdrawn", { phien_ban: phienBan });
      bao();
    },
    /** `undefined` lúc SSR / chưa đọc, `null` = chưa đồng ý. */
    use: (): DongYAnhMat | null | undefined => useSyncExternalStore(dangKy, doc, () => undefined),
  };
}

export const KHOA_DONG_Y_DO_MAT = "hbt.dong_y_do_mat.v1";
export const KHOA_DONG_Y_ANH_MAT = "hbt.dong_y_anh_mat.v1";
/** ANH-2: đo trên ảnh (chỉ điểm mốc, không ảnh). Không chứa 4 chữ số liền. */
export const DONG_Y_DO_MAT = taoDongY(KHOA_DONG_Y_DO_MAT, "dm1");
/** ANH-1: gửi ảnh cho dịch vụ AI bên thứ ba. */
export const DONG_Y_ANH_AI = taoDongY(KHOA_DONG_Y_ANH_MAT, "am1");

export function ngayDongYAnhMat(d: DongYAnhMat | null | undefined): string | null {
  if (!d) return null;
  const t = new Date(d.luc);
  return Number.isNaN(t.getTime()) ? null : t.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}
