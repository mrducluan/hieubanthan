"use client";
// KC-4 — mốc nhắc trong tài khoản (bảng nhac_viec, migration 0018, RLS chủ sở hữu, ≤ 50). Chỉ khi người dùng bấm
// "Cả trên tài khoản". Bảng chưa có → ném lỗi nhẹ, nơi gọi bỏ qua.
import { supabase } from "@/lib/supabase/trinh-duyet";
import { NhacViec, type NhacViec as NhacViecT } from "@/lib/nhac-viec";

async function batBuoc() {
  const sb = await supabase();
  if (!sb) throw new Error("Tài khoản chưa được bật trên hệ thống.");
  return sb;
}
export async function luuNhacTaiKhoan(userId: string, n: NhacViecT): Promise<void> {
  const sb = await batBuoc();
  const { error } = await sb.from("nhac_viec").upsert({ user_id: userId, ngay: n.ngay, ma: n.ma, mo_dun: n.mo_dun, nhan: n.nhan, duong: n.duong ?? null }, { onConflict: "user_id,ngay,ma" });
  if (error) throw new Error("Chưa lưu được vào tài khoản (máy chủ có thể chưa bật tính năng này).");
}
export async function nhacTaiKhoan(userId: string): Promise<NhacViecT[]> {
  const sb = await batBuoc();
  const { data, error } = await sb.from("nhac_viec").select("ngay,ma,mo_dun,nhan,duong,tao_luc").eq("user_id", userId).order("ngay");
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((h) => NhacViec.safeParse({ ...h, id: `${h.ngay}|${h.ma}`, duong: h.duong ?? undefined })).filter((k) => k.success).map((k) => k.data);
}
export async function xoaNhacTaiKhoan(userId: string, ngay: string, ma: string): Promise<void> {
  await (await batBuoc()).from("nhac_viec").delete().eq("user_id", userId).eq("ngay", ngay).eq("ma", ma);
}
