// HG-1 — kiểu dữ liệu của "Hỏi gì xem nấy" (khớp engine `/v1/phongthuy/hoi-gi`) + dựng đầu vào `nha` từ hồ sơ nhà trên máy.
// Tệp thuần (không React): web chỉ chuyển dữ kiện người dùng đã khai, không tính gì.
import { boCucGui, namXayGui, type HoSoNha } from "@/lib/ho-so-nha";
import type { Muc } from "@/components/luan-giai/kieu";

export const MA_CAU = ["cua_chinh", "bo_cuc", "gia_dinh", "han_nam", "so_sanh", "mo_quan"] as const;
export type MaCau = (typeof MA_CAU)[number];
export const laMaCau = (x: unknown): x is MaCau => typeof x === "string" && (MA_CAU as readonly string[]).includes(x);

export interface CauHoi { ma: MaCau; tieu_de: string; mo_ta: string; can: string[]; cau_chat: string }
export interface DanhMuc { cau_hoi: CauHoi[]; luu_y: string }

export type MaThieu = "huong" | "sinh" | "nguoi_2" | "dau_hieu";
export interface HoiNhanh { ma: string; hoi: string; tra_loi: boolean | null }
export interface Diem { ma: string; tieu_de: string; nen_xu_ly_truoc: boolean; giai_thich: string; trang?: string | null }
export interface HaiNguoi { cung_nhom: boolean; huong_chung: string[]; huong: { huong: string; a_hop: boolean; b_hop: boolean }[] }
export interface LuoiNam { nam: number; can_chi: string; o: { cung: string; phuong: string; sao: number; nhan: string | null }[] }
export interface TraLoi {
  ma: MaCau; tieu_de: string; rieng: boolean; muc: Muc | null;
  thieu: { ma: MaThieu; loi: string }[];
  tra_loi: string; y: { nhan: string; noi_dung: string }[]; viec: string[]; vi_sao: string[]; nguon: string; cau_chat: string;
  lien_ket: { nhan: string; duong?: string; neo?: string }[]; luu_y: string;
  hoi_nhanh?: HoiNhanh[]; diem?: Diem[]; hai_nguoi?: HaiNguoi; luoi_nam?: LuoiNam;
  ten_hien?: import("@/lib/ten-hien").TenHien;
}
export interface Nguoi2 { nam: number; gioi_tinh: "nam" | "nu" }

type DauHieuGui = { co: boolean; nguon?: "nguoi_dung" | "anh" | "video"; xac_nhan?: boolean };
export interface NhaHoiGi {
  huong_do?: number; huong?: string; nam_xay?: number; van_xay?: number; loai_nha?: string;
  bo_cuc?: { dau_hieu?: Record<string, DauHieuGui>; vi_tri?: Record<string, string> };
}

const MA_DAU_HIEU = /^[a-z0-9_]{2,40}$/, MA_PHONG = /^[a-z_]{2,30}$/;

/** Đầu vào `nha` của câu hỏi: đúng những gì hồ sơ nhà đang có — hướng, năm xây (chỉ khi người dùng đã nhập), loại nhà,
 *  dấu hiệu đã trả lời có / không và vị trí phòng. Dùng lại `boCucGui` (cùng cách gửi dấu hiệu với "Nhà của bạn"). */
export function nhaHoiGi(n: HoSoNha | null | undefined): NhaHoiGi | undefined {
  if (!n) return undefined;
  const bc = boCucGui(n) as { dau_hieu?: Record<string, DauHieuGui>; vi_tri?: Record<string, string> } | null;
  const dau_hieu = Object.fromEntries(Object.entries(bc?.dau_hieu ?? {}).filter(([k]) => MA_DAU_HIEU.test(k)));
  const vi_tri = Object.fromEntries(Object.entries(bc?.vi_tri ?? {}).filter(([k, v]) => MA_PHONG.test(k) && typeof v === "string" && v.length <= 20));
  const bo_cuc = {
    ...(Object.keys(dau_hieu).length ? { dau_hieu } : {}),
    ...(Object.keys(vi_tri).length ? { vi_tri } : {}),
  };
  const nha: NhaHoiGi = {
    ...(n.huong_do != null ? { huong_do: n.huong_do } : n.huong ? { huong: n.huong } : {}),
    ...namXayGui(n),
    ...(n.loai_nha ? { loai_nha: n.loai_nha } : {}),
    ...(Object.keys(bo_cuc).length ? { bo_cuc } : {}),
  };
  return Object.keys(nha).length ? nha : undefined;
}

/** Câu trả lời có / không của người dùng cho một dấu hiệu, đọc từ hồ sơ nhà (null = chưa trả lời). */
export function daTraLoi(n: HoSoNha | null | undefined, ma: string): boolean | null {
  const b = n?.bo_cuc;
  if (b?.dau_hieu?.includes(ma)) return true;
  if (b?.khai_khong?.includes(ma) || b?.da_xu_ly?.includes(ma)) return false;
  return null;
}

/** Khối `bo_cuc` mới sau khi người dùng trả lời có / không một dấu hiệu — cùng các trường Khảo sát nhà dùng
 *  (`dau_hieu` = có · `khai_khong` = không); các trường khác của bố cục giữ nguyên. */
export function boCucSauTraLoi(n: HoSoNha | null | undefined, ma: string, co: boolean): NonNullable<HoSoNha["bo_cuc"]> {
  const b = n?.bo_cuc ?? {};
  const bo = (ds: string[] | undefined) => (ds ?? []).filter((m) => m !== ma);
  const dau_hieu = co ? [...bo(b.dau_hieu), ma] : bo(b.dau_hieu);
  const khai_khong = co ? bo(b.khai_khong) : [...bo(b.khai_khong), ma];
  const tu_anh = co ? b.tu_anh : bo(b.tu_anh);
  const da_xu_ly = bo(b.da_xu_ly);
  return {
    ...b, dau_hieu,
    khai_khong: khai_khong.length ? khai_khong : undefined,
    tu_anh: tu_anh?.length ? tu_anh : undefined,
    da_xu_ly: da_xu_ly.length ? da_xu_ly : undefined,
  };
}

/** Ngày hôm nay theo đồng hồ máy (YYYY-MM-DD). */
export function homNayMay(d = new Date()): string {
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
