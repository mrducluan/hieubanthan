"use client";
// ANH-4 — một ảnh NGHIÊNG (tuỳ chọn) cho phép đo: người dùng chấm 9 điểm trên ĐƯỜNG VIỀN mặt (+ 2 điểm tai tuỳ chọn) theo
// hình mẫu nhìn nghiêng. Ảnh chỉ hiện bằng `blob:` trên máy, không tải lên; chỉ toạ độ 0..1 + tỉ lệ khung đi theo lượt đo của
// ảnh chính diện (cùng thoả thuận dm1). Không tự tìm điểm: bộ tìm điểm mốc chỉ chắc với ảnh chính diện, ảnh nghiêng ~90° thì
// không thấy đủ mặt. Web không tính gì — engine `do_nghieng` đo góc, độ nhô.
import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, RotateCcw, Undo2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { urlAnhSach } from "@/lib/anh-tren-may";
import { ghi } from "@/lib/do-luong";
import type { DiemDo } from "@/lib/nhan-tuong";
import { cn } from "@/lib/utils";

type Diem = { x: number; y: number };
export type GocNghieng = "nghieng_trai" | "nghieng_phai";
export interface AnhNghieng { diem: Record<string, Diem>; tiLe: number | null }

/** Hình mẫu nhìn nghiêng (quay sang phải) — hình tĩnh, không phải số đo của ai. */
const MAU: Record<string, [number, number]> = {
  chan_toc: [48, 16], giua_tran: [55, 25], an_duong: [58, 36], son_can: [56, 41], song_mui: [62, 47], dau_mui: [69, 55],
  chan_mui: [62, 58], cam_truoc: [60, 74], cam: [54, 80], dinh_tai: [36, 38], dai_tai: [37, 56],
};

function HinhNghieng({ dang, da, lat }: { dang: string | null; da: Set<string>; lat: boolean }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full" aria-hidden style={lat ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M48 16 Q53 18 55 25 Q58 31 58 36 Q57 39 56 41 Q59 44 62 47 L69 55 Q66 58 62 58 Q63 63 61 66 Q62 70 60 74 Q58 79 54 80 Q44 82 38 76 Q30 62 30 46 Q30 22 48 16 Z"
        className="fill-surface/50 stroke-line" strokeWidth={0.8} />
      <path d="M36 38 Q31 46 37 56" className="fill-none stroke-fg-faint" strokeWidth={0.9} />
      {Object.entries(MAU).map(([ma, [x, y]]) => (
        <circle key={ma} cx={x} cy={y} r={ma === dang ? 2.6 : 1.6}
          className={cn(ma === dang ? "fill-gold stroke-bg" : da.has(ma) ? "fill-jade/80 stroke-bg" : "fill-fg-faint/50 stroke-bg")} strokeWidth={0.5} />
      ))}
    </svg>
  );
}

