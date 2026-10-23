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

/** UI-KD — quẻ nhỏ vẽ từ 6 giá trị hào (6/7/8/9, hào 1 ở dưới), không lục thân / thế ứng. `null` = hào chưa chọn (vẽ mờ).
 *  Chỉ là hình vẽ của dãy số người dùng / engine đưa vào — tên quẻ luôn do engine trả, không vẽ tên ở đây. */
export function VeQueNho({ giaTri, nhan, rong = "w-16", className }: { giaTri: readonly (number | null)[]; nhan?: string; rong?: string; className?: string }) {
  const hang = Array.from({ length: 6 }, (_, i) => giaTri[5 - i] ?? null);   // hào 6 trên cùng
  return (
    <figure className={cn("inline-flex flex-col items-center", className)} aria-label={nhan ?? `Quẻ ${giaTri.map((v) => v ?? "?").join(" ")}`} data-testid="ve-que-nho">
      <div className={cn("space-y-1", rong)}>
        {hang.map((v, i) => {
          const dong = v === 6 || v === 9, duong = v === 7 || v === 9;
          const mau = v == null ? "bg-fg/15" : dong ? "bg-gold shadow-[0_0_8px_rgb(var(--gold)/0.6)]" : "bg-fg/80";
          return (
            <span key={6 - i} className="flex gap-1.5" data-hao={6 - i} data-gia-tri={v ?? ""}>
              {v == null || duong ? <span className={cn("h-2 w-full rounded-sm", mau)} /> : (<>
                <span className={cn("h-2 w-1/2 rounded-sm", mau)} /><span className={cn("h-2 w-1/2 rounded-sm", mau)} />
              </>)}
            </span>
          );
        })}
      </div>
      {nhan && <figcaption className="mt-1.5 text-xs text-fg-faint">{nhan}</figcaption>}
    </figure>
  );
}
