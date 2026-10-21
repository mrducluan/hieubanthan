// CTA-1 — khối "Đọc tiếp về bạn" cuối phần xem: kiểu dữ liệu engine trả (/v1/goi-y-cheo) + cách dựng yêu cầu từ hồ sơ
// trên máy. Web không tính gì: mọi câu "luận giải nhỏ", nhãn, đường dẫn do engine ghép từ con số đã tính + KB.
import { z } from "zod";
import type { HoSo } from "@/lib/hoso";

export const MANG_TRANG = ["than_so", "tu_vi", "bat_tu", "phong_thuy", "kinh_dich", "hop_doi", "hom_nay", "xem_ngay",
  "tuoi_lam_nha", "tuoi_xong_dat"] as const;
export type MangTrang = (typeof MANG_TRANG)[number];

/** Mã mô-đun của khối "Cuối bài đọc" (đo lường Gate) → mã trang của khối gợi chéo. */
export const MANG_TU_MO_DUN: Record<string, MangTrang> = {
  thanso_sau: "than_so", thanso: "than_so", tuvi: "tu_vi", battu: "bat_tu", phongthuy: "phong_thuy",
  kinhdich: "kinh_dich", hopdoi: "hop_doi", hom_nay: "hom_nay", xem_ngay: "xem_ngay",
  tuoi_lam_nha: "tuoi_lam_nha", tuoi_xong_dat: "tuoi_xong_dat",
};

/** Trang có "Luận giải toàn bộ" (mở chương khoá bằng Sao, SAO-2) — mã mô-đun của báo cáo. */
export const LUAN_GIAI_CUA_TRANG: Partial<Record<MangTrang, string>> = { tu_vi: "tuvi", bat_tu: "battu", than_so: "thanso" };

export const TheGoiY = z.object({
  mang: z.string(),
  ten: z.string(),
  bieu_tuong: z.string(),
  nhan: z.string(),
  cau: z.string(),
  cau_hoi: z.string(),
  cta: z.string(),
  duong: z.string().regex(/^\/(?!\/)/),
  ca_nhan: z.boolean(),
  can_them: z.string().nullable(),
});
export type TheGoiY = z.infer<typeof TheGoiY>;

export const GoiYCheo = z.object({
  the: z.array(TheGoiY),
  ca_nhan: z.boolean(),
  /** Do route web thêm: công tắc thu Sao Luận giải toàn bộ + giá, có ví/tài khoản ủng hộ không. */
  thu_sao: z.boolean().optional(),
  gia_sao: z.number().optional(),
  ung_ho: z.boolean().optional(),
});
export type GoiYCheo = z.infer<typeof GoiYCheo>;

/** Thân yêu cầu từ hồ sơ trên máy (chưa có hồ sơ → chỉ mã trang: engine trả câu chung mời nhập). */
export function yeuCauGoiY(mang: MangTrang, hs: HoSo | null, quyUoc: "tong_het" | "tung_phan"): Record<string, unknown> {
  if (!hs) return { mang_hien_tai: mang };
  return {
    mang_hien_tai: mang, ngay: hs.ngay, thang: hs.thang, nam: hs.nam, ho_ten: hs.ten_khac ? [hs.ho_ten, hs.ten_khac] : [hs.ho_ten],
    quy_uoc_duong_doi: quyUoc,
    ...(hs.gio ? { gio: hs.gio } : {}),
    ...(hs.do_tin_gio ? { do_tin_gio: hs.do_tin_gio } : {}),
    ...(hs.gioi_tinh ? { gioi_tinh: hs.gioi_tinh } : {}),
    ...(hs.noi_sinh ? { noi_sinh: hs.noi_sinh } : {}),
    ...(hs.vung ? { vung: hs.vung } : {}),
    ...(hs.gio_mua_he ? { gio_mua_he: true } : {}),
  };
}

/** Tiêu đề khối — xoay theo ngày (đo `bien_the` để biết câu nào kéo người bấm hơn). */
export const TIEU_DE_KHOI = [
  { ma: "t0", lon: "Đọc tiếp về bạn", nho: "Ba mảnh khác của chính bạn — mỗi mảnh một câu viết riêng từ ngày sinh." },
  { ma: "t1", lon: "Bạn còn những mảnh nào?", nho: "Cùng ngày sinh ấy, mỗi môn nhìn bạn ở một góc khác." },
  { ma: "t2", lon: "Điều ngày sinh còn kể về bạn", nho: "Đọc thử một câu — thấy đúng thì bấm xem trọn." },
] as const;

/** Chỉ số xoay theo ngày (giờ Việt Nam) — ổn định trong ngày, đổi qua ngày. Không phải phép tính huyền học. */
export function chiSoNgay(n: number, lech = 0): number {
  const d = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh" }).format(new Date());
  const so = Math.floor(Date.parse(`${d}T00:00:00Z`) / 86_400_000);
  return (((so + lech) % n) + n) % n;
}
