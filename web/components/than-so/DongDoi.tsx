"use client";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { CalendarSearch, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { BuocNgoat, DoiChieuNam, DongDoi as DongDoiT, LoaiMoc } from "@/lib/engine";
import { postJson } from "@/lib/goi-api";
import { cn } from "@/lib/utils";

// Dòng đời & bước ngoặt (TS-SAU). Engine tính giai đoạn, chu kỳ, các năm bước ngoặt; web chỉ đặt lên trục.
const MAU: Record<LoaiMoc, string> = { chuyen_dinh: "--gold", khoi_chu_ky: "--jade", khep_chu_ky: "--moon" };
const TEN: Record<LoaiMoc, string> = { chuyen_dinh: "Chuyển giai đoạn", khoi_chu_ky: "Mở chu kỳ 9 năm", khep_chu_ky: "Khép chu kỳ 9 năm" };
const H = 196, PAD = 10, TOP = 34, BH = 74, TRUC = TOP + BH + 30;

function Ve({ W, dd, namCuoi, danhDau, className }: { W: number; dd: DongDoiT; namCuoi: number; danhDau: number[]; className: string }) {
  const giam = useReducedMotion();
  const nam0 = dd.giai_doan[0]?.tu_nam ?? dd.hien_tai.nam - dd.hien_tai.tuoi;
  const x = (n: number) => PAD + ((n - nam0) / (namCuoi - nam0)) * (W - PAD * 2);
  const moc = dd.buoc_ngoat.filter((b) => b.nam <= namCuoi);
  const nho = W < 500;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Dòng đời: bốn giai đoạn và các năm bước ngoặt" className={cn("h-auto w-full", className)}>
      {dd.giai_doan.map((g) => {
        const x0 = x(g.tu_nam), x1 = x(Math.min(g.den_nam ?? namCuoi, namCuoi) + 1);
        const w = Math.max(x1 - x0 - 3, 6), cx = x0 + w / 2, dangO = g.dinh === dd.hien_tai.dinh;
        return (
          <g key={g.dinh}>
            <rect x={x0} y={TOP} width={w} height={BH} rx={10} fill={`rgb(var(--gold) / ${dangO ? 0.16 : 0.06})`}
              stroke={dangO ? "rgb(var(--gold))" : "rgb(var(--line))"} strokeWidth={dangO ? 1.5 : 1} />
            <text x={cx} y={TOP + 38} textAnchor="middle" fontFamily="var(--font-display)" fontSize={nho ? 24 : 32} fill="rgb(var(--gold))">{g.so}</text>
            {w > 22 && (
              <text x={cx} y={TOP + 60} textAnchor="middle" fontSize={nho ? 9.5 : 10.5} fill="rgb(var(--cinnabar))">
                {w > 80 ? `thử thách ${g.thu_thach}` : `TT ${g.thu_thach}`}
              </text>
            )}
            <text x={x0 + 2} y={TOP - 8} fontSize="10.5" fill="rgb(var(--fg-faint))">{g.tu_nam}</text>
          </g>
        );
      })}
      <line x1={PAD} x2={W - PAD} y1={TRUC} y2={TRUC} stroke="rgb(var(--line))" />
      {moc.map((b, i) => (
        <motion.g key={`${b.nam}-${b.loai}`}
          {...(giam ? {} : { initial: { opacity: 0, scale: 0.4 }, animate: { opacity: 1, scale: 1 }, transition: { delay: 0.15 + i * 0.03 } })}
          style={{ transformOrigin: `${x(b.nam)}px ${TRUC}px` }}>
          {b.loai === "chuyen_dinh" ? (
            <rect x={x(b.nam) - 5} y={TRUC - 5} width={10} height={10} transform={`rotate(45 ${x(b.nam)} ${TRUC})`} fill={`rgb(var(${MAU[b.loai]}))`} />
          ) : (
            <circle cx={x(b.nam)} cy={TRUC} r={b.trung_moc ? 5 : 3.5}
              fill={b.loai === "khoi_chu_ky" ? `rgb(var(${MAU[b.loai]}))` : "rgb(var(--bg))"} stroke={`rgb(var(${MAU[b.loai]}))`} strokeWidth="1.5" />
          )}
          <title>{`${b.nam} (${b.tuoi} tuổi) — ${b.nhan}`}</title>
        </motion.g>
      ))}
      {danhDau.filter((n) => n >= nam0 && n <= namCuoi).map((n) => (
        <g key={`dd-${n}`}>
          <line x1={x(n)} x2={x(n)} y1={TRUC + 8} y2={TRUC + 22} stroke="rgb(var(--cinnabar))" strokeWidth="2" />
          <text x={x(n)} y={TRUC + 34} textAnchor="middle" fontSize="10" fill="rgb(var(--cinnabar))">{n}</text>
        </g>
      ))}
      <g>
        <line x1={x(dd.hien_tai.nam)} x2={x(dd.hien_tai.nam)} y1={TOP - 4} y2={TRUC + 6} stroke="rgb(var(--fg))" strokeOpacity="0.7" strokeDasharray="3 3" />
        <text x={x(dd.hien_tai.nam)} y={TOP + BH + 16} textAnchor="middle" fontSize="11" fontWeight="600" fill="rgb(var(--fg))">nay · {dd.hien_tai.tuoi} tuổi</text>
      </g>
    </svg>
  );
}

