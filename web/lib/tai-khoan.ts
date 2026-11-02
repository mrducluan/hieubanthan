"use client";
// Tài khoản tuỳ chọn (UI-4): đăng nhập email/Google/SMS, lưu hồ sơ vào bảng ho_so khi người dùng
// ĐỒNG Ý, tải về máy khác, xoá hồ sơ/xoá tài khoản. Không lưu luận giải (CLAUDE.md).
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/trinh-duyet";
import { GIO_DAI_DIEN_KHONG_BIET, NUOC_NGOAI, ngaySinhIso, type HoSo } from "@/lib/hoso";

/** undefined = đang kiểm tra · null = chưa đăng nhập (hoặc tài khoản chưa bật). */
export function useNguoiDung(): User | null | undefined {
  const [u, setU] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    let huy = false;
    let boTheoDoi: (() => void) | undefined;
    void supabase().then((sb) => {
      if (huy) return;
      if (!sb) { setU(null); return; }
      sb.auth.getUser().then(({ data }) => { if (!huy) setU(data.user ?? null); });
      const { data } = sb.auth.onAuthStateChange((_e, s) => setU(s?.user ?? null));
      boTheoDoi = () => data.subscription.unsubscribe();
    });
    return () => { huy = true; boTheoDoi?.(); };
  }, []);
  return u;
}

export interface HangHoSo {
  ho_ten: string; ten_khac: string | null; ngay_sinh: string; gio_sinh: string | null;
  gioi_tinh: "nam" | "nu" | null; vung: "north" | "south" | null; cap_nhat_luc: string;
  // 0007 — có thể chưa chạy migration: đọc/ghi lùi về bộ cột 0006.
  noi_sinh?: string | null; gio_mua_he?: boolean; lich_nhap?: "duong" | "am";
  // 'unknown' từ 0015 (TV-V2 "Không biết giờ": gio_sinh để null — không lưu giờ đại diện như giờ thật).
  do_tin_gio?: "exact" | "approx" | "unknown" | null;
  am_ngay?: number | null; am_thang?: number | null; am_nam?: number | null; am_nhuan?: boolean;
  // 0033 (EN-6 BI-3) — múi giờ chuẩn nơi sinh, chỉ khi noi_sinh = 'nuoc_ngoai'. PostgREST trả numeric dạng số
  // (chuỗi nếu bật chế độ numeric-as-string) → luôn Number().
  utc_noi_sinh?: number | string | null;
}

const COT_0006 = "ho_ten,ten_khac,ngay_sinh,gio_sinh,gioi_tinh,vung,cap_nhat_luc";
const COT_0007 = `${COT_0006},noi_sinh,gio_mua_he,do_tin_gio,lich_nhap,am_ngay,am_thang,am_nam,am_nhuan`;
const COT_0033 = `${COT_0007},utc_noi_sinh`;

async function batBuoc() {
  const sb = await supabase();
  if (!sb) throw new Error("Tài khoản chưa được bật trên hệ thống.");
  return sb;
}

/** `cot_utc`: đọc được cột utc_noi_sinh (0033 đã chạy) — chưa chạy thì tài khoản không mang múi giờ, đừng coi là khác máy. */
export type HoSoTaiKhoan = Omit<HoSo, "v" | "tao_luc"> & { cap_nhat_luc: string; cot_utc?: boolean };

/** Múi giờ nơi sinh hợp lệ để lưu / đọc (−12…14, bước 0,25, chỉ khi sinh ở nước ngoài) — ngoài ra null. */
export function utcHopLe(noiSinh: string | null | undefined, v: unknown): number | null {
  const n = typeof v === "string" && v.trim() !== "" ? Number(v) : v;
  return noiSinh === NUOC_NGOAI && typeof n === "number" && Number.isFinite(n) && n >= -12 && n <= 14 && Number.isInteger(n * 4)
    ? n : null;
}

/** Dòng ho_so → hồ sơ máy. 'unknown' → giờ đại diện 12:00 (như form "Không biết giờ" lưu trên máy). */
export function hoSoTuHang(data: HangHoSo): HoSoTaiKhoan {
  const [nam, thang, ngay] = data.ngay_sinh.split("-").map(Number) as [number, number, number];
  const khongBiet = data.do_tin_gio === "unknown";
  const utc = utcHopLe(data.noi_sinh, data.utc_noi_sinh);
  const gio = khongBiet ? GIO_DAI_DIEN_KHONG_BIET : data.gio_sinh?.slice(0, 5);
  return {
    ho_ten: data.ho_ten, ngay, thang, nam,
    ...(data.ten_khac ? { ten_khac: data.ten_khac } : {}),
    ...(gio ? { gio } : {}),
    ...(data.gioi_tinh ? { gioi_tinh: data.gioi_tinh } : {}),
    ...(data.vung ? { vung: data.vung } : {}),
    ...(data.noi_sinh ? { noi_sinh: data.noi_sinh } : {}),
    ...(data.gio_mua_he ? { gio_mua_he: true } : {}),
    ...(data.do_tin_gio ? { do_tin_gio: data.do_tin_gio } : {}),
    ...(utc !== null ? { utc_noi_sinh: utc } : {}),
    ...("utc_noi_sinh" in data ? { cot_utc: true } : {}),
    ...(data.lich_nhap ? { lich_nhap: data.lich_nhap } : {}),
    ...(data.am_ngay && data.am_thang && data.am_nam
      ? { am: { ngay: data.am_ngay, thang: data.am_thang, nam: data.am_nam, nhuan: Boolean(data.am_nhuan) } } : {}),
    cap_nhat_luc: data.cap_nhat_luc,
  };
}

