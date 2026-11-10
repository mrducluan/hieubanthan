// KD-V4 — thẻ "Quẻ của bạn nói gì": ba dòng lời thường engine dựng (Lúc này · Điều đang chuyển · Đang đi về) + một câu nối.
// Hiện ngay dưới câu trả lời, trước hình quẻ và phần đọc kỹ. Component thuần: chỉ hiển thị chữ engine trả; engine cũ chưa
// có trường `ba_dong` → nơi gọi không vẽ.
import { ArrowDown } from "lucide-react";

export interface BaDongKq {
  luc_nay: { nhan: string; ten: string; loi: string };
  dang_chuyen: { nhan: string; ten: string; loi: string } | null;
  di_ve: { nhan: string; ten: string; loi: string } | null;
  noi?: string | null;
}

export function BaDong({ bd }: { bd: BaDongKq }) {
  const dong = [bd.luc_nay, bd.dang_chuyen, bd.di_ve].filter((d): d is NonNullable<typeof d> => Boolean(d && d.loi));
  if (!dong.length) return null;
  return (
    <section aria-label="Quẻ của bạn nói gì" className="rounded-2xl border border-gold/25 bg-gold/[0.04] p-4 sm:p-5" data-testid="ba-dong">
      <h3 className="text-lg">Quẻ của bạn nói gì</h3>
      <ol className="mt-3 space-y-1">
        {dong.map((d, i) => (
          <li key={d.nhan} data-testid="ba-dong-dong">
            {i > 0 && <ArrowDown className="mx-auto my-1 size-4 text-gold/50" aria-hidden />}
            <div className="rounded-xl border border-line/60 bg-bg/40 px-3.5 py-2.5">
              <p className="flex flex-wrap items-baseline gap-x-2 text-xs">
                <span className="font-semibold uppercase tracking-wider text-gold/90">{d.nhan}</span>
                <span className="text-fg-muted">{d.ten}</span>
              </p>
              <p className="mt-1 text-[0.95rem] leading-relaxed text-fg">{d.loi}</p>
            </div>
          </li>
        ))}
      </ol>
      {bd.noi && <p className="mt-3 text-[0.95rem] leading-relaxed text-fg" data-testid="ba-dong-noi">{bd.noi}</p>}
    </section>
  );
}
