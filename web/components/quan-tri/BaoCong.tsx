// Lời báo khi chưa vào được trang quản trị — nói rõ thiếu bước nào (docs/VIEC-CUA-ANH.md mục Q).
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const LOI: Record<"chua_bat" | "chua_migration" | "khong_quyen", { tieuDe: string; noi: string }> = {
  chua_bat: {
    tieuDe: "Tài khoản chưa được bật",
    noi: "Trang quản trị cần đăng nhập. Đặt NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trên Vercel rồi triển khai lại.",
  },
  chua_migration: {
    tieuDe: "Chưa chạy migration quản trị",
    noi: "Chạy supabase/migrations/0010_quan_tri.sql trong Supabase → SQL Editor, rồi cấp vai trò chủ sở hữu cho tài khoản của bạn.",
  },
  khong_quyen: {
    tieuDe: "Tài khoản này chưa có quyền quản trị",
    noi: "Chủ sở hữu cấp vai trò trong bảng vai_tro_quan_tri (hướng dẫn ở docs/VIEC-CUA-ANH.md, mục Q).",
  },
};

export function BaoCong({ trang, email }: { trang: keyof typeof LOI; email?: string | null }) {
  const l = LOI[trang];
  return (
    <Card className="mx-auto max-w-lg text-center" data-testid="qt-bao-cong" data-trang={trang}>
      <ShieldAlert className="mx-auto size-6 text-gold" aria-hidden />
      <h1 className="mt-3 text-2xl">{l.tieuDe}</h1>
      {email && <p className="mt-2 text-sm text-fg-faint">Đang đăng nhập: {email}</p>}
      <p className="mt-2 text-sm text-fg-muted">{l.noi}</p>
      <Button asChild variant="secondary" className="mt-5"><Link href="/">Về trang chủ</Link></Button>
    </Card>
  );
}
