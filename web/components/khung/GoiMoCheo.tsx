"use client";
// KC-3 — "Cùng chuyện này, mảng khác nói gì": link gợi mở sang mảng khác theo từ điển ý định dùng chung (engine KB).
// Nhận sẵn `goiMo` từ bài đọc, hoặc tự tra theo (mo_dun, ma). Chỉ link trong site; đo bằng mã, không chữ.
import Link from "next/link";
import { useEffect, useState } from "react";
import { Compass } from "lucide-react";
import { ghi } from "@/lib/do-luong";

export interface GoiMo { ma: string; ten: string; mo_ta?: string; lien_ket: { mo_dun: string; ten_mo_dun?: string; duong: string; nhan: string }[] }

export function GoiMoCheo({ goiMo, moDun, ma, tieuDe = "Cùng chuyện này, xem thêm ở", gon = false }: {
  goiMo?: GoiMo | null; moDun: string; /** mã chung hoặc mã riêng của mảng (tra qua engine khi không có `goiMo`) */ ma?: string | null;
  tieuDe?: string; gon?: boolean;
}) {
  const [tra, setTra] = useState<GoiMo | null>(null);
  const khoa = !goiMo && ma ? `${moDun}:${ma}` : "";
  useEffect(() => {
    if (!khoa) { setTra(null); return; }
    let huy = false;
    const [md, m] = khoa.split(":");
    fetch(`/api/y-dinh/goi-mo?ma=${encodeURIComponent(m!)}&mo_dun=${encodeURIComponent(md!)}`).then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!huy) setTra(d && Array.isArray(d.lien_ket) ? (d as GoiMo) : null); }).catch(() => { if (!huy) setTra(null); });
    return () => { huy = true; };
  }, [khoa]);
  const g = goiMo ?? tra;
  if (!g?.lien_ket?.length) return null;
  return (
    <div className={gon ? "flex flex-wrap items-center gap-2" : "rounded-2xl border border-line/70 bg-surface/40 p-4"} data-testid="goi-mo-cheo" data-ma={g.ma}>
      <p className={gon ? "text-xs text-fg-faint" : "flex items-center gap-2 text-sm font-semibold text-fg"}>{!gon && <Compass className="size-4 text-gold" aria-hidden />}{tieuDe} · {g.ten.toLowerCase()}:</p>
      <ul className={gon ? "contents" : "mt-2 flex flex-wrap gap-2"}>
        {g.lien_ket.map((l) => (
          <li key={l.duong}>
            <Link href={l.duong} onClick={() => ghi("chart_interacted", { mo_dun: moDun, kind: `goi_mo:${l.mo_dun}` })}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs text-fg-muted hover:border-gold/60 hover:text-fg">
              <span className="text-gold">{l.ten_mo_dun ?? l.mo_dun}</span> {l.nhan}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
