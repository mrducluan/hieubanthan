// QH-URL — khối "Kiến thức {mảng}" ở trang công cụ (trang trụ): liệt kê các cụm con trong silo (/tu-vi → chính tinh,
// cung, sao ở cung, tứ hoá, lá số mẫu…). Liên kết trụ ↔ cụm hai chiều: cụm có breadcrumb về trụ, trụ trỏ xuống cụm.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TEN_MANG_SILO, dsCumTru } from "@/lib/kien-thuc";

export function CumKienThucTru({ tru, className = "" }: { tru: string; className?: string }) {
  const ds = dsCumTru(tru);
  if (!ds.length) return null;
  return (
    <nav aria-labelledby="kien-thuc-tru" className={`mx-auto max-w-5xl ${className}`} data-testid="cum-kien-thuc-tru">
      <h2 id="kien-thuc-tru" className="text-2xl">Kiến thức {TEN_MANG_SILO[tru]}</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ds.map((c) => (
          <li key={c.duong}>
            <Link href={c.duong} className="glass group flex h-full flex-col rounded-2xl p-4 transition-colors hover:border-gold/50">
              <span className="flex items-center justify-between gap-2 font-serif text-lg">{c.ten}
                <ArrowRight className="size-4 shrink-0 text-gold/70 transition-transform group-hover:translate-x-1" aria-hidden /></span>
              <span className="mt-1 line-clamp-2 text-sm text-fg-muted">{c.mo_ta}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
