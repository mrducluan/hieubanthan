"use client";
// Thẻ nhỏ "Ủng hộ nhà phát triển" — phần hiển thị dùng chung (UngHoNho phía máy chủ kiểm env rồi gọi; khối "Đọc tiếp"
// cuối phần xem gọi khi máy chủ báo có ví/tài khoản ủng hộ). `tu`: mã trang để đo donate_cta_clicked (chỉ mã).
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { ghi } from "@/lib/do-luong";

export function UngHoThe({ className = "", tu }: { className?: string; tu?: string }) {
  return (
    <aside className={`flex flex-col items-start gap-3 rounded-2xl border border-line/70 p-5 text-sm sm:flex-row sm:items-center ${className}`} data-testid="ung-ho-nho">
      <HeartHandshake className="size-6 shrink-0 text-gold" aria-hidden />
      <p className="flex-1 text-fg-muted">Hiểu Bản Thân miễn phí phần lớn công cụ và do một nhóm nhỏ phát triển. Nếu thấy hữu ích, bạn có thể <b className="text-fg">ủng hộ đội ngũ</b> để có thêm động lực làm tiếp.</p>
      <Link href="/ung-ho" className="shrink-0 font-medium text-gold hover:underline" onClick={() => ghi("donate_cta_clicked", { tu: tu ?? "khac" })}>Ủng hộ →</Link>
    </aside>
  );
}
