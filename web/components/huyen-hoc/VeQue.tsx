import { cn } from "@/lib/utils";

export interface Hao { vi_tri: number; am_duong: string; luc_than: string; the_ung: string }
export interface Quai { so_king_wen: number; ten: string; hao: Hao[] }

/** EN-ALL GĐ 6: chữ hiển thị do nơi gọi đưa vào (catalog lib/chu/kinh-dich.ts + `ten_hien`) — file này không dùng hook để
 *  trang máy chủ (/the/que) vẫn import được. Bỏ trống = chữ Việt cũ, tên mã nguyên văn. */
export type ChuVeQue = { dong: string; so: (n: number) => string; ten: (nhom: string, ma: string) => string };
const CHU_VI: ChuVeQue = { dong: "động · ", so: (n) => `quẻ ${n}`, ten: (_n, ma) => ma };

// Vẽ quẻ 6 hào (hào 1 ở dưới). Hào động sáng vàng.
export function VeQue({ q, dong = [], nhan, chu = CHU_VI }: { q: Quai; dong?: number[]; nhan: string; chu?: ChuVeQue }) {
  return (
    <figure className="min-w-[9.5rem]" aria-label={`${nhan}: ${chu.ten("que_ten", q.ten)}`}>
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
                {d ? chu.dong : ""}{chu.ten("luc_than_kd", h.luc_than)}{h.the_ung ? ` · ${chu.ten("the_ung_kd", h.the_ung)}` : ""}
              </span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 font-serif text-xl">{chu.ten("que_ten", q.ten)} <span className="text-xs text-fg-faint">{chu.so(q.so_king_wen)}</span></p>
    </figure>
  );
}

/** UI-KD — quẻ nhỏ vẽ từ 6 giá trị hào (6/7/8/9, hào 1 ở dưới), không lục thân / thế ứng. `null` = hào chưa chọn (vẽ mờ).
 *  Chỉ là hình vẽ của dãy số người dùng / engine đưa vào — tên quẻ luôn do engine trả, không vẽ tên ở đây. */
export function VeQueNho({ giaTri, nhan, rong = "w-16", className, aria }: { giaTri: readonly (number | null)[]; nhan?: string; rong?: string; className?: string;
  /** Tên hình khi không có `nhan` (EN-ALL: nơi gọi đưa chữ theo ngôn ngữ; bỏ trống = "Quẻ 7 8 …" như cũ). */ aria?: string }) {
  const hang = Array.from({ length: 6 }, (_, i) => giaTri[5 - i] ?? null);   // hào 6 trên cùng
  return (
    <figure className={cn("inline-flex flex-col items-center", className)} aria-label={nhan ?? aria ?? `Quẻ ${giaTri.map((v) => v ?? "?").join(" ")}`} data-testid="ve-que-nho">
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
