"use client";
// Sao — credit nội bộ (CR-C). Mọi cộng/trừ đi qua hàm SQL SECURITY DEFINER (migration 0008): client chỉ gọi
// và đọc sổ cái của chính mình. Sao KHÔNG đổi ra tiền, KHÔNG chuyển nhượng.
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/trinh-duyet";

export interface DongSao { id: number; so_luong: number; loai: string; ghi_chu: string | null; het_han: string | null; tao_luc: string }
export type KetQuaThuong = "da_thuong" | "da_nhan" | "tu_moi" | "khong_hop_le" | "tai_khoan_cu" | "chua_luu_ho_so" | "moi_vong";

export const TEN_LOAI: Record<string, string> = {
  chao_mung: "Chào mừng", moi_ban: "Mời bạn", duoc_moi: "Nhận lời mời", dung: "Đã dùng", mua: "Mua", dieu_chinh: "Điều chỉnh", nhiem_vu: "Nhiệm vụ",
  hoa_hong: "Hoa hồng", chuoi: "Chuỗi ngày ghé",
};

async function sb() {
  const c = await supabase();
  if (!c) throw new Error("Tài khoản chưa được bật.");
  return c;
}

// Mã giới thiệu (lưu trên máy) tách ra lib/ma-gioi-thieu.ts để layout không kéo theo thư viện Supabase.
export { ghiMaGioiThieuTuUrl, maGioiThieuDaNho, quenMaGioiThieu } from "@/lib/ma-gioi-thieu";

export async function soDu(): Promise<number> {
  const { data, error } = await (await sb()).rpc("so_du_sao");
  if (error) throw new Error("Chưa đọc được số Sao.");
  return data as number;
}

export async function lichSu(): Promise<DongSao[]> {
  const { data, error } = await (await sb()).from("so_cai_sao").select("id,so_luong,loai,ghi_chu,het_han,tao_luc")
    .order("tao_luc", { ascending: false }).limit(20);
  if (error) throw new Error("Chưa đọc được lịch sử Sao.");
  return data as DongSao[];
}

export async function layMaCuaToi(): Promise<string> {
  const { data, error } = await (await sb()).rpc("lay_ma_gioi_thieu");
  if (error) throw new Error("Chưa tạo được mã mời.");
  return data as string;
}

export async function nhanChaoMung(): Promise<{ ket_qua: KetQuaThuong; sao?: number }> {
  const { data, error } = await (await sb()).rpc("nhan_chao_mung");
  if (error) throw new Error("Chưa nhận được Sao chào mừng.");
  return data as { ket_qua: KetQuaThuong; sao?: number };
}

/** SAO-GL (0026): nhận thưởng mời đi qua máy chủ (`/api/sao/nhan-thuong`) để gắn mã băm thiết bị — trình duyệt không
 *  tự tính được. Máy chủ gọi hàm SQL bằng phiên của chính người dùng. */
export async function nhanThuongGioiThieu(ma: string): Promise<{ ket_qua: KetQuaThuong; sao?: number }> {
  const res = await fetch("/api/sao/nhan-thuong", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ma }),
  });
  if (!res.ok) throw new Error("Chưa nhận được Sao giới thiệu.");
  return (await res.json()) as { ket_qua: KetQuaThuong; sao?: number };
}

/** Mã mời của người đang đăng nhập (null nếu chưa đăng nhập / chưa bật tài khoản / chưa chạy 0008). */
export function useMaCuaToi(dangNhap: boolean): string | null {
  const [ma, setMa] = useState<string | null>(null);
  useEffect(() => {
    if (!dangNhap) { setMa(null); return; }
    let huy = false;
    layMaCuaToi().then((m) => { if (!huy) setMa(m); }).catch(() => { /* chưa chạy 0008: link vẫn chạy, không kèm mã */ });
    return () => { huy = true; };
  }, [dangNhap]);
  return ma;
}

// ---------------------------------------------------------------- SAO-V (migration 0025)
/** Ví chi tiết: Sao mua (không hết hạn) và Sao tặng (hạn 365 ngày) trong số dư. Tiêu luôn trừ Sao tặng trước. */
export interface ViChiTiet { so_du: number; sao_mua: number; sao_tang: number }
export async function viChiTiet(): Promise<ViChiTiet> {
  const { data, error } = await (await sb()).rpc("vi_sao_chi_tiet");
  if (error) throw new Error("Chưa đọc được ví Sao.");
  return data as ViChiTiet;
}

/** Hoa hồng của người mời: chỉ ngày + số Sao + trạng thái (không lộ bạn nào nạp, không số tiền). */
export interface HoaHong {
  bat: boolean; phan_tram: number; so_don: number; thang: number; ban_da_moi: number; tong_sao: number;
  lan: { ngay: string; sao: number; trang_thai: "da_cong" | "qua_tran" | "thu_hoi" }[];
}
export async function hoaHongCuaToi(): Promise<HoaHong> {
  const { data, error } = await (await sb()).rpc("hoa_hong_cua_toi");
  if (error) throw new Error("Chưa đọc được hoa hồng.");
  return data as HoaHong;
}

/** Chuỗi ngày ghé (giờ VN). Gọi nhiều lần trong ngày không cộng thêm. */
export interface DiemDanh { ngay: string; chuoi: number; dai_nhat: number; moi: boolean; bat: boolean; moc: number; sao_moc: number; con_ngay: number; sao: number }
export async function diemDanh(): Promise<DiemDanh> {
  const { data, error } = await (await sb()).rpc("diem_danh");
  if (error) throw new Error("Chưa ghi được ngày ghé.");
  return data as DiemDanh;
}

/** Tặng một chương (quà là nội dung, không phải Sao). */
export type MoDunQua = "tuvi" | "battu" | "thanso";
export type KetQuaQua = "da_tao" | "chua_mo" | "chua_mo_bao_cao" | "het_luot" | "khong_hop_le";
export async function taoQuaChuong(moDun: MoDunQua): Promise<{ ket_qua: KetQuaQua; ma?: string; het_han?: string; con_lai?: number; tran?: number }> {
  const { data, error } = await (await sb()).rpc("tao_qua_chuong", { p_mo_dun: moDun });
  if (error) throw new Error("Chưa tạo được quà.");
  return data as { ket_qua: KetQuaQua; ma?: string; het_han?: string; con_lai?: number; tran?: number };
}
export type KetQuaNhanQua = "da_nhan" | "tu_tang" | "da_dung" | "het_han" | "chua_luu_ho_so" | "da_co_qua" | "khong_hop_le";
export async function nhanQuaChuong(ma: string): Promise<{ ket_qua: KetQuaNhanQua; mo_dun?: MoDunQua }> {
  const { data, error } = await (await sb()).rpc("nhan_qua_chuong", { p_ma: ma });
  if (error) throw new Error("Chưa nhận được quà.");
  return data as { ket_qua: KetQuaNhanQua; mo_dun?: MoDunQua };
}
export interface QuaCuaToi {
  bat: boolean; tran: number; da_gui_30_ngay: number; co_the_tang: boolean;
  gui: { ma: string; mo_dun: MoDunQua; het_han: string; da_nhan: boolean }[];
  nhan: { mo_dun: MoDunQua; den: string }[];
}
export async function quaCuaToi(): Promise<QuaCuaToi> {
  const { data, error } = await (await sb()).rpc("qua_cua_toi");
  if (error) throw new Error("Chưa đọc được quà.");
  return data as QuaCuaToi;
}
