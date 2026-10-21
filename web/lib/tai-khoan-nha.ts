"use client";
// KC-2 — đồng bộ "hồ sơ nhà" vào tài khoản (bảng ho_so_nha, migration 0018, RLS chủ sở hữu). Chỉ khi người dùng bấm
// "Lưu nhà vào tài khoản" (đồng ý rõ ràng → dong_y_luc). Bảng chưa có (0018 chưa chạy) → báo lỗi nhẹ, không vỡ.
import { supabase } from "@/lib/supabase/trinh-duyet";
import { HoSoNha, type HoSoNha as HoSoNhaT } from "@/lib/ho-so-nha";

async function batBuoc() {
  const sb = await supabase();
  if (!sb) throw new Error("Tài khoản chưa được bật trên hệ thống.");
  return sb;
}

export async function luuNhaVaoTaiKhoan(userId: string, nha: HoSoNhaT): Promise<void> {
  const sb = await batBuoc();
  const { cap_nhat_luc: _bo, ...du_lieu } = nha;
  const { error } = await sb.from("ho_so_nha").upsert({ user_id: userId, du_lieu, dong_y_luc: new Date().toISOString() });
  if (error) throw new Error("Chưa lưu được nhà vào tài khoản (có thể máy chủ chưa bật tính năng này).");
}

export async function nhaTaiKhoan(userId: string): Promise<HoSoNhaT | null> {
  const sb = await batBuoc();
  const { data, error } = await sb.from("ho_so_nha").select("du_lieu,cap_nhat_luc").eq("user_id", userId).maybeSingle<{ du_lieu: unknown; cap_nhat_luc: string }>();
  if (error || !data) return null;
  const kq = HoSoNha.safeParse({ ...(data.du_lieu as object), v: 1, cap_nhat_luc: data.cap_nhat_luc });
  return kq.success ? kq.data : null;
}

export async function xoaNhaTaiKhoan(userId: string): Promise<void> {
  const { error } = await (await batBuoc()).from("ho_so_nha").delete().eq("user_id", userId);
  if (error) throw new Error("Chưa xoá được nhà trong tài khoản.");
}
