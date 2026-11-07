"use client";
// TR-1 — "quạt bài": 78 lá úp xếp thành vòng cung (CSS transform, không WebGL). Rê chuột → lá nhô lên; kéo ngang / vuốt → xoay
// quạt (có quán tính nhẹ); bấm / chạm → rút lá vào vị trí kế tiếp. Thứ tự lá do engine xáo; web chỉ vẽ và ghi chỉ số lá người
// dùng chọn. Bàn phím: ← → di chuyển, Enter rút. Giảm chuyển động → không hiệu ứng nhô / trượt.
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { MatSau, TI_LE } from "./LaBai";
import { cn } from "@/lib/utils";

const GOC_QUAT = { lon: 150, nho: 118 };     // độ mở của vòng cung (máy tính / điện thoại)

export function QuatBai({ thuTu, daRut, onRut, conLai, className }: {
  /** 78 mã lá theo thứ tự engine xáo. */ thuTu: string[];
  /** chỉ số (trong thuTu) đã rút. */ daRut: number[];
  onRut: (chiSo: number) => void;
  /** số lá còn phải rút (0 → khoá quạt). */ conLai: number; className?: string;
}) {
  const giam = Boolean(useReducedMotion());
  const ref = useRef<HTMLDivElement>(null);
  const [rong, setRong] = useState(720);
  const [xoay, setXoay] = useState(0);                // độ xoay thêm của cả quạt (kéo / vuốt)
  const [chon, setChon] = useState<number | null>(null);   // lá đang được rê / chọn bằng phím
  const keo = useRef<{ x: number; goc: number; luc: number; vx: number; daKeo: boolean } | null>(null);
  const quanTinh = useRef<number | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setRong(e?.contentRect.width ?? 720));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => () => { if (quanTinh.current) cancelAnimationFrame(quanTinh.current); }, []);

  const dienThoai = rong < 640;
  const wLa = dienThoai ? 58 : 84;
  const hLa = wLa * TI_LE;
  const goc = dienThoai ? GOC_QUAT.nho : GOC_QUAT.lon;
  const banKinh = Math.max(rong * 0.62, dienThoai ? 300 : 460);
  const n = thuTu.length;
  const buoc = goc / Math.max(n - 1, 1);
  const chieuCao = dienThoai ? 250 : 330;
  const khoa = conLai <= 0;

  const batDauKeo = (e: React.PointerEvent) => {
    if (khoa) return;
    keo.current = { x: e.clientX, goc: xoay, luc: performance.now(), vx: 0, daKeo: false };
    if (quanTinh.current) cancelAnimationFrame(quanTinh.current);
  };
  const dangKeo = (e: React.PointerEvent) => {
    const k = keo.current;
    if (!k) return;
    const dx = e.clientX - k.x;
    if (Math.abs(dx) > 6) k.daKeo = true;
    const t = performance.now();
    const moi = k.goc + (dx / rong) * goc * 0.9;
    k.vx = (moi - xoay) / Math.max(t - k.luc, 1);
    k.luc = t;
    setXoay(kep(moi, goc));
  };
  const thaKeo = () => {
    const k = keo.current;
    keo.current = null;
    if (!k || giam || Math.abs(k.vx) < 0.02) return;
    let v = k.vx * 12;
    const buocQt = () => {
      v *= 0.92;
      setXoay((g) => kep(g + v, goc));
      if (Math.abs(v) > 0.05) quanTinh.current = requestAnimationFrame(buocQt);
    };
    quanTinh.current = requestAnimationFrame(buocQt);
  };
  const rut = (i: number) => {
    if (khoa || daRut.includes(i)) return;
    if (keo.current?.daKeo) return;
    onRut(i);
    setChon(null);
  };
  const phim = (e: React.KeyboardEvent) => {
    if (khoa) return;
    const conLaiDs = thuTu.map((_, i) => i).filter((i) => !daRut.includes(i));
    if (!conLaiDs.length) return;
    const vt = chon === null ? -1 : conLaiDs.indexOf(chon);
    if (e.key === "ArrowRight") { e.preventDefault(); setChon(conLaiDs[Math.min(vt + 1, conLaiDs.length - 1)]!); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); setChon(conLaiDs[Math.max(vt - 1, 0)]!); }
    else if ((e.key === "Enter" || e.key === " ") && chon !== null) { e.preventDefault(); rut(chon); }
  };

  return (
    <div ref={ref} className={cn("relative select-none overflow-hidden rounded-2xl", className)} style={{ height: chieuCao, touchAction: "pan-y" }}
      data-testid="quat-bai" role="listbox" aria-label={`Quạt bài ${n} lá úp — còn rút ${conLai} lá`} tabIndex={0} onKeyDown={phim}
      onPointerDown={batDauKeo} onPointerMove={dangKeo} onPointerUp={thaKeo} onPointerCancel={thaKeo} onPointerLeave={thaKeo}>
      <div className="absolute left-1/2 top-full" style={{ transform: `translateX(-50%) translateY(${-hLa - (dienThoai ? 18 : 30)}px) rotate(${xoay}deg)`, transformOrigin: `50% ${-(banKinh - hLa)}px`, transition: keo.current || giam ? "none" : "transform 120ms ease-out" }}>
        {thuTu.map((ma, i) => {
          if (daRut.includes(i)) return null;
          const g = -goc / 2 + i * buoc;
          const nho = chon === i;
          return (
            <div key={ma} role="option" aria-selected={nho} aria-label={`Lá úp thứ ${i + 1}`} data-testid="la-quat" data-chi-so={i}
              className={cn("absolute left-0 top-0 rounded-[7px] shadow-card", !khoa && "cursor-pointer", !giam && "transition-transform duration-200 ease-out", nho && "z-20")}
              style={{ width: wLa, height: hLa, marginLeft: -wLa / 2, transformOrigin: `50% ${banKinh}px`,
                transform: `rotate(${g}deg) translateY(${nho ? -26 : 0}px)` }}
              onPointerEnter={() => { if (!khoa && !keo.current) setChon(i); }}
              onPointerLeave={() => setChon((c) => (c === i ? null : c))}
              onClick={() => rut(i)}>
              <MatSau w={wLa} sang={nho} />
            </div>
          );
        })}
      </div>
      <p className="pointer-events-none absolute inset-x-0 top-2 text-center text-xs text-fg-faint">
        {khoa ? "Đã rút đủ — lật bài phía trên." : `Chạm hoặc bấm một lá để rút · còn ${conLai} lá · kéo ngang để xoay quạt`}
      </p>
    </div>
  );
}

function kep(g: number, goc: number) {
  const max = goc * 0.55;
  return Math.max(-max, Math.min(max, g));
}
