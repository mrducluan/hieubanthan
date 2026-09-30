import { cn } from "@/lib/utils";

export interface Hao { vi_tri: number; am_duong: string; luc_than: string; the_ung: string }
export interface Quai { so_king_wen: number; ten: string; hao: Hao[] }

// Vẽ quẻ 6 hào (hào 1 ở dưới). Hào động sáng vàng.
export function VeQue({ q, dong = [], nhan }: { q: Quai; dong?: number[]; nhan: string }) {
  return (
    <figure className="min-w-[9.5rem]" aria-label={`${nhan}: ${q.ten}`}>
      <figcaption className="eyebrow mb-2">{nhan}</figcaption>
      <div className="space-y-1.5">
        {[...q.hao].reverse().map((h) => {
          const d = dong.includes(h.vi_tri);
          const mau = d ? "bg-gold shadow-[0_0_10px_rgb(var(--gold)/0.6)]" : "bg-fg/80";
          return (
            <div key={h.vi_tri} className="flex items-center gap-2">
              <span className="flex w-24 gap-2">
                {h.am_duong === "Dương" ? <span className={cn("h-2.5 w-full rounded-sm", mau)} /> : (<>
                  <span className={cn("h-2.5 w-1/2 rounded-sm", mau)} /><span className={cn("h-2.5 w-1/2 rounded-sm", mau)} />
                </>)}
              </span>
              <span className={cn("text-[0.68rem]", d ? "text-gold" : "text-fg-faint")}>
                {d ? "động · " : ""}{h.luc_than}{h.the_ung ? ` · ${h.the_ung}` : ""}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 font-serif text-xl">{q.ten} <span className="text-xs text-fg-faint">quẻ {q.so_king_wen}</span></p>
    </figure>
  );
}
