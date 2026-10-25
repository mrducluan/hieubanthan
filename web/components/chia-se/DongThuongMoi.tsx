"use client";
// SAO-V — dòng nhỏ dưới nút chia sẻ nói rõ điều kiện thưởng mời (và hoa hồng nạp Sao khi bật). Đăng nhập: link đã gắn
// mã mời (?gt=) → nói ai nhận gì khi nào. Khách: mời đăng nhập để link có thưởng. Chưa bật tài khoản / mức thưởng 0 →
// không hứa gì (ẩn). Mức đọc từ /api/sao/muc (lib/muc-sao.ts); số thật do hàm SQL quyết.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift } from "lucide-react";
import { coTaiKhoan } from "@/lib/supabase/trinh-duyet";
import { DONG_KHACH, dongThuongMoi, useMucSao } from "@/lib/muc-sao";

export function DongThuongMoi({ dangNhap }: { dangNhap: boolean | undefined }) {
  const muc = useMucSao();
  const duong = usePathname() ?? "/";
  if (!coTaiKhoan() || dangNhap === undefined || !muc) return null;
  const chu = dongThuongMoi(muc);
  if (!chu) return null;
  return (
    <p className="flex gap-1.5 text-xs text-fg-faint" data-testid="dong-thuong-moi" data-dang-nhap={dangNhap ? "1" : "0"}>
      <Gift className="mt-px size-3.5 shrink-0 text-gold" aria-hidden />
      {dangNhap ? <span>{chu}</span> : (
        <Link href={`/dang-nhap?tiep=${encodeURIComponent(duong)}`} className="text-gold underline">{DONG_KHACH}</Link>
      )}
    </p>
  );
}
