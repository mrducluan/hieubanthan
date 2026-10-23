"use client";
// UI-KD 1 — "Gieo 3 đồng xu" có nghi thức: engine đã gieo xong 6 giá trị (CSPRNG, `/v1/kinhdich/hoi` may_gieo); web chỉ
// HIỆN dần từng lần gieo (hào 1 ở dưới → hào 6 ở trên) bằng ba đồng xu lật theo đúng giá trị engine trả:
// 9 = ba ngửa (Dương động) · 6 = ba sấp (Âm động) · 7 = một ngửa hai sấp (Dương) · 8 = hai ngửa một sấp (Âm).
// Không có phép ngẫu nhiên nào ở đây; "Bỏ qua, xem luôn" hiện hết ngay. Tôn trọng prefers-reduced-motion (không lật, chỉ hiện).
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type GiaTriHao, laDong, laDuong, NHAN_HAO, xuTuGiaTri } from "@/lib/dong-xu";

/** Một đồng xu cổ (tròn, lỗ vuông). Mặt ngửa có bốn chấm chữ; mặt sấp trơn. */
export function DongXu({ ngua, mo = false, hao, thuTu, className, onClick, pressed }: {
  ngua: boolean | null; mo?: boolean; hao: number; thuTu: number; className?: string;
  /** Có onClick → đồng xu là nút bật/tắt (bộ chọn tự gieo). */
  onClick?: () => void; pressed?: boolean;
}) {
  const nhan = `Hào ${hao}, đồng xu ${thuTu}: ${ngua == null ? "chưa gieo" : ngua ? "ngửa" : "sấp"}`;
  const hinh = (
    <svg viewBox="0 0 40 40" className={cn("size-9 sm:size-10", className)} aria-hidden>
      <circle cx="20" cy="20" r="18" fill={ngua ? "rgb(var(--gold) / 0.22)" : "rgb(var(--surface-2) / 0.9)"} stroke={ngua ? "rgb(var(--gold))" : "rgb(var(--fg) / 0.45)"} strokeWidth="1.6" />
      <rect x="15" y="15" width="10" height="10" fill="rgb(var(--bg))" stroke={ngua ? "rgb(var(--gold))" : "rgb(var(--fg) / 0.45)"} strokeWidth="1.2" />
      {ngua && (<>
        <circle cx="20" cy="8.5" r="1.7" fill="rgb(var(--gold))" /><circle cx="20" cy="31.5" r="1.7" fill="rgb(var(--gold))" />
        <circle cx="8.5" cy="20" r="1.7" fill="rgb(var(--gold))" /><circle cx="31.5" cy="20" r="1.7" fill="rgb(var(--gold))" />
      </>)}
      {ngua === false && <circle cx="20" cy="20" r="13" fill="none" stroke="rgb(var(--fg) / 0.25)" strokeWidth="1" strokeDasharray="2 3" />}
    </svg>
  );
  const testId = `xu-${hao}-${thuTu}`;
  const mat = ngua == null ? "chua" : ngua ? "ngua" : "sap";
  if (onClick) {
    return (
      <button type="button" onClick={onClick} aria-pressed={pressed ?? !!ngua} aria-label={nhan} data-testid={testId} data-mat={mat}
        className={cn("rounded-full transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold", mo && "opacity-40")}>
        {hinh}
      </button>
    );
  }
  return <span role="img" aria-label={nhan} data-testid={testId} data-mat={mat} className={cn("inline-flex", mo && "opacity-30")}>{hinh}</span>;
}

/** Một vạch hào (liền / đứt, động = vàng) — bản nhỏ dùng cạnh đồng xu. */
export function VachHao({ v, className }: { v: GiaTriHao | null; className?: string }) {
  const dong = v != null && laDong(v), duong = v != null && laDuong(v);
  const mau = v == null ? "bg-fg/15" : dong ? "bg-gold shadow-[0_0_8px_rgb(var(--gold)/0.6)]" : "bg-fg/80";
  return (
    <span className={cn("flex w-14 shrink-0 gap-1.5", className)} aria-hidden>
      {v == null || duong ? <span className={cn("h-2 w-full rounded-sm", mau)} /> : (<>
        <span className={cn("h-2 w-1/2 rounded-sm", mau)} /><span className={cn("h-2 w-1/2 rounded-sm", mau)} />
      </>)}
    </span>
  );
}

