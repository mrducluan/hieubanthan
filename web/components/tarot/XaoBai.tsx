"use client";
// TR-1 — "Nhấn giữ để xáo bài": trong lúc giữ (≥ 0,8 s), web gom nhịp rung của ngón tay / chuột + thời điểm thành một chuỗi
// rồi băm SHA-256 ngay trên máy → hạt giống hex gửi engine (engine xáo tất định theo hạt giống; toạ độ KHÔNG rời máy).
// Thả tay → gọi /api/tarot/xao-bai. "Để máy xáo" → engine dùng CSPRNG. Hiệu ứng: hai tụ bài đan vào nhau (CSS keyframes).
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { Hand, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MatSau } from "./LaBai";
import { hatGiong } from "@/lib/tarot";
import { cn } from "@/lib/utils";

const GIU_TOI_THIEU = 800;

export const CHU_XAO_VI = {
  buoc: "Bước 2", tieu_de: "Nhấn giữ để xáo bài",
  mo_ta: "Giữ nút ít nhất một giây, trong lúc giữ cứ rê nhẹ ngón tay hoặc chuột. Nhịp tay của bạn thành hạt giống xáo bài — chỉ một chuỗi băm rời máy, không phải toạ độ.",
  nguoc: "Dùng lá ngược (lối Waite). Bỏ chọn → đọc theo lá bên cạnh (lối Marseille / Thoth).",
  dang: "Đang xáo…", giu: "Giữ… rê nhẹ tay", nhan: "Nhấn giữ để xáo", may: "Để máy xáo",
};
export type ChuXao = typeof CHU_XAO_VI;

export function XaoBai({ onXong, dang, nguoc, onNguoc, chu = CHU_XAO_VI }: { onXong: (hatGiong: string | null) => void; dang: boolean; nguoc: boolean; onNguoc: (v: boolean) => void; /** QTE: chữ theo ngôn ngữ. */ chu?: ChuXao }) {
  const giam = Boolean(useReducedMotion());
  const [giu, setGiu] = useState(false);
  const [tien, setTien] = useState(0);
  const cuChi = useRef<string[]>([]);
  const batDau = useRef(0);
  const khung = useRef<number | null>(null);
  useEffect(() => () => { if (khung.current) cancelAnimationFrame(khung.current); }, []);

  const bam = () => {
    if (dang) return;
    cuChi.current = [];
    batDau.current = performance.now();
    setGiu(true); setTien(0);
    const buoc = () => {
      const t = performance.now() - batDau.current;
      setTien(Math.min(t / 3000, 1));
      if (t < 3000) khung.current = requestAnimationFrame(buoc);
    };
    khung.current = requestAnimationFrame(buoc);
  };
  const di = (e: React.PointerEvent) => {
    if (!giu) return;
    if (cuChi.current.length < 400) cuChi.current.push(`${Math.round(e.clientX)},${Math.round(e.clientY)},${Math.round(performance.now())}`);
  };
  const tha = async () => {
    if (!giu) return;
    setGiu(false);
    if (khung.current) cancelAnimationFrame(khung.current);
    const t = performance.now() - batDau.current;
    if (t < GIU_TOI_THIEU) { setTien(0); return; }
    const hg = await hatGiong(cuChi.current.join(";") + `|${Math.round(t)}`);
    onXong(hg || null);
  };

  return (
    <div className="glass rounded-2xl p-5 sm:p-6" data-testid="xao-bai">
      <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center">
        <div>
          <p className="eyebrow">{chu.buoc}</p>
          <h3 className="mt-1 text-xl">{chu.tieu_de}</h3>
          <p className="mt-1 text-sm text-fg-muted">{chu.mo_ta}</p>
          <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-fg">
            <input type="checkbox" checked={nguoc} onChange={(e) => onNguoc(e.target.checked)} className="size-4 accent-[rgb(var(--gold))]" data-testid="o-la-nguoc" />
            {chu.nguoc}
          </label>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-28 w-36" aria-hidden>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={cn("absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[6px]", giu && !giam && "xao-la")}
                style={{ animationDelay: `${i * 90}ms`, ["--xd" as string]: `${i % 2 ? 1 : -1}`, zIndex: i, transform: `translate(-50%,-50%) rotate(${(i - 2.5) * (giu ? 0 : 3)}deg)` }}>
                <MatSau w={54} />
              </div>
            ))}
          </div>
          <button type="button" data-testid="nut-giu-xao" disabled={dang}
            onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); bam(); }} onPointerMove={di} onPointerUp={() => void tha()} onPointerCancel={() => void tha()}
            onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !giu) { e.preventDefault(); bam(); } }}
            onKeyUp={(e) => { if (e.key === "Enter" || e.key === " ") void tha(); }}
            className={cn("relative inline-flex min-h-12 select-none items-center gap-2 overflow-hidden rounded-full border border-gold/60 bg-gold/15 px-6 py-3 text-sm font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-gold",
              giu && "nhan-sang")} style={{ touchAction: "none" }}>
            <span className="absolute inset-y-0 left-0 bg-gold/25" style={{ width: `${tien * 100}%`, transition: "width 80ms linear" }} aria-hidden />
            <Hand className="relative size-4" aria-hidden /><span className="relative">{dang ? chu.dang : giu ? chu.giu : chu.nhan}</span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => onXong(null)} disabled={dang} data-testid="nut-may-xao"><Shuffle aria-hidden /> {chu.may}</Button>
        </div>
      </div>
    </div>
  );
}
