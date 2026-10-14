"use client";
// Sao — credit nội bộ (CR-C). Mọi cộng/trừ đi qua hàm SQL SECURITY DEFINER (migration 0008): client chỉ gọi
// và đọc sổ cái của chính mình. Sao KHÔNG đổi ra tiền, KHÔNG chuyển nhượng.
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/trinh-duyet";

export interface DongSao { id: number; so_luong: number; loai: string; ghi_chu: string | null; het_han: string | null; tao_luc: string }
export type KetQuaThuong = "da_thuong" | "da_nhan" | "tu_moi" | "khong_hop_le" | "tai_khoan_cu" | "chua_luu_ho_so";

export const TEN_LOAI: Record<string, string> = {
  chao_mung: "Chào mừng", moi_ban: "Mời bạn", duoc_moi: "Nhận lời mời", dung: "Đã dùng", mua: "Mua", dieu_chinh: "Điều chỉnh", nhiem_vu: "Nhiệm vụ",
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

export async function nhanThuongGioiThieu(ma: string): Promise<{ ket_qua: KetQuaThuong; sao?: number }> {
  const { data, error } = await (await sb()).rpc("nhan_thuong_gioi_thieu", { p_ma: ma });
  if (error) throw new Error("Chưa nhận được Sao giới thiệu.");
  return data as { ket_qua: KetQuaThuong; sao?: number };
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