function The({ b, mo }: { b: BuocNgoat; mo?: boolean }) {
  return (
    <li className={cn("flex items-center gap-3 rounded-xl border p-3", mo ? "border-line/50 opacity-70" : "border-line/70 bg-bg/40")}>
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: `rgb(var(${MAU[b.loai]}))` }} aria-hidden />
      <span className="font-serif text-lg">{b.nam}</span>
      <span className="text-sm text-fg-muted">{b.tuoi} tuổi · {b.nhan}</span>
    </li>
  );
}

export function DongDoi({ dd, ngaySinh }: { dd: DongDoiT; ngaySinh: { ngay: number; thang: number; nam: number } }) {
  const [danhDau, setDanhDau] = useState<number[]>([]);
  const cuoiDinh = dd.giai_doan.at(-1)?.tu_nam ?? dd.hien_tai.nam;
  const namCuoi = Math.max(dd.hien_tai.nam + 12, cuoiDinh + 12);
  const sap = dd.buoc_ngoat.filter((b) => b.nam > dd.hien_tai.nam).slice(0, 4);
  const qua = dd.buoc_ngoat.filter((b) => b.nam <= dd.hien_tai.nam).slice(-4).reverse();
  return (
    <div className="space-y-6" data-testid="dong-doi">
      <figure className="glass overflow-hidden rounded-2xl p-2">
        <Ve W={760} dd={dd} namCuoi={namCuoi} danhDau={danhDau} className="hidden sm:block" />
        <Ve W={380} dd={dd} namCuoi={namCuoi} danhDau={danhDau} className="sm:hidden" />
        <figcaption className="flex flex-wrap justify-center gap-x-4 gap-y-1 pb-1 text-xs text-fg-faint">
          {(Object.keys(TEN) as LoaiMoc[]).map((k) => (
            <span key={k} className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: `rgb(var(${MAU[k]}))` }} />{TEN[k]}</span>
          ))}
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-0.5 bg-cinnabar" />Năm bạn đánh dấu</span>
        </figcaption>
      </figure>
      <p className="text-sm text-fg-muted">{dd.cach_doc}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="eyebrow">Sắp tới</p>
          <ul className="mt-2 space-y-2" data-testid="moc-sap-toi">{sap.map((b) => <The key={`${b.nam}${b.loai}`} b={b} />)}</ul>
        </div>
        <div>
          <p className="eyebrow">Đã qua — thử đối chiếu với đời bạn</p>
          <ul className="mt-2 space-y-2">{qua.map((b) => <The key={`${b.nam}${b.loai}`} b={b} mo />)}</ul>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {dd.giai_doan.map((g) => (
          <article key={g.dinh} className={cn("rounded-xl border p-4", g.dinh === dd.hien_tai.dinh ? "border-gold/60 bg-gold/[0.05]" : "border-line/70 bg-bg/40")}>
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-lg">{g.nghia?.chu_de ?? `Giai đoạn ${g.dinh}`}</h3>
              <span className="shrink-0 text-xs text-gold">{g.tu_nam}–{g.den_nam ?? "…"} · số {g.so}</span>
            </div>
            {g.nghia && <p className="mt-1 text-sm">{g.nghia.y_nghia}</p>}
            {g.nghia_thu_thach && (
              <p className="mt-2 text-sm"><span className="text-cinnabar">Thử thách {g.thu_thach} — {g.nghia_thu_thach.mo_ta}.</span>{" "}
                <span className="text-fg-muted">{g.nghia_thu_thach.cach_vuot}</span></p>
            )}
          </article>
        ))}
      </div>

      <DoiChieu ngaySinh={ngaySinh} onDanhDau={setDanhDau} />
    </div>
  );
}

