"use client";
// Tài khoản tuỳ chọn (UI-4): đăng nhập email/Google/SMS, lưu hồ sơ vào bảng ho_so khi người dùng
// ĐỒNG Ý, tải về máy khác, xoá hồ sơ/xoá tài khoản. Không lưu luận giải (CLAUDE.md).
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/trinh-duyet";
import { ngaySinhIso, type HoSo } from "@/lib/hoso";

/** undefined = đang kiểm tra · null = chưa đăng nhập (hoặc tài khoản chưa bật). */
export function useNguoiDung(): User | null | undefined {
  const [u, setU] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    const sb = supabase();
    if (!sb) { setU(null); return; }
    sb.auth.getUser().then(({ data }) => setU(data.user ?? null));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setU(s?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return u;
}

interface HangHoSo {
  ho_ten: string; ten_khac: string | null; ngay_sinh: string; gio_sinh: string | null;
  gioi_tinh: "nam" | "nu" | null; vung: "north" | "south" | null; cap_nhat_luc: string;
  // 0007 — có thể chưa chạy migration: đọc/ghi lùi về bộ cột 0006.
  noi_sinh?: string | null; gio_mua_he?: boolean; do_tin_gio?: "exact" | "approx" | null; lich_nhap?: "duong" | "am";
  am_ngay?: number | null; am_thang?: number | null; am_nam?: number | null; am_nhuan?: boolean;
}

const COT_0006 = "ho_ten,ten_khac,ngay_sinh,gio_sinh,gioi_tinh,vung,cap_nhat_luc";
const COT_0007 = `${COT_0006},noi_sinh,gio_mua_he,do_tin_gio,lich_nhap,am_ngay,am_thang,am_nam,am_nhuan`;

function batBuoc() {
  const sb = supabase();
  if (!sb) throw new Error("Tài khoản chưa được bật trên hệ thống.");
  return sb;
}

export async function hoSoTaiKhoan(userId: string): Promise<(Omit<HoSo, "v" | "tao_luc"> & { cap_nhat_luc: string }) | null> {
  const doc = (cot: string) => batBuoc().from("ho_so").select(cot).eq("user_id", userId).maybeSingle<HangHoSo>();
  let { data, error } = await doc(COT_0007);
  if (error) ({ data, error } = await doc(COT_0006));
  if (error) throw new Error("Không đọc được hồ sơ trong tài khoản.");
  if (!data) return null;
  const [nam, thang, ngay] = data.ngay_sinh.split("-").map(Number) as [number, number, number];
  return {
    ho_ten: data.ho_ten, ngay, thang, nam,
    ...(data.ten_khac ? { ten_khac: data.ten_khac } : {}),
    ...(data.gio_sinh ? { gio: data.gio_sinh.slice(0, 5) } : {}),
    ...(data.gioi_tinh ? { gioi_tinh: data.gioi_tinh } : {}),
    ...(data.vung ? { vung: data.vung } : {}),
    ...(data.noi_sinh ? { noi_sinh: data.noi_sinh } : {}),
    ...(data.gio_mua_he ? { gio_mua_he: true } : {}),
    ...(data.do_tin_gio ? { do_tin_gio: data.do_tin_gio } : {}),
    ...(data.lich_nhap ? { lich_nhap: data.lich_nhap } : {}),
    ...(data.am_ngay && data.am_thang && data.am_nam
      ? { am: { ngay: data.am_ngay, thang: data.am_thang, nam: data.am_nam, nhuan: Boolean(data.am_nhuan) } } : {}),
    cap_nhat_luc: data.cap_nhat_luc,
  };
}

export async function luuVaoTaiKhoan(userId: string, h: HoSo): Promise<void> {
  const co_ban = {
    user_id: userId, ho_ten: h.ho_ten, ten_khac: h.ten_khac ?? null, ngay_sinh: ngaySinhIso(h),
    gio_sinh: h.gio ?? null, gioi_tinh: h.gioi_tinh ?? null, vung: h.vung ?? null, dong_y_luc: new Date().toISOString(),
  };
  let { error } = await batBuoc().from("ho_so").upsert({
    ...co_ban, noi_sinh: h.noi_sinh ?? null, gio_mua_he: Boolean(h.gio_mua_he), do_tin_gio: h.do_tin_gio ?? null,
    lich_nhap: h.lich_nhap ?? "duong", am_ngay: h.am?.ngay ?? null, am_thang: h.am?.thang ?? null,
    am_nam: h.am?.nam ?? null, am_nhuan: Boolean(h.am?.nhuan),
  });
  if (error) ({ error } = await batBuoc().from("ho_so").upsert(co_ban));   // chưa chạy 0007
  if (error) throw new Error("Chưa lưu được vào tài khoản.");
}

export async function xoaHoSoTaiKhoan(userId: string): Promise<void> {
  const { error } = await batBuoc().from("ho_so").delete().eq("user_id", userId);
  if (error) throw new Error("Chưa xoá được hồ sơ trong tài khoản.");
}

export async function dangXuat(): Promise<void> {
  await supabase()?.auth.signOut();
}

/** Xoá hẳn tài khoản (auth.users) → ho_so xoá theo (cascade). Route server dùng service role. */
export async function xoaTaiKhoan(): Promise<void> {
  const sb = batBuoc();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Phiên đăng nhập đã hết, đăng nhập lại để xoá.");
  const r = await fetch("/api/tai-khoan/xoa", { method: "POST", headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error("Chưa xoá được tài khoản. Thử lại sau.");
  await sb.auth.signOut();
}
