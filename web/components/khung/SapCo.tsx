// Rà UX mục 17 / 23 — trang dịch vụ CHƯA mở (Hội viên năm, Hỏi chuyên gia): không quảng cáo giá to khi không có nút mua.
// Một khung "Sắp có" gọn: dịch vụ là gì (một câu), vì sao chưa dùng được, và lối quay về. Không hứa ngày mở, không "báo
// tôi khi mở" (chưa có kênh thật), không đếm ngược.
import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Compass, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SapCo({ moTa, trongLucCho, testId }: { moTa: ReactNode; trongLucCho?: ReactNode; testId?: string }) {
  return (
    <section className="glass mt-8 rounded-2xl p-5 sm:p-6" aria-label="Sắp có" data-testid={testId}>
      <p className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1 text-sm font-semibold text-gold">
          <Hourglass className="size-4" aria-hidden /> Sắp có
        </span>
      </p>
      <p className="mt-3 text-fg">{moTa}</p>
      {trongLucCho && <p className="mt-2 text-sm text-fg-muted">{trongLucCho}</p>}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild variant="secondary" className="min-h-11"><Link href="/tai-khoan"><ArrowLeft aria-hidden /> Về Tài khoản</Link></Button>
        <Button asChild variant="outline" className="min-h-11"><Link href="/kham-pha"><Compass aria-hidden /> Khám phá các mảng</Link></Button>
      </div>
    </section>
  );
}
