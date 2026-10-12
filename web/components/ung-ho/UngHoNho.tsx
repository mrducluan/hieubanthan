// Thẻ nhỏ "Ủng hộ nhà phát triển" đặt cuối các trang quan trọng. Chưa khai ví/tài khoản (env) → không hiện gì.
import Link from "next/link";
import { HeartHandshake } from "lucide-react";
import { coUngHo } from "@/lib/ung-ho";

export function UngHoNho({ className = "" }: { className?: string }) {
  if (!coUngHo()) return null;
  return (
    <aside className={`flex flex-col items-start gap-3 rounded-2xl border border-line/70 p-5 text-sm sm:flex-row sm:items-center ${className}`} data-testid="ung-ho-nho">
      <HeartHandshake className="size-6 shrink-0 text-gold" aria-hidden />
      <p className="flex-1 text-fg-muted">Hiểu Bản Thân miễn phí phần lớn công cụ và do một nhóm nhỏ phát triển. Nếu thấy hữu ích, bạn có thể <b className="text-fg">ủng hộ đội ngũ</b> để có thêm động lực làm tiếp.</p>
      <Link href="/ung-ho" className="shrink-0 font-medium text-gold hover:underline">Ủng hộ →</Link>
    </aside>
  );
}
