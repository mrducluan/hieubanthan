// SEO-K — thanh phân trang blog: link thật (bot đi được), trang hiện tại aria-current.
import Link from "next/link";
import { duongTrangSo } from "@/lib/phan-trang";

export function PhanTrang({ goc, n, tong }: { goc: string; n: number; tong: number }) {
  if (tong <= 1) return null;
  return (
    <nav aria-label="Phân trang" className="mt-10 flex flex-wrap items-center justify-center gap-2 text-sm">
      {n > 1 && <Link href={duongTrangSo(goc, n - 1)} rel="prev" className="rounded-full border border-line px-3.5 py-2 text-fg-muted hover:border-gold/50 hover:text-fg">← Trang trước</Link>}
      {Array.from({ length: tong }, (_, i) => i + 1).map((k) => (
        <Link key={k} href={duongTrangSo(goc, k)} aria-current={k === n ? "page" : undefined}
          className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-full border px-3 ${k === n ? "border-gold text-gold" : "border-line text-fg-muted hover:border-gold/50 hover:text-fg"}`}>
          {k}
        </Link>
      ))}
      {n < tong && <Link href={duongTrangSo(goc, n + 1)} rel="next" className="rounded-full border border-line px-3.5 py-2 text-fg-muted hover:border-gold/50 hover:text-fg">Trang sau →</Link>}
    </nav>
  );
}
