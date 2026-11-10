"use client";
// BT-UI — mục gập của tầng "Đọc thêm" trên Hôm nay: tiêu đề + MỘT câu tóm tắt luôn hiện (đọc lướt được), bấm mới mở phần
// đầy đủ. Dùng <details> thật (nội dung vẫn nằm trong HTML; bàn phím Enter / Space mở được). Tự mở khi URL trỏ tới neo của
// mục (#que-ngay…) — cả lúc tải trang lẫn khi bấm link neo trong trang. Lần mở đầu ghi chart_interacted{kind: hom_nay_mo, muc}.
import { useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

export function MucGap({ id, ma, tieuDe, tomTat, phu, children, testId, className }: {
  id?: string; ma: string; tieuDe: React.ReactNode; tomTat?: React.ReactNode; phu?: React.ReactNode; children: React.ReactNode; testId?: string; className?: string;
}) {
  const el = useRef<HTMLDetailsElement>(null);
  const daGhi = useRef(false);
  useEffect(() => {
    if (!id) return;
    const xet = () => {
      if (location.hash !== `#${id}` || !el.current) return;
      el.current.open = true;
      el.current.scrollIntoView({ block: "start" });
    };
    xet();
    window.addEventListener("hashchange", xet);
    return () => window.removeEventListener("hashchange", xet);
  }, [id]);
  return (
    <details ref={el} id={id} data-testid={testId} data-muc-gap={ma}
      className={cn("group glass scroll-mt-24 rounded-2xl open:border-gold/40", className)}
      onToggle={(e) => { if (e.currentTarget.open && !daGhi.current) { daGhi.current = true; ghi("chart_interacted", { kind: "hom_nay_mo", muc: ma }); } }}>
      <summary className="vung-cham flex cursor-pointer list-none items-start justify-between gap-3 rounded-2xl p-4 outline-none focus-visible:ring-2 focus-visible:ring-gold sm:p-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-serif text-lg text-fg">{tieuDe}</span>
            {phu && <span className="text-xs text-fg-muted">{phu}</span>}
          </span>
          {tomTat && <span className="mt-0.5 block text-sm text-fg-muted group-open:hidden">{tomTat}</span>}
        </span>
        <ChevronDown className="mt-1 size-5 shrink-0 text-gold transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-2 px-4 pb-4 sm:px-5 sm:pb-5">{children}</div>
    </details>
  );
}