export async function hoSoTaiKhoan(userId: string): Promise<HoSoTaiKhoan | null> {
  const doc = async (cot: string) => (await batBuoc()).from("ho_so").select(cot).eq("user_id", userId).maybeSingle<HangHoSo>();
  let { data, error } = await doc(COT_0033);
  if (error) ({ data, error } = await doc(COT_0007));                    // chưa chạy 0033
  if (error) ({ data, error } = await doc(COT_0006));                    // chưa chạy 0007
  if (error) throw new Error("Không đọc được hồ sơ trong tài khoản.");
  return data ? hoSoTuHang(data) : null;
}

/** Postgres: vi phạm ràng buộc check (vd 0015 chưa chạy → do_tin_gio chưa nhận 'unknown'). */
const VI_PHAM_CHECK = "23514";

type Upsert = (hang: Record<string, unknown>) => PromiseLike<{ error: { code?: string } | null }>;

/** Ghi hồ sơ bằng `upsert` (tách khỏi Supabase để kiểm thử). Thứ tự lùi:
 *  0) đủ cột 0007 + utc_noi_sinh (0033); lỗi KHÁC vi phạm check (0033 chưa chạy, thiếu cột) → bỏ cột utc_noi_sinh, rồi:
 *  1) đủ cột 0007, 'unknown' thật (0015) · 2) chỉ khi vi phạm check (0015 chưa chạy) + không biết giờ: vẫn cột 0007,
 *  do_tin_gio null (như cũ) · 3) lỗi KHÁC ở lần 1 (0007 chưa chạy, thiếu cột): bộ cột 0006. */
export async function ghiHoSo(upsert: Upsert, userId: string, h: HoSo): Promise<void> {
  const khongBiet = h.do_tin_gio === "unknown";
  const co_ban = {
    user_id: userId, ho_ten: h.ho_ten, ten_khac: h.ten_khac ?? null, ngay_sinh: ngaySinhIso(h),
    gio_sinh: khongBiet ? null : h.gio ?? null, gioi_tinh: h.gioi_tinh ?? null, vung: h.vung ?? null, dong_y_luc: new Date().toISOString(),
  };
  const day_du = {
    ...co_ban, noi_sinh: h.noi_sinh ?? null, gio_mua_he: Boolean(h.gio_mua_he), do_tin_gio: h.do_tin_gio ?? null,
    lich_nhap: h.lich_nhap ?? "duong", am_ngay: h.am?.ngay ?? null, am_thang: h.am?.thang ?? null,
    am_nam: h.am?.nam ?? null, am_nhuan: Boolean(h.am?.nhuan),
  };
  // utc luôn gửi (null khi sinh trong nước) để đổi nơi sinh về tỉnh thì xoá múi giờ cũ.
  let hang: Record<string, unknown> = { ...day_du, utc_noi_sinh: utcHopLe(h.noi_sinh, h.utc_noi_sinh) };
  let { error } = await upsert(hang);
  if (error && error.code !== VI_PHAM_CHECK) ({ error } = await upsert(hang = day_du));   // chưa chạy 0033
  if (error?.code === VI_PHAM_CHECK) {
    if (khongBiet) ({ error } = await upsert({ ...hang, do_tin_gio: null }));      // chưa chạy 0015
  } else if (error) {
    ({ error } = await upsert(co_ban));                                           // chưa chạy 0007
  }
  if (error) throw new Error("Chưa lưu được vào tài khoản.");
}

export async function luuVaoTaiKhoan(userId: string, h: HoSo): Promise<void> {
  const sb = await batBuoc();
  await ghiHoSo((hang) => sb.from("ho_so").upsert(hang), userId, h);
}

export async function xoaHoSoTaiKhoan(userId: string): Promise<void> {
  const { error } = await (await batBuoc()).from("ho_so").delete().eq("user_id", userId);
  if (error) throw new Error("Chưa xoá được hồ sơ trong tài khoản.");
}

export async function dangXuat(): Promise<void> {
  // KC-4 GĐ1: máy dùng chung — đăng xuất thì thiết bị thôi nhận nhắc của tài khoản này (xoá khi phiên còn hiệu lực).
  await import("@/lib/web-push-trinh-duyet").then((m) => m.tatPush()).catch(() => null);
  await (await supabase())?.auth.signOut();
}

/** Xoá hẳn tài khoản (auth.users) → ho_so xoá theo (cascade). Route server dùng service role. */
export async function xoaTaiKhoan(): Promise<void> {
  const sb = await batBuoc();
  const { data } = await sb.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Phiên đăng nhập đã hết, đăng nhập lại để xoá.");
  const r = await fetch("/api/tai-khoan/xoa", { method: "POST", headers: { authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error("Chưa xoá được tài khoản. Thử lại sau.");
  await import("@/lib/web-push-trinh-duyet").then((m) => m.tatPush()).catch(() => null);   // bảng đã xoá theo; huỷ cả trên trình duyệt
  await sb.auth.signOut();
}
