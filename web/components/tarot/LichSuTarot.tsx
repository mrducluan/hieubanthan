"use client";
// TR-1 — lịch sử trải bài CHỈ trên máy (≤ 20): "Xem lại" = gọi lại engine với đúng lá đã rút (tất định, không xáo lại).
import { History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SO_LA, type BoBai } from "@/lib/tarot-chung";
import { xoaHetTraiBai, xoaTraiBai, type TraiBaiDaLuu } from "@/lib/tarot";

export function LichSuTarot({ ds, bo, onXemLai, onDoi }: { ds: TraiBaiDaLuu[]; bo: BoBai; onXemLai: (q: TraiBaiDaLuu) => void; onDoi: () => void }) {
  if (!ds.length) return null;
  return (
    <section aria-labelledby="ls-tarot" className="glass rounded-2xl p-5" data-testid="lich-su-tarot">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="ls-tarot" className="flex items-center gap-2 text-xl"><History className="size-5 text-gold" aria-hidden /> Trải bài đã rút ({ds.length})</h2>
        <Button variant="ghost" size="sm" onClick={() => { if (confirm("Xoá toàn bộ lịch sử trải bài trên máy này?")) { xoaHetTraiBai(); onDoi(); } }}><Trash2 aria-hidden /> Xoá hết</Button>
      </div>
      <p className="mt-1 text-xs text-fg-faint">Chỉ lưu trên máy này: trải bài, lá đã rút và câu hỏi (cắt ngắn). Không gửi lên máy chủ.</p>
      <ul className="mt-3 divide-y divide-line/60">
        {ds.map((q) => (
          <li key={q.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
            <span className="min-w-0 flex-1">
              <span className="block text-fg">{bo.trai_bai[q.trai_bai]?.ngan ?? SO_LA[q.trai_bai]} · {q.tom_tat}</span>
              <span className="block truncate text-xs text-fg-faint">{new Date(q.luc).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}{q.cau ? ` · “${q.cau}”` : ""}</span>
            </span>
            <Button variant="secondary" size="sm" onClick={() => onXemLai(q)} data-testid="nut-xem-lai">Xem lại</Button>
            <button type="button" onClick={() => { xoaTraiBai(q.id); onDoi(); }} className="text-xs text-fg-faint underline-offset-4 hover:underline" aria-label="Xoá trải bài này">Xoá</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
