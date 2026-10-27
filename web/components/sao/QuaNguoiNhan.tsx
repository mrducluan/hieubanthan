"use client";
// Trang nhận thẻ / lời mời (/the/*, /hop-doi/[mã]): một dòng nói rõ người nhận được gì khi lưu hồ sơ vào tài khoản —
// Sao chào mừng, cộng Sao "được mời" khi link mang mã giới thiệu (?gt=). Số đọc từ cài đặt (/api/sao/muc, /api/luan-giai/phi);
// số thật do hàm SQL quyết. Chưa bật tài khoản / đã đăng nhập (người cũ) / không có thưởng → không hiện.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Gift } from "lucide-react";
import { useMucSao } from "@/lib/muc-sao";
import { maGioiThieuDaNho } from "@/lib/ma-gioi-thieu";
import { loiNguoiNhan } from "@/lib/loi-sao";
import { coTaiKhoan, supabase } from "@/lib/supabase/trinh-duyet";

export function QuaNguoiNhan({ className = "" }: { className?: string }) {
  const muc = useMucSao();
  const [phi, setPhi] = useState<{ thu: boolean; gia: number } | null>(null);
  const [khach, setKhach] = useState(false);
  const [coMa, setCoMa] = useState(false);

  useEffect(() => {
    if (!coTaiKhoan()) return;
    setCoMa(/[?&]gt=[a-z0-9]{8}(&|$)/.test(window.location.search) || Boolean(maGioiThieuDaNho()));
    let huy = false;
    void supabase().then((sb) => sb?.auth.getSession()).then((s) => { if (!huy) setKhach(!s?.data.session); }).catch(() => { if (!huy) setKhach(true); });
    fetch("/api/luan-giai/phi").then((r) => (r.ok ? r.json() : null)).then((d: { thu?: boolean; gia?: number } | null) => {
      if (!huy) setPhi({ thu: Boolean(d?.thu), gia: Number(d?.gia) || 0 });
    }).catch(() => { if (!huy) setPhi({ thu: false, gia: 0 }); });
    return () => { huy = true; };
  }, []);

  if (!khach || !muc || !phi) return null;
  const cau = loiNguoiNhan({ chaoMung: muc.chao_mung, duocMoi: muc.duoc_moi, coMa, gia: phi.gia, thu: phi.thu });
  if (!cau) return null;
  return (
    <p className={`flex items-start justify-center gap-1.5 text-sm text-fg-muted ${className}`} data-testid="qua-nguoi-nhan" data-co-ma={coMa ? "1" : "0"}>
      <Gift className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
      <span>{cau}{" "}<Link href="/dang-nhap" className="whitespace-nowrap text-gold underline underline-offset-4">Đăng nhập</Link></span>
    </p>
  );
}