export function GieoDongXu({ giaTri, onXong }: {
  /** 6 giá trị engine đã gieo (hào 1 → 6). */
  giaTri: GiaTriHao[];
  /** Gọi một lần khi đã hiện đủ 6 hào (boQua = người dùng bấm "Bỏ qua, xem luôn"). */
  onXong: (boQua: boolean) => void;
}) {
  const giam = useReducedMotion();
  const [daLat, setDaLat] = useState(0);          // số hào đã hiện (0..6)
  const [dangLat, setDangLat] = useState(false);
  const [boQua, setBoQua] = useState(false);
  const xong = useRef(false);
  const hen = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (hen.current) clearTimeout(hen.current); }, []);

  const ketThuc = (bq: boolean) => {
    if (xong.current) return;
    xong.current = true;
    onXong(bq);
  };
  useEffect(() => {
    if (daLat < 6 || xong.current) return;
    hen.current = setTimeout(() => ketThuc(false), giam ? 0 : 650);
    return () => { if (hen.current) clearTimeout(hen.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ chạy khi đủ 6 hào
  }, [daLat]);

  const gieo = () => {
    if (dangLat || daLat >= 6) return;
    if (giam) { setDaLat((n) => n + 1); return; }
    setDangLat(true);
    hen.current = setTimeout(() => { setDangLat(false); setDaLat((n) => n + 1); }, 720);
  };

  const hienHet = () => { setBoQua(true); setDaLat(6); ketThuc(true); };
  const hienTat = boQua || daLat >= 6;
  const vuaLat = daLat > 0 ? giaTri[daLat - 1] : null;

  return (
    <div className="glass rounded-2xl p-4" data-testid="gieo-dong-xu" data-da-lat={daLat}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-serif text-lg text-fg">Gieo ba đồng xu</p>
        <p className="text-xs text-fg-faint">Quẻ đã được gieo xong trên máy tính toán — bạn lật từng lần để xem, từ hào 1 (dưới) lên hào 6 (trên).</p>
      </div>
      <ol className="mt-3 space-y-2" aria-label="Sáu lần gieo, hào 6 ở trên cùng">
        {[6, 5, 4, 3, 2, 1].map((hao) => {
          const v = giaTri[hao - 1]!;
          const daHien = hao <= daLat;
          const dang = dangLat && hao === daLat + 1;
          const xu = daHien ? xuTuGiaTri(v) : [null, null, null];
          return (
            <li key={hao} className={cn("flex min-h-11 items-center gap-2 rounded-xl px-2 py-1 sm:gap-3", daHien && laDong(v) && "bg-gold/[0.07]")} data-testid={`hang-hao-${hao}`} data-hien={daHien ? 1 : 0}>
              <span className="w-12 shrink-0 text-xs text-fg-faint">Hào {hao}</span>
              <span className="flex items-center gap-1">
                {xu.map((ngua, i) => (
                  dang ? (
                    <motion.span key={`${hao}-${i}`} className="inline-flex" aria-hidden
                      initial={{ rotateX: 0, y: 0 }} animate={{ rotateX: 1080, y: [0, -22, 0] }} transition={{ duration: 0.65, delay: i * 0.08, ease: "easeInOut" }}>
                      <DongXu ngua={false} hao={hao} thuTu={i + 1} />
                    </motion.span>
                  ) : (
                    <DongXu key={`${hao}-${i}`} ngua={ngua} mo={!daHien} hao={hao} thuTu={i + 1} />
                  )
                ))}
              </span>
              <VachHao v={daHien ? v : null} />
              <span className={cn("min-w-0 flex-1 truncate text-xs", daHien ? (laDong(v) ? "text-gold" : "text-fg-muted") : "text-fg-faint")}>
                {daHien ? NHAN_HAO[v].ten : dang ? "đang lật…" : ""}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">{vuaLat != null ? `Hào ${daLat}: ${NHAN_HAO[vuaLat].ten}.` : ""}{hienTat ? " Đã đủ sáu hào, đang hiện quẻ." : ""}</p>
      {!hienTat && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={gieo} disabled={dangLat} data-testid="gieo-lan" aria-label={`Gieo lần ${daLat + 1}`}>
            {dangLat ? "Đang lật…" : `Gieo lần ${daLat + 1}`}
          </Button>
          <button type="button" onClick={hienHet} className="min-h-9 rounded-full px-3 text-xs text-fg-muted underline-offset-4 hover:text-fg hover:underline" data-testid="bo-qua-gieo">
            Bỏ qua, xem luôn
          </button>
          <span className="text-xs text-fg-faint">{giam ? "Chế độ giảm chuyển động: đồng xu hiện ngay, không lật." : "Ba đồng xu lật theo kết quả đã gieo."}</span>
        </div>
      )}
    </div>
  );
}
