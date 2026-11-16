"use client";
// GD-1 đợt 3 — đồng bộ "Nhà mình" vào tài khoản (bảng gia_dinh, migration 0039, RLS chủ sở hữu). Chỉ khi người dùng bấm
// "Lưu nhà mình vào tài khoản" và tự tích đồng ý. CHỈ lớp cơ bản: vai + năm sinh + giới tính — tên gọi và ngày sinh ở lại
// máy (DB cũng tự chặn mọi khoá khác). Bảng chưa có (0039 chưa chạy) → báo lỗi nhẹ, không vỡ.
import { supabase } from "@/lib/supabase/trinh-duyet";
import { VAI_GIA_DINH, type NguoiNha } from "@/lib/gia-dinh";

export type NguoiNhaTk = Pick<NguoiNha, "vai" | "nam_sinh" | "gioi_tinh">;

async function batBuoc() {
  const sb = await supabase();
  if (!sb) throw new Error("Tài khoản chưa được bật trên hệ thống.");
  return sb;
}

/** Lớp cơ bản gửi lên tài khoản — bỏ tên gọi, ngày sinh, mã trên máy. */
export function lopCoBan(ds: NguoiNha[]): NguoiNhaTk[] {
  return ds.map((x) => ({ vai: x.vai, nam_sinh: x.nam_sinh, ...(x.gioi_tinh ? { gioi_tinh: x.gioi_tinh } : {}) }));
}

export async function luuGiaDinhTaiKhoan(userId: string, ds: NguoiNha[]): Promise<void> {
  if (!ds.length) throw new Error("Chưa có người nhà nào để lưu.");
  const { error } = await (await batBuoc()).from("gia_dinh").upsert({ user_id: userId, du_lieu: lopCoBan(ds), dong_y_luc: new Date().toISOString() });
  if (error) throw new Error("Chưa lưu được vào tài khoản (có thể máy chủ chưa bật tính năng này).");
}

export async function giaDinhTaiKhoan(userId: string): Promise<NguoiNhaTk[] | null> {
  const { data, error } = await (await batBuoc()).from("gia_dinh").select("du_lieu").eq("user_id", userId).maybeSingle<{ du_lieu: unknown }>();
  if (error || !data || !Array.isArray(data.du_lieu)) return null;
  const ra: NguoiNhaTk[] = [];
  for (const x of data.du_lieu as Record<string, unknown>[]) {
    const vai = VAI_GIA_DINH.find((v) => v === x?.vai), nam = Number(x?.nam_sinh);
    if (!vai || !Number.isInteger(nam)) continue;
    ra.push({ vai, nam_sinh: nam, ...(x.gioi_tinh === "nam" || x.gioi_tinh === "nu" ? { gioi_tinh: x.gioi_tinh } : {}) });
  }
  return ra.length ? ra : null;
}

export async function xoaGiaDinhTaiKhoan(userId: string): Promise<void> {
  const { error } = await (await batBuoc()).from("gia_dinh").delete().eq("user_id", userId);
  if (error) throw new Error("Chưa xoá được người nhà trong tài khoản.");
}
