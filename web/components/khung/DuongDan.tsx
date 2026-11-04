// TM-1 — breadcrumb hiển thị dùng chung (trang công cụ, trang cụm, trang con). Mục cuối = trang đang xem (không link,
// aria-current). Cùng dữ liệu với BreadcrumbList JSON-LD của trang (lib/duong-dan.ts) → người đọc và Google thấy một đường.
import Link from "@/components/khung/Lien";
import type { CapDuongDan } from "@/lib/duong-dan";
import { cn } from "@/lib/utils";

export function DuongDan({ ds, className }: { ds: CapDuongDan[]; className?: string }) {
  if (ds.length < 2) return null;
  return (
    <nav aria-label="Đường dẫn" className={cn("text-[0.8125rem] text-fg-muted", className)} data-testid="duong-dan">
      <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
        {ds.map((c, i) => {
          const cuoi = i === ds.length - 1;
          return (
            <li key={c.duong} className="flex min-w-0 items-center gap-1.5">
              {cuoi ? <span aria-current="page" className="truncate text-fg">{c.ten}</span>
                : <Link href={c.duong} className="rounded-sm underline-offset-4 hover:text-fg hover:underline">{c.ten}</Link>}
              {!cuoi && <span aria-hidden className="text-fg-faint">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
