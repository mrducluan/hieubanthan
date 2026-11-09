"use client";
// TR-1 — bàn trải bài: các ô vị trí theo toạ độ KB (engine trả), lá rút vào từng ô (úp), chạm từng lá để lật (CSS 3D), lớp vẽ
// SVG phủ lên: đường nối hai lá kề theo phẩm giá nguyên tố (vàng liền = hợp / mạnh, hổ phách đứt = xung — không đỏ) và mũi tên
// hướng nhìn (Marseille). Web chỉ VẼ số liệu engine đã tính; không tính phẩm giá ở đây.
import { useMemo } from "react";
import { LaBai } from "./LaBai";
import type { BaoCaoTarot, LaBoBai, LaRut, TraiBai } from "@/lib/tarot-chung";
import { cn } from "@/lib/utils";

export function BanTraiBai({ tb, la, lat, onLat, boLa, pt, chon, onChon, className, gon = false, chu }: {
  tb: TraiBai; la: (LaRut | null)[]; lat: boolean[]; onLat?: (i: number) => void; boLa: Record<string, LaBoBai>;
  /** Có bài đọc → vẽ đường phẩm giá + hướng nhìn. */ pt?: BaoCaoTarot["da_tinh"] | null;
  chon?: number | null; onChon?: (i: number) => void; className?: string; gon?: boolean;
  /** QTE: chữ theo ngôn ngữ (mặc định tiếng Việt). */ chu?: { nguoc: string; up: string; nhan_nguoc: string; nguoc_nhan: string };
}) {
  const c = chu ?? { nguoc: " (ngược)", up: "Lá bài úp", nhan_nguoc: "NGƯỢC", nguoc_nhan: " · ngược" };
  // Khung bàn theo số lá: chiều cao đủ cho lá ở hàng trên / dưới cùng (toạ độ KB 0,12–0,88) + nhãn dưới lá, không cắt mép.
  const n = tb.vi_tri.length;
  const { W, H, wLa } = n === 10 ? { W: 1100, H: 840, wLa: 100 } : n === 5 ? { W: 760, H: 720, wLa: 110 } : n === 1 ? { W: 760, H: 300, wLa: 150 } : { W: 760, H: 300, wLa: 130 };
  const toa = useMemo(() => tb.vi_tri.map((v) => ({ x: v.x * W, y: v.y * H, xoay: v.xoay ?? 0 })), [tb, W, H]);
  const duong = pt ? pt.ke_can.filter((k) => k.quan_he !== "trung") : [];
  const nhin = pt ? pt.huong_nhin.filter((h) => h.huong !== 0 && h.toi !== null && h.tren_truc) : [];
  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl border border-gold/20 bg-[radial-gradient(60%_80%_at_50%_30%,rgb(var(--moon)/0.08),transparent_70%),linear-gradient(170deg,#141230,#0b0b1c)] [container-type:inline-size]", className)}
      style={{ aspectRatio: `${W}/${H}` }} data-testid="ban-trai-bai" data-trai-bai={tb.ngan}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full" aria-hidden>
        <defs><marker id="mt-nhin" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#E9C46A" /></marker></defs>
        {duong.map((k) => {
          const a = toa[k.a]!, b = toa[k.b]!;
          const xung = k.quan_he === "xung";
          return <line key={`${k.a}-${k.b}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={xung ? "#f0b35c" : k.quan_he === "manh" ? "#fff2c8" : "#E9C46A"} strokeWidth={xung ? 2.4 : 2}
            strokeDasharray={xung ? "8 7" : undefined} strokeOpacity={0.75} className="duong-pham-gia" data-quan-he={k.quan_he} />;
        })}
        {nhin.map((h) => {
          const a = toa[h.vi_tri]!, b = toa[h.toi!]!;
          const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
          const x1 = a.x + (dx / d) * (wLa * 0.62), y1 = a.y + (dy / d) * (wLa * 0.62), x2 = b.x - (dx / d) * (wLa * 0.7), y2 = b.y - (dy / d) * (wLa * 0.7);
          return <line key={`n${h.vi_tri}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#E9C46A" strokeWidth={1.6} strokeOpacity={0.9} markerEnd="url(#mt-nhin)" data-testid="mui-ten-nhin" />;
        })}
      </svg>
      {tb.vi_tri.map((v, i) => {
        const t = toa[i]!;
        const lr = la[i] ?? null;
        const lb = lr ? boLa[lr.id] ?? null : null;
        const suc = pt?.vi_tri[i]?.suc.suc;
        return (
          <div key={v.ma} className="absolute" style={{ left: `${(t.x / W) * 100}%`, top: `${(t.y / H) * 100}%`, transform: `translate(-50%,-50%) rotate(${t.xoay}deg)`, width: `${(wLa / W) * 100}%`, zIndex: t.xoay ? 3 : 2 }}
            data-testid={`o-vi-tri-${i}`} data-ma={v.ma}>
            {/* khung giữ chỗ khi chưa có lá */}
            <div className="relative" style={{ aspectRatio: `120/200` }}>
              {!lr && <div className="absolute inset-0 rounded-[9px] border border-dashed border-gold/40 bg-bg/30" />}
              {lr && lb && (
                <div className={cn("absolute inset-0 rounded-[9px]", chon === i && "ring-2 ring-gold")}>
                  <LaBai la={lb} lat={lat[i] ?? false} nguoc={lr.nguoc} onClick={lat[i] ? (onChon ? () => onChon(i) : undefined) : onLat ? () => onLat(i) : undefined} sang={!lat[i]} className="h-full" chu={c} />
                </div>
              )}
              {/* chấm sức của lá (engine chấm): lục = được tiếp sức, hổ phách = bị kìm, xám = giữ nguyên — không đỏ, không điểm */}
              {suc && lat[i] && pt && (
                <span className={cn("absolute -bottom-1 left-1/2 size-2.5 -translate-x-1/2 rounded-full ring-2 ring-bg", suc === "tiep_suc" ? "bg-jade" : suc === "bi_kim" ? "bg-[#f0b35c]" : "bg-fg-faint")} data-suc={suc} aria-hidden />
              )}
            </div>
            {!gon && (
              <p className="relative mt-1 w-[170%] -translate-x-[20.6%] truncate text-center text-fg-muted" style={{ fontSize: `clamp(9px, ${(12 / W) * 100}cqw, 12px)`, transform: t.xoay ? `translateX(-20.6%) rotate(${-t.xoay}deg)` : undefined }}>
                <span className="font-medium text-fg">{i + 1}.</span> {v.ten}{lr?.nguoc && lat[i] ? <span className="text-[#f0b35c]">{c.nguoc_nhan}</span> : null}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
