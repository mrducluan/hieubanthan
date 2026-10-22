"use client";
// UI-PT 2 — "Sơ đồ nhà tô màu": Cửu cung 3×3 theo bản đồ (Bắc ở trên, Đông bên phải — cùng chiều la bàn 8 hướng của
// trang). Mỗi phòng đặt vào ô theo PHƯƠNG engine đã tính; ô tô màu theo MỨC engine chấm (lục thuận · xám-lam cân bằng ·
// hổ phách cần lưu ý — không dùng đỏ). Web chỉ vẽ: không suy phương, không chấm mức.
import { DoorOpen } from "lucide-react";
import { NHAN_MUC, type Muc } from "@/components/luan-giai/kieu";
import { cn } from "@/lib/utils";

export const LUOI_9 = ["Tây Bắc", "Bắc", "Đông Bắc", "Tây", "Trung cung", "Đông", "Tây Nam", "Nam", "Đông Nam"] as const;
const THU_TU_MUC: Record<Muc, number> = { can_chu_dong: 0, can_bang: 1, thuan: 2 };

export interface PhongTrenSoDo { cung: string; ten: string; muc?: Muc | null; ghi?: string | null }

/** Mức của ô = mức THẤP nhất trong các phòng ở ô đó (một phòng cần lưu ý là ô cần lưu ý). */
function mucO(ds: PhongTrenSoDo[]): Muc | null {
  const co = ds.map((p) => p.muc).filter((m): m is Muc => Boolean(m));
  if (!co.length) return null;
  return co.sort((a, b) => THU_TU_MUC[a] - THU_TU_MUC[b])[0]!;
}

export function SoDoNha({ phong, huongNha, duNien, tieuDe = "Sơ đồ nhà", chuThich = true, className }: {
  phong: PhongTrenSoDo[];
  /** Hướng nhà (8 hướng) → đánh dấu ô mặt trước (phía cửa nhìn ra). */
  huongNha?: string | null;
  /** Du niên theo phương (bảng 8 hướng của mệnh hoặc trạch) — chữ nhỏ dưới tên phương. */
  duNien?: Record<string, string | null | undefined> | null;
  tieuDe?: string; chuThich?: boolean; className?: string;
}) {
  const theoO = new Map<string, PhongTrenSoDo[]>();
  for (const p of phong) { const l = theoO.get(p.cung) ?? []; l.push(p); theoO.set(p.cung, l); }
  const moTa = phong.length
    ? phong.map((p) => `${p.ten} phía ${p.cung}${p.muc ? ` (${NHAN_MUC[p.muc]})` : ""}`).join(", ")
    : "chưa đặt phòng nào";
  return (
    <figure className={cn("w-full max-w-sm", className)} data-testid="so-do-nha">
      <div className="grid grid-cols-3 gap-1" role="img" aria-label={`${tieuDe} (Bắc ở trên): ${moTa}`}>
        {LUOI_9.map((c) => {
          const ds = theoO.get(c) ?? [];
          const m = mucO(ds);
          const giua = c === "Trung cung";
          const cua = Boolean(huongNha) && c === huongNha;
          const dn = !giua ? duNien?.[c] : null;
          return (
            <div key={c} data-muc={m ?? undefined} data-cung={c}
              className={cn("relative flex min-h-[4.6rem] flex-col rounded-lg border p-1.5 text-left",
                m ? "chip-muc" : giua ? "border-line/50 bg-surface-2/30" : "border-line/60 bg-bg/30",
                cua && "ring-1 ring-gold/70")}>
              <span className={cn("text-[9px] uppercase leading-none tracking-wide", m ? "opacity-80" : "text-fg-faint")}>{giua ? "Giữa nhà" : c}</span>
              {dn && <span className={cn("mt-0.5 text-[9px] leading-none", m ? "opacity-70" : "text-fg-faint")}>{dn}</span>}
              <span className="mt-auto space-y-0.5 pt-1">
                {ds.map((p, i) => (
                  <span key={`${p.ten}-${i}`} className={cn("block text-[11px] font-semibold leading-tight", m ? "" : "text-fg")}>{p.ten}</span>
                ))}
              </span>
              {cua && (
                <span className="absolute right-1 top-1 inline-flex items-center gap-0.5 rounded-full bg-gold/15 px-1 text-[9px] text-gold" title="Mặt trước — phía cửa nhìn ra">
                  <DoorOpen className="size-2.5" aria-hidden /> cửa
                </span>
              )}
            </div>
          );
        })}
      </div>
      {chuThich && (
        <figcaption className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-fg-faint">
          <span className="inline-flex items-center gap-1"><span className="cham-muc size-2 rounded-full" data-muc="thuan" /> thuận lợi</span>
          <span className="inline-flex items-center gap-1"><span className="cham-muc size-2 rounded-full" data-muc="can_bang" /> cân bằng</span>
          <span className="inline-flex items-center gap-1"><span className="cham-muc size-2 rounded-full" data-muc="can_chu_dong" /> cần lưu ý</span>
          <span>· Bắc ở trên</span>
        </figcaption>
      )}
    </figure>
  );
}
