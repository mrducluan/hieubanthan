"use client";
// KV-THANG — một dòng "Hội viên năm · tới dd/mm/yyyy" ở Bản thân (RIÊNG TƯ, không lên thẻ chia sẻ): trước chỉ có ở /tai-khoan.
// Chưa bật tài khoản / chưa đăng nhập / DB chưa chạy 0028 / không là hội viên → ẩn. Không nhắc gia hạn ở đây (đã có ở Tài khoản).
import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { coTaiKhoan, supabase } from "@/lib/supabase/trinh-duyet";
import { docHoiVien, ngayVn, TEN_HANG, type HoiVien } from "@/lib/thanh-toan/hoi-vien";

export function DongHoiVien({ className = "" }: { className?: string }) {
  const [hv, setHv] = useState<HoiVien | null>(null);
  useEffect(() => {
    if (!coTaiKhoan()) return;
    let huy = false;
    void (async () => {
      const sb = await supabase();
      const uid = (await sb?.auth.getSession())?.data.session?.user.id;
      if (!sb || !uid) return;
      const { data, error } = await sb.rpc("hoi_vien_cua_toi");
      if (!huy && !error) setHv(docHoiVien(data));
    })().catch(() => null);
    return () => { huy = true; };
  }, []);
  if (!hv || !hv.dang_la) return null;
  return (
    <Link href="/tai-khoan" className={`inline-flex flex-wrap items-center gap-1.5 rounded-2xl border border-jade/40 bg-jade/5 px-3 py-1.5 text-sm text-fg-muted hover:border-jade hover:text-fg ${className}`} data-testid="dong-hoi-vien">
      <BadgeCheck className="size-4 shrink-0 text-jade" aria-hidden />
      <span>{TEN_HANG[hv.hang ?? "thuong"]}{hv.den_ngay ? ` · tới ${ngayVn(hv.den_ngay)}` : ""}</span>
    </Link>
  );
}