export function ChamNghieng({ goc, ten, ds, onDoi, anhBanDau }: {
  goc: GocNghieng; ten: string; ds: DiemDo[]; onDoi: (a: AnhNghieng | null) => void;
  /** QBG-1: ảnh nghiêng vừa chụp bằng "Quét 3 góc" — nạp sẵn để người dùng chấm đường viền. */
  anhBanDau?: File | null;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [tiLe, setTiLe] = useState<number | null>(null);
  const [diem, setDiem] = useState<Record<string, Diem>>({});
  const [dang, setDang] = useState<string | null>(ds[0]?.ma ?? null);
  const [keo, setKeo] = useState<string | null>(null);
  const khung = useRef<HTMLDivElement>(null);
  const urlRef = useRef<string | null>(null);
  urlRef.current = url;
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current); }, []);
  const doiRef = useRef(onDoi);
  doiRef.current = onDoi;
  useEffect(() => { doiRef.current(url ? { diem, tiLe } : null); }, [url, diem, tiLe]);

  const chonRef = useRef<(f: File | undefined) => Promise<void> | void>(() => undefined);
  useEffect(() => { if (anhBanDau) void chonRef.current(anhBanDau); }, [anhBanDau]);
  const tiep = (d: Record<string, Diem>) => ds.find((p) => !d[p.ma])?.ma ?? null;
  const chon = async (f: File | undefined) => {
    if (!f || !f.type.startsWith("image/")) return;
    const u = await urlAnhSach(f);
    if (!u) return;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = u;
    setUrl(u); setTiLe(null); setDiem({}); setDang(ds[0]?.ma ?? null);
    ghi("chart_interacted", { mo_dun: "nhantuong", kind: "do_nghieng_chon_anh" });
  };
  chonRef.current = chon;
  const viTri = (e: { clientX: number; clientY: number }): Diem | null => {
    const r = khung.current?.getBoundingClientRect();
    if (!r || !r.width || !r.height) return null;
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };
  const ganNhat = (e: { clientX: number; clientY: number }) => {
    const r = khung.current?.getBoundingClientRect();
    if (!r) return null;
    let tot: string | null = null, kc = dang && !diem[dang] ? 8 : 20;
    for (const [ma, p] of Object.entries(diem)) {
      const d = Math.hypot(r.left + p.x * r.width - e.clientX, r.top + p.y * r.height - e.clientY);
      if (d < kc) { kc = d; tot = ma; }
    }
    return tot;
  };
  const xuong = (e: React.PointerEvent<HTMLDivElement>) => {
    const g = ganNhat(e);
    if (g) { setKeo(g); setDang(g); e.currentTarget.setPointerCapture(e.pointerId); return; }
    const p = viTri(e);
    if (!p || !dang) return;
    const moi = { ...diem, [dang]: p };
    setDiem(moi); setDang(tiep(moi) ?? dang);
  };
  const di = (e: React.PointerEvent<HTMLDivElement>) => { if (keo) { const p = viTri(e); if (p) setDiem((d) => ({ ...d, [keo]: p })); } };
  const boLuot = () => {
    const cuoi = ds.filter((p) => diem[p.ma]).map((p) => p.ma).pop();
    if (!cuoi) return;
    const { [cuoi]: _bo, ...con } = diem;
    setDiem(con); setDang(cuoi);
  };
  const daDat = useMemo(() => new Set(Object.keys(diem)), [diem]);
  const thongTin = ds.find((p) => p.ma === dang);
  const conThieu = ds.filter((p) => p.bat_buoc && !diem[p.ma]).length;

  if (!url) {
    return (
      <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-line/80 p-4 text-center text-xs text-fg-muted hover:border-gold/60 hover:text-fg" data-testid={`ng-chon-${goc}`}>
        <ImagePlus className="size-5 text-gold" aria-hidden />
        <span className="font-medium text-fg">{ten}</span>
        <span>Quay hẳn sang một bên (thấy rõ đường viền trán, mũi, cằm), tóc vén khỏi trán và tai.</span>
        <input type="file" accept="image/*" className="sr-only" data-testid={`ng-input-${goc}`} aria-label={`Chọn ảnh ${ten.toLowerCase()} (chỉ hiện trên máy)`}
          onChange={(e) => { void chon(e.target.files?.[0]); e.target.value = ""; }} />
      </label>
    );
  }
  return (
    <div className="space-y-2 rounded-xl border border-line/70 p-3" data-testid={`ng-${goc}`}>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="font-medium text-fg">{ten}</span>
        <span className={cn("text-xs", conThieu ? "text-fg-faint" : "text-jade")} data-testid={`ng-con-${goc}`}>{conThieu ? `Còn ${conThieu} điểm` : "Đã đủ điểm"}</span>
      </div>
      <p className="rounded-lg border border-gold/40 bg-gold/[0.06] px-3 py-2 text-xs" data-testid={`ng-dang-${goc}`} aria-live="polite">
        {thongTin ? <><span className="text-fg-faint">Điểm {ds.indexOf(thongTin) + 1}/{ds.length}{thongTin.bat_buoc ? "" : " · không bắt buộc"}: </span><b className="text-fg">{thongTin.ten}</b> <span className="text-fg-muted">— {thongTin.mo}</span></>
          : <span className="text-jade">Đã chấm xong — kéo chấm nếu cần chỉnh.</span>}
      </p>
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
        <div ref={khung} className={cn("relative select-none touch-none", dang ? "cursor-crosshair" : "")}
          onPointerDown={xuong} onPointerMove={di} onPointerUp={() => setKeo(null)} onPointerCancel={() => setKeo(null)} data-testid={`ng-khung-${goc}`}
          aria-label={`${ten} của bạn — chạm để đặt điểm đang chọn, kéo chấm để chỉnh`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- ảnh blob trên máy người dùng */}
          <img src={url} alt={`${ten} bạn chọn (chỉ hiện trên máy)`} draggable={false} className="block w-full rounded-lg border border-line"
            onLoad={(e) => { const i = e.currentTarget; if (i.naturalWidth && i.naturalHeight) setTiLe(i.naturalWidth / i.naturalHeight); }} />
          {ds.map((p, i) => diem[p.ma] && (
            <span key={p.ma} aria-hidden className={cn("pointer-events-none absolute grid size-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[1.5px] text-[8px] font-semibold",
              p.ma === dang ? "border-gold bg-gold text-bg" : "border-jade bg-bg/70 text-jade")}
              style={{ left: `${diem[p.ma]!.x * 100}%`, top: `${diem[p.ma]!.y * 100}%` }}>{i + 1}</span>
          ))}
        </div>
        <div className="mx-auto w-24 sm:w-full"><HinhNghieng dang={dang} da={daDat} lat={goc === "nghieng_trai"} /></div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Button size="sm" variant="ghost" onClick={boLuot} disabled={!daDat.size}><Undo2 aria-hidden /> Bỏ điểm vừa chấm</Button>
        <Button size="sm" variant="ghost" onClick={() => { setDiem({}); setDang(ds[0]?.ma ?? null); }} disabled={!daDat.size}><RotateCcw aria-hidden /> Chấm lại</Button>
        <button type="button" className="ml-auto inline-flex items-center gap-1 text-fg-faint hover:text-fg" aria-label={`Bỏ ${ten.toLowerCase()}`}
          onClick={() => { if (url) URL.revokeObjectURL(url); setUrl(null); setDiem({}); }}><X className="size-3.5" aria-hidden /> Bỏ ảnh</button>
      </div>
    </div>
  );
}
