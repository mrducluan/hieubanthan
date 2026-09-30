import { CalendarDays } from "lucide-react";
import type { LuanGiaiResult } from "@/lib/engine";

// "Nhịp hiện tại" — lý do để quay lại (năm + tháng cá nhân). Không dự báo sự kiện, chỉ chủ đề.
export function NhipHienTai({ kq }: { kq: LuanGiaiResult }) {
  const nam = kq.chieu_sau.nam_ca_nhan[0];
  const thang = kq.mo_rong?.thang_ca_nhan;
  const o = [
    nam?.nghia && { nhan: `Năm ${nam.nam}`, so: nam.so, chu_de: nam.nghia.chu_de, nen: nam.nghia.nen, tranh: nam.nghia.tranh },
    thang?.nghia && { nhan: `Tháng ${thang.thang}/${thang.nam}`, so: thang.so, chu_de: thang.nghia.chu_de, nen: thang.nghia.nen, tranh: thang.nghia.tranh },
  ].filter(Boolean) as { nhan: string; so: number; chu_de: string; nen: string; tranh: string }[];
  if (!o.length) return null;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {o.map((x) => (
        <article key={x.nhan} className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm text-fg-muted"><CalendarDays className="size-4" aria-hidden /> {x.nhan}</span>
            <span className="rounded-full bg-gold/15 px-2.5 py-0.5 text-sm font-semibold text-gold">số {x.so}</span>
          </div>
          <h3 className="mt-3 text-xl">{x.chu_de}</h3>
          <p className="mt-2 text-sm"><span className="text-jade">Hợp để:</span> {x.nen}</p>
          <p className="mt-1 text-sm"><span className="text-cinnabar">Để ý:</span> {x.tranh}</p>
        </article>
      ))}
    </div>
  );
}
