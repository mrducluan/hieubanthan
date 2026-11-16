"use client";
// TR-1 — lịch sử trải bài CHỈ trên máy (≤ 20): "Xem lại" = gọi lại engine với đúng lá đã rút (tất định, không xáo lại).
import { History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SO_LA, type BoBai } from "@/lib/tarot-chung";
import { xoaHetTraiBai, xoaTraiBai, type TraiBaiDaLuu } from "@/lib/tarot";
import { useChuTarot } from "./chu-tarot";

export function LichSuTarot({ ds, bo, onXemLai, onDoi }: { ds: TraiBaiDaLuu[]; bo: BoBai; onXemLai: (q: TraiBaiDaLuu) => void; onDoi: () => void }) {
  const { c, en, la: chuLa } = useChuTarot();
  if (!ds.length) return null;
  // Bản Anh: tên lá tâm điểm lấy lại từ bộ bài đang tải (tóm tắt lưu trên máy có thể là tên Việt của lượt trước).
  const tomTat = (q: TraiBaiDaLuu) => {
    if (!en) return q.tom_tat;
    const lr = q.la[bo.trai_bai[q.trai_bai]?.trong_tam ?? 0] ?? q.la[0];
    const lb = lr ? bo.la[lr.id] : null;
    return lb ? `${lb.ten}${lr!.nguoc ? chuLa.nguoc : ""}` : "";
  };
  return (
    <section aria-labelledby="ls-tarot" className="glass rounded-2xl p-5" data-testid="lich-su-tarot">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="ls-tarot" className="flex items-center gap-2 text-xl"><History className="size-5 text-gold" aria-hidden /> {c("ls.tieu_de", { n: String(ds.length) })}</h2>
        <Button variant="ghost" size="sm" onClick={() => { if (confirm(c("ls.hoi_xoa"))) { xoaHetTraiBai(); onDoi(); } }}><Trash2 aria-hidden /> {c("ls.xoa_het")}</Button>
      </div>
      <p className="mt-1 text-xs text-fg-faint">{c("ls.ghi_chu")}</p>
      <ul className="mt-3 divide-y divide-line/60">
        {ds.map((q) => (
          <li key={q.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
            <span className="min-w-0 flex-1">
              <span className="block text-fg">{bo.trai_bai[q.trai_bai]?.ngan ?? SO_LA[q.trai_bai]} · {tomTat(q)}</span>
              <span className="block truncate text-xs text-fg-faint">{new Date(q.luc).toLocaleString(en ? "en-GB" : "vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}{q.cau ? ` · “${q.cau}”` : ""}</span>
            </span>
            <Button variant="secondary" size="sm" onClick={() => onXemLai(q)} data-testid="nut-xem-lai">{c("ls.xem_lai")}</Button>
            <button type="button" onClick={() => { xoaTraiBai(q.id); onDoi(); }} className="text-xs text-fg-faint underline-offset-4 hover:underline" aria-label={c("ls.xoa_aria")}>{c("ls.xoa")}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
