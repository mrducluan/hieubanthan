"use client";
// TS-V3 tầng HỌC — ký ức người dùng: điều bạn CHỦ ĐỘNG bấm "Ghi nhớ" (mã câu băn khoăn), lưu trong bảng
// ky_uc_nguoi_dung (migration 0015, RLS chủ sở hữu, xoá được ngay, tự hết hạn 180 ngày). Chỉ khi đã đăng nhập; chưa bật
// tài khoản / chưa đăng nhập → tính năng ẩn. Dùng để nhắc "lần trước bạn băn khoăn…" khi quay lại, không dùng huấn luyện.
import { useCallback, useEffect, useState } from "react";
import { coTaiKhoan, supabase } from "@/lib/supabase/trinh-duyet";

export interface KyUc { id: number; tru: string; ma_cau: string | null; tao_luc: string }

export function useKyUc() {
  const [dangNhap, setDangNhap] = useState(false);
  const [ds, setDs] = useState<KyUc[]>([]);
  const tai = useCallback(async () => {
    const sb = await supabase();
    if (!sb) return;
    const { data: { user } } = await sb.auth.getUser();
    setDangNhap(Boolean(user));
    if (!user) return;
    const { data } = await sb.from("ky_uc_nguoi_dung").select("id, tru, ma_cau, tao_luc").order("tao_luc", { ascending: false }).limit(5);
    setDs((data as KyUc[] | null) ?? []);
  }, []);
  useEffect(() => { if (coTaiKhoan()) void tai(); }, [tai]);
  async function them(tru: string, ma_cau: string) {
    const sb = await supabase();
    if (!sb) return;
    await sb.from("ky_uc_nguoi_dung").insert({ tru, ma_cau });
    await tai();
  }
  async function xoa(id: number) {
    const sb = await supabase();
    if (!sb) return;
    await sb.from("ky_uc_nguoi_dung").delete().eq("id", id);
    setDs((d) => d.filter((x) => x.id !== id));
  }
  return { dangNhap, ds, them, xoa };
}
