"use client";
// UI-KD 4 — "Quẻ đã gieo" (≤ 20, chỉ trên máy này — localStorage `hbt.que.v1`). "Xem lại" gọi lại engine với đúng 6 giá trị cũ
// (cach gieo_tay, tất định) — không gieo lại; xoá từng quẻ / xoá hết. Không gửi câu hỏi hay quẻ lên máy chủ ngoài lượt hỏi.
import { useEffect, useState } from "react";
import { History, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VeQueNho } from "@/components/huyen-hoc/VeQue";
import { cn } from "@/lib/utils";
import { docLichSuQue, nhanLuc, type QueDaLuu, xoaHetQue, xoaQue } from "@/lib/lich-su-que";

const TEN_CACH: Record<string, string> = {
  may_gieo: "máy gieo", gieo_tay: "tự gieo", mai_hoa: "Mai Hoa theo giờ", mai_hoa_so: "Mai Hoa theo số", mai_hoa_phuong: "Mai Hoa theo phương",
};

export function LichSuQue({ lamMoi, onXemLai, dang = false, className }: {
  /** Đổi giá trị → đọc lại danh sách (sau khi có quẻ mới). */
  lamMoi: number;
  onXemLai: (q: QueDaLuu) => void;
  dang?: boolean;
  className?: string;
}) {
  const [ds, setDs] = useState<QueDaLuu[]>([]);
  const [mo, setMo] = useState(false);
  useEffect(() => { setDs(docLichSuQue()); }, [lamMoi]);
  if (ds.length === 0) return null;
  return (
    <section className={cn("glass rounded-2xl p-4", className)} aria-labelledby="lich-su-que-tieu-de" data-testid="lich-su-que">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => setMo((v) => !v)} aria-expanded={mo} className="inline-flex items-center gap-2 text-left" data-testid="lich-su-que-mo">
          <History className="size-4 text-gold" aria-hidden />
          <span id="lich-su-que-tieu-de" className="font-serif text-lg text-fg">Quẻ đã gieo <span className="text-sm text-fg-faint">({ds.length})</span></span>
        </button>
        <p className="text-xs text-fg-faint">Chỉ lưu trên máy này, tối đa 20 quẻ. Không gửi đi đâu.</p>
      </div>
      {mo && (
        <>
          <ul className="mt-3 divide-y divide-line/60">
            {ds.map((q) => (
              <li key={q.id} className="flex items-center gap-3 py-2.5" data-testid="lich-su-que-muc">
                <VeQueNho giaTri={q.gia_tri_hao} rong="w-9" nhan={undefined} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-[1.02rem] text-fg">
                    {q.ten_que}{q.ten_bien ? <span className="text-fg-muted"> → {q.ten_bien}</span> : <span className="text-xs text-fg-faint"> · không hào động</span>}
                  </p>
                  <p className="truncate text-xs text-fg-muted" title={q.cau}>{q.cau}</p>
                  <p className="text-[0.7rem] text-fg-faint">{nhanLuc(q.luc)}{q.chu_de?.ten ? ` · ${q.chu_de.ten}` : ""} · {TEN_CACH[q.cach] ?? q.cach}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button type="button" size="sm" variant="outline" disabled={dang} onClick={() => onXemLai(q)} data-testid="xem-lai" aria-label={`Xem lại quẻ ${q.ten_que}`}>
                    <RotateCcw aria-hidden /> <span className="hidden sm:inline">Xem lại</span>
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="size-9" onClick={() => setDs(xoaQue(q.id))} data-testid="xoa-que" aria-label={`Xoá quẻ ${q.ten_que}`}>
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-fg-faint">
            <span>“Xem lại” đọc đúng quẻ cũ (6 hào giữ nguyên), không gieo lại; phần ngày tháng Lục Hào lấy theo lúc xem.</span>
            <button type="button" onClick={() => { xoaHetQue(); setDs([]); }} className="underline-offset-4 hover:text-fg hover:underline" data-testid="xoa-het-que">Xoá hết</button>
          </div>
        </>
      )}
    </section>
  );
}