function DoiChieu({ ngaySinh, onDanhDau }: { ngaySinh: { ngay: number; thang: number; nam: number }; onDanhDau: (ds: number[]) => void }) {
  const [o, setO] = useState("");
  const [ds, setDs] = useState<number[]>([]);
  const [kq, setKq] = useState<DoiChieuNam[] | null>(null);
  const [cachDoc, setCachDoc] = useState("");
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState(false);
  const namNay = new Date().getFullYear();

  function them() {
    const n = Number(o);
    if (o.length !== 4 || n < ngaySinh.nam || n > namNay) { setLoi(`Nhập năm từ ${ngaySinh.nam} đến ${namNay}.`); return; }
    setLoi(null); setO("");
    if (!ds.includes(n) && ds.length < 12) setDs([...ds, n].sort((a, b) => a - b));
  }
  async function xem() {
    if (!ds.length) return;
    setDang(true); setLoi(null);
    try {
      const r = await postJson<{ cac_nam: DoiChieuNam[]; cach_doc: string }>("/api/thanso/doi-chieu-nam", { ...ngaySinh, cac_nam: ds });
      setKq(r.cac_nam); setCachDoc(r.cach_doc); onDanhDau(ds);
    } catch (e) {
      setLoi(e instanceof Error ? e.message : "Chưa đối chiếu được lúc này.");
    } finally { setDang(false); }
  }

  return (
    <section aria-labelledby="doi-chieu" className="rounded-2xl border border-cinnabar/30 bg-cinnabar/[0.04] p-5" data-testid="doi-chieu-nam">
      <h3 id="doi-chieu" className="flex items-center gap-2 text-lg"><CalendarSearch className="size-5 text-cinnabar" aria-hidden /> Đối chiếu những năm có biến cố</h3>
      <p className="mt-1 text-sm text-fg-muted">
        Nhập những năm đáng nhớ của bạn (đổi việc, chuyển nhà, gặp người quan trọng, mất mát…) để xem mỗi năm nằm ở đâu trên nhịp số.
        Chỉ dùng để tính, không lưu lại.
      </p>
      <form className="mt-3 flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); them(); }}>
        <Input aria-label="Năm có biến cố" inputMode="numeric" placeholder="vd 2015" value={o} className="w-28 text-center"
          onChange={(e) => setO(e.target.value.replace(/\D/g, "").slice(0, 4))} />
        <Button type="submit" variant="secondary" size="sm"><Plus aria-hidden /> Thêm năm</Button>
        {ds.map((n) => (
          <span key={n} className="inline-flex items-center gap-1 rounded-full border border-cinnabar/40 px-3 py-1 text-sm text-cinnabar">
            {n}
            <button type="button" aria-label={`Bỏ năm ${n}`} onClick={() => setDs(ds.filter((x) => x !== n))}><X className="size-3.5" /></button>
          </span>
        ))}
      </form>
      {loi && <p role="alert" className="mt-2 text-sm text-cinnabar">{loi}</p>}
      <Button className="mt-3" size="sm" onClick={xem} disabled={!ds.length || dang}>{dang ? "Đang đặt…" : "Đặt lên dòng đời"}</Button>

      {kq && (
        <div className="mt-5 space-y-3" data-testid="ket-qua-doi-chieu">
          {kq.map((r) => (
            <article key={r.nam} className="rounded-xl border border-line/70 bg-bg/50 p-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-serif text-2xl text-cinnabar">{r.nam}</span>
                <span className="text-sm text-fg-muted">{r.tuoi} tuổi · năm cá nhân <b className="text-gold">{r.nam_ca_nhan}</b>
                  {r.nam_ca_nhan_sinh_nhat.truoc_sinh_nhat !== r.nam_ca_nhan && ` (trước sinh nhật: ${r.nam_ca_nhan_sinh_nhat.truoc_sinh_nhat})`}</span>
                {r.nhan_moc.map((t) => <span key={t} className="rounded-full bg-gold/15 px-2.5 py-0.5 text-xs text-gold">{t}</span>)}
              </div>
              {r.nghia_nam && (
                <p className="mt-2 text-sm"><b>{r.nghia_nam.chu_de}.</b> {r.nghia_nam.y_nghia}
                  {r.nghia_nam.hay_gap && <span className="text-fg-muted"> Thường được đối chiếu với: {r.nghia_nam.hay_gap}</span>}</p>
              )}
              <p className="mt-1 text-xs text-fg-faint">
                Giai đoạn {r.dinh} (số {r.so_dinh}{r.nghia_dinh ? ` — ${r.nghia_dinh.chu_de}` : ""}) · thử thách {r.thu_thach}{r.nghia_thu_thach ? ` — ${r.nghia_thu_thach.mo_ta}` : ""}
              </p>
            </article>
          ))}
          <p className="text-xs text-fg-faint">{cachDoc}</p>
        </div>
      )}
    </section>
  );
}
