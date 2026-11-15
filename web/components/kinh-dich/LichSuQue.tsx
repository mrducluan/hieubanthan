"use client";
// UI-KD 4 — "Quẻ đã gieo" (≤ 20, chỉ trên máy này — localStorage `hbt.que.v1`). "Xem lại" gọi lại engine với đúng 6 giá trị cũ
// (cach gieo_tay, tất định) — không gieo lại; xoá từng quẻ / xoá hết. Không gửi câu hỏi hay quẻ lên máy chủ ngoài lượt hỏi.
import { useEffect, useState } from "react";
import { History, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VeQueNho } from "@/components/huyen-hoc/VeQue";
import { cn } from "@/lib/utils";
import { docLichSuQue, nhanLuc, type QueDaLuu, xoaHetQue, xoaQue } from "@/lib/lich-su-que";
import { useChuKD } from "./chu-kinh-dich";

const CACH = new Set(["may_gieo", "gieo_tay", "mai_hoa", "mai_hoa_so", "mai_hoa_phuong"]);

export function LichSuQue({ lamMoi, onXemLai, dang = false, className }: {
  /** Đổi giá trị → đọc lại danh sách (sau khi có quẻ mới). */
  lamMoi: number;
  onXemLai: (q: QueDaLuu) => void;
  dang?: boolean;
  className?: string;
}) {
  const [ds, setDs] = useState<QueDaLuu[]>([]);
  const [mo, setMo] = useState(false);
  const { c, en } = useChuKD();
  // Bản Anh: tên quẻ lưu lúc gieo ở bản Anh (`ten_que_en`); quẻ gieo ở bản Việt chỉ có mã → hiện mã (tên phiên âm Hán Việt).
  const tenQ = (q: QueDaLuu) => (en && q.ten_que_en ? q.ten_que_en : q.ten_que);
  const tenB = (q: QueDaLuu) => (en && q.ten_bien_en ? q.ten_bien_en : q.ten_bien);
  useEffect(() => { setDs(docLichSuQue()); }, [lamMoi]);
  if (ds.length === 0) return null;
  return (
    <section className={cn("glass rounded-2xl p-4", className)} aria-labelledby="lich-su-que-tieu-de" data-testid="lich-su-que">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => setMo((v) => !v)} aria-expanded={mo} className="inline-flex items-center gap-2 text-left" data-testid="lich-su-que-mo">
          <History className="size-4 text-gold" aria-hidden />
          <span id="lich-su-que-tieu-de" className="font-serif text-lg text-fg">{c("ls.tieu_de")}<span className="text-sm text-fg-faint">({ds.length})</span></span>
        </button>
        <p className="text-xs text-fg-faint">{c("ls.chi_may")}</p>
      </div>
      {mo && (
        <>
          <ul className="mt-3 divide-y divide-line/60">
            {ds.map((q) => (
              <li key={q.id} className="flex items-center gap-3 py-2.5" data-testid="lich-su-que-muc">
                <VeQueNho giaTri={q.gia_tri_hao} rong="w-9" nhan={undefined} aria={en ? c("vq.aria_nho", { ds: tenQ(q) }) : undefined} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-serif text-[1.02rem] text-fg">
                    {tenQ(q)}{q.ten_bien ? <span className="text-fg-muted"> → {tenB(q)}</span> : <span className="text-xs text-fg-faint">{c("ls.khong_dong")}</span>}
                  </p>
                  <p className="truncate text-xs text-fg-muted" title={q.cau}>{q.cau}</p>
                  <p className="text-[0.7rem] text-fg-faint">{nhanLuc(q.luc, en ? "en" : "vi")}{q.chu_de?.ten ? ` · ${q.chu_de.ten}` : ""} · {CACH.has(q.cach) ? c(`ls.cach_${q.cach}`) : q.cach}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button type="button" size="sm" variant="outline" disabled={dang} onClick={() => onXemLai(q)} data-testid="xem-lai" aria-label={c("ls.xem_lai_aria", { ten: tenQ(q) })}>
                    <RotateCcw aria-hidden /> <span className="hidden sm:inline">{c("ls.xem_lai")}</span>
                  </Button>
                  <Button type="button" size="icon" variant="ghost" className="size-9" onClick={() => setDs(xoaQue(q.id))} data-testid="xoa-que" aria-label={c("ls.xoa_aria", { ten: tenQ(q) })}>
                    <Trash2 aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-fg-faint">
            <span>{c("ls.giai_thich")}</span>
            <button type="button" onClick={() => { xoaHetQue(); setDs([]); }} className="underline-offset-4 hover:text-fg hover:underline" data-testid="xoa-het-que">{c("ls.xoa_het")}</button>
          </div>
        </>
      )}
    </section>
  );
}
