"use client";
// KC-4 — khối "Mốc bạn đã đánh dấu" trên Hôm nay: mốc hôm nay / hôm qua / 7 ngày tới (lưu trên máy), xoá được.
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { nhacSapToi, useNhacViec, xoaNhac } from "@/lib/nhac-viec";

const dmy = (iso: string) => `${Number(iso.slice(8, 10))}/${Number(iso.slice(5, 7))}`;

export function NhacHomNay({ homNay }: { homNay: string }) {
  const ds = nhacSapToi(useNhacViec(), homNay);
  if (!ds.length) return null;
  return (
    <section aria-labelledby="nhac-hom-nay" className="glass space-y-2 rounded-2xl p-5" data-testid="nhac-hom-nay">
      <h2 id="nhac-hom-nay" className="flex items-center gap-2 text-xl"><Bell className="size-5 text-gold" aria-hidden /> Mốc bạn đã đánh dấu</h2>
      <ul className="space-y-1.5 text-sm">
        {ds.map((n) => (
          <li key={n.id} className="flex items-start gap-2">
            <span className={n.ngay === homNay ? "font-semibold text-gold" : "text-fg-faint"}>{n.ngay === homNay ? "Hôm nay" : dmy(n.ngay)}</span>
            <span className="flex-1">{n.duong ? <Link href={n.duong} className="hover:underline">{n.nhan}</Link> : n.nhan}</span>
            <button type="button" aria-label="Bỏ mốc này" onClick={() => xoaNhac(n.id)} className="text-fg-faint hover:text-fg"><X className="size-4" /></button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-fg-faint">Mốc là nhịp gợi ý bạn tự đánh dấu, lưu trên máy này. Không phải dự báo.</p>
    </section>
  );
}
