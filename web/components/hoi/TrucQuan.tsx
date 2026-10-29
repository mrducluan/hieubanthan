"use client";
// HD-CS — vẽ khối trực quan kèm câu trả lời hỏi đáp. Dữ liệu do engine dựng sẵn (`truc_quan`, engine/app/luangiai/
// truc_quan.py) từ chính gói bằng chứng của câu trả lời; ở đây CHỈ vẽ theo `kieu`, không tính gì. Kiểu lạ → bỏ qua
// (engine mới hơn web không làm vỡ trang). Bấm một cột / ô / hướng → hiện câu giải thích ngay dưới hình.
import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useChieuSang } from "@/components/hoi/ChieuSang";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import { ghi } from "@/lib/do-luong";

export type Sac = "chinh" | "hop" | "trung" | "nhat";
type Muc = { nhan: string; gia_tri?: string | number; chu_thich?: string; giai_thich?: string; sac?: Sac; vi_tri?: number;
  phu?: string; huong?: string; muc_ma?: string; /** cụm chữ trong lời trả lời trỏ về mục này (ChieuSang) */ khop?: string[] };
export type KhoiTrucQuan =
  | { kieu: "thang"; tieu_de: string; nac: string[]; muc: Muc[]; ghi_chu?: string }
  | { kieu: "nhip" | "o" | "so" | "la_ban"; tieu_de: string; muc: Muc[]; ghi_chu?: string }
  | { kieu: "cot"; tieu_de: string; muc: Muc[]; don_vi?: string; ghi_chu?: string }
  | { kieu: "chu_ky"; tieu_de: string; so_nac: number; hien_tai: number; nhan_hien_tai?: string; giai_thich?: string }
  | { kieu: "hai_cot"; tieu_de: string; trai: { tieu_de: string; ds: string[] }; phai: { tieu_de: string; ds: string[] } }
  | { kieu: "cung"; tieu_de: string; chi_hoi: string; muc: (Muc & { chi: string; vai: string; sao?: string[] })[]; ghi_chu?: string }
  | { kieu: "hao"; tieu_de: string; muc: (Muc & { vi_tri: number; duong: boolean; dong: boolean; chu: boolean })[]; ghi_chu?: string };

/** Các kiểu web biết vẽ — kiểu khác (engine mới hơn web) bị bỏ qua, không chiếm chỗ cột hình. */
export const KIEU_BIET = new Set(["thang", "nhip", "o", "so", "cot", "chu_ky", "hai_cot", "la_ban", "cung", "hao"]);

/** Thẻ chia sẻ / câu hỏi chuẩn engine gắn kèm khối (HD-CS đợt 3). */
export type CoCauChuan = { cau_chuan?: string };

/** Hành động trang cung cấp cho hình (hướng C): Tử vi truyền `xemCung` để "Xem trên lá số" chọn đúng cung phía trên. */
export const HanhDongTrucQuan = createContext<{ xemCung?: (chi: string) => void }>({});

const NEN: Record<Sac, string> = { chinh: "bg-gold", hop: "bg-jade", trung: "bg-moon/70", nhat: "bg-fg-faint/40" };
const CHU: Record<Sac, string> = { chinh: "text-gold", hop: "text-jade", trung: "text-moon", nhat: "text-fg-faint" };
const VIEN: Record<Sac, string> = { chinh: "border-gold/60", hop: "border-jade/60", trung: "border-moon/40", nhat: "border-line" };

// Trang dựng sẵn trên máy chủ (thẻ chia sẻ, bài đã lưu) truyền `tinh`: không hiệu ứng mọc cột — máy chủ không biết người xem
// có tắt chuyển động không, vẽ trạng thái đầu khác máy khách sẽ lệch hydrate (cột kẹt ở 0 với người tắt chuyển động).
const TinhCtx = createContext(false);
function useGiamChuyenDong(): boolean {
  const giam = useReducedMotion();
  return useContext(TinhCtx) || !!giam;
}

export function TrucQuan({ ds, tinh = false }: { ds?: KhoiTrucQuan[]; tinh?: boolean }) {
  if (!ds?.length) return null;
  return (
    <TinhCtx.Provider value={tinh}>
    <div className="space-y-3" data-testid="truc-quan">
      {ds.map((k, i) => <SoKhoi.Provider key={`${k.kieu}-${i}`} value={i}><Khoi k={k} ki={i} /></SoKhoi.Provider>)}
    </div>
    </TinhCtx.Provider>
  );
}

// Chỉ số khối trong câu trả lời — để chữ trong lời trả lời (ChieuSang, id "khối:mục") sáng đúng mục.
const SoKhoi = createContext(-1);

/** Mục đang chọn của một khối; chữ trong lời trả lời bấm vào trỏ tới khối này thì chọn đúng mục đó. */
function useChon(): [number | null, (v: number | null) => void] {
  const ki = useContext(SoKhoi);
  const { sang } = useChieuSang();
  const [chon, setChon] = useState<number | null>(null);
  useEffect(() => {
    if (sang && sang.id.startsWith(`${ki}:`)) setChon(Number(sang.id.slice(sang.id.indexOf(":") + 1)));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ khi có lần bấm chữ mới
  }, [sang?.lan]);
  return [chon, setChon];
}

function Khoi({ k, ki }: { k: KhoiTrucQuan; ki: number }) {
  const daDem = useRef(false);
  const khung = useRef<HTMLElement>(null);
  const { sang } = useChieuSang();
  // Chữ trỏ về khối này → đưa hình vào màn hình (đang đọc lời ở dưới thì hình có thể đã trôi khỏi màn hình).
  useEffect(() => {
    if (!sang || !sang.id.startsWith(`${ki}:`) || !khung.current) return;
    const giam = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    khung.current.scrollIntoView({ block: "nearest", behavior: giam ? "auto" : "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ khi có lần bấm chữ mới
  }, [sang?.lan]);
  const noi = (() => {
    switch (k.kieu) {
      case "thang": return <Thang k={k} />;
      case "nhip": return <Chon muc={k.muc} ve={(m, chon, bam) => <ONhip m={m} chon={chon} bam={bam} />} luoi="grid-cols-3" />;
      case "o": return <Chon muc={k.muc} ve={(m, chon, bam) => <OThe m={m} chon={chon} bam={bam} />} luoi="grid-cols-1 min-[420px]:grid-cols-2" />;
      case "so": return <Chon muc={k.muc} ve={(m, chon, bam) => <OSo m={m} chon={chon} bam={bam} />} luoi="grid-cols-2 min-[420px]:grid-cols-4" />;
      case "cot": return <Cot k={k} />;
      case "chu_ky": return <ChuKy k={k} />;
      case "hai_cot": return <HaiCot k={k} />;
      case "la_ban": return <LaBan muc={k.muc} />;
      case "cung": return <BanCung k={k} />;
      case "hao": return <Hao k={k} />;
      default: return null;
    }
  })();
  if (!noi) return null;
  const ghiChu = "ghi_chu" in k ? k.ghi_chu : undefined;
  return (
    // Đo (khâu QUAY LẠI): người đọc có bấm vào hình không — chỉ mã kiểu khối, một lần mỗi khối.
    <figure ref={khung} className="scroll-mt-24 rounded-2xl border border-line/70 bg-surface-2/40 p-3.5 sm:p-4" data-kieu={k.kieu}
      onClickCapture={(e) => {
        if (daDem.current || !(e.target as HTMLElement).closest("button,[role=button]")) return;
        daDem.current = true;
        ghi("chart_interacted", { kind: "hoi_truc_quan", kieu: k.kieu });
      }}>
      <figcaption className="mb-3 text-[0.78rem] font-semibold uppercase tracking-wider text-gold/90">{k.tieu_de}</figcaption>
      {noi}
      {ghiChu && <p className="mt-3 text-xs leading-relaxed text-fg-faint">{ghiChu}</p>}
    </figure>
  );
}

/** Danh sách mục bấm được + một ô giải thích dùng chung bên dưới. */
function Chon({ muc, ve, luoi }: { muc: Muc[]; ve: (m: Muc, chon: boolean, bam: () => void) => ReactNode; luoi: string }) {
  const [chon, setChon] = useChon();
  const m = chon === null ? null : muc[chon];
  return (
    <>
      <div className={cn("grid gap-2", luoi)}>
        {muc.map((x, i) => <div key={`${x.nhan}-${i}`} className="min-w-0">{ve(x, chon === i, () => setChon(chon === i ? null : i))}</div>)}
      </div>
      <GiaiThich chu={m ? m.giai_thich || m.chu_thich : undefined} nhan={m?.nhan} />
    </>
  );
}

function GiaiThich({ chu, nhan }: { chu?: string; nhan?: string }) {
  return (
    <div aria-live="polite">
      {chu && (
        <p className="mt-3 border-l-2 border-gold/70 pl-3 text-sm leading-relaxed text-fg-muted">
          {nhan && <span className="font-semibold text-fg">{nhan}: </span>}{chu}
        </p>
      )}
    </div>
  );
}

const nutCls = "w-full rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60";

function ONhip({ m, chon, bam }: { m: Muc; chon: boolean; bam: () => void }) {
  const s = m.sac ?? "trung";
  return (
    <button type="button" aria-pressed={chon} onClick={bam} className={cn(nutCls, "min-h-[5.5rem] px-2.5 py-2.5", chon ? VIEN[s] : "border-line/60", "bg-bg/40")}>
      <span className="block text-sm font-semibold text-fg">{m.nhan}</span>
      {m.phu && <span className="block text-[0.7rem] text-fg-faint">từ {m.phu}</span>}
      <span className={cn("mt-1.5 flex items-center gap-1.5 text-[0.8rem] font-medium", CHU[s])}>
        <span className={cn("size-2 shrink-0 rounded-full", NEN[s])} aria-hidden />{m.gia_tri}
      </span>
    </button>
  );
}

function OThe({ m, chon, bam }: { m: Muc; chon: boolean; bam: () => void }) {
  const s = m.sac ?? "trung";
  return (
    <button type="button" aria-pressed={chon} onClick={bam} className={cn(nutCls, "px-3 py-2.5 bg-bg/40", chon ? VIEN[s] : "border-line/60")}>
      <span className="block text-xs text-fg-muted">{m.nhan}</span>
      <span className={cn("block text-base font-semibold", CHU[s])}>{m.gia_tri}</span>
      {m.chu_thich && <span className="mt-0.5 line-clamp-2 block text-xs leading-snug text-fg-faint">{m.chu_thich}</span>}
    </button>
  );
}

function OSo({ m, chon, bam }: { m: Muc; chon: boolean; bam: () => void }) {
  const s = m.sac ?? "trung";
  return (
    <button type="button" aria-pressed={chon} onClick={bam} className={cn(nutCls, "flex flex-col items-center px-2 py-3 text-center bg-bg/40", chon ? VIEN[s] : "border-line/60")}>
      <span className={cn("font-serif text-3xl leading-none tabular-nums", CHU[s])}>{m.gia_tri}</span>
      <span className="mt-1.5 text-xs text-fg-muted">{m.nhan}</span>
    </button>
  );
}

function Thang({ k }: { k: Extract<KhoiTrucQuan, { kieu: "thang" }> }) {
  const giam = useGiamChuyenDong();
  const [chon, setChon] = useChon();
  const n = k.nac.length;
  const m = chon === null ? null : k.muc[chon];
  return (
    <>
      <div className="space-y-2.5">
        {k.muc.map((x, i) => {
          const vt = Math.max(0, Math.min(n - 1, x.vi_tri ?? 0));
          return (
            <button key={`${x.nhan}-${i}`} type="button" aria-pressed={chon === i} onClick={() => setChon(chon === i ? null : i)}
              aria-label={`${x.nhan}: ${k.nac[vt]}`}
              className={cn(nutCls, "block px-3 py-2.5 bg-bg/40", chon === i ? "border-gold/60" : "border-line/60")}>
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-fg">{x.nhan}</span>
                <span className="text-xs text-gold">{k.nac[vt]}</span>
              </span>
              <span className="mt-2 grid gap-1" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} aria-hidden>
                {k.nac.map((_, j) => (
                  <motion.span key={j} className={cn("h-2 rounded-full", j <= vt ? (j === vt ? "bg-gold" : "bg-gold/35") : "bg-line/70")}
                    initial={giam ? false : { scaleX: 0 }} animate={{ scaleX: 1 }} style={{ originX: 0 }}
                    transition={{ duration: 0.25, delay: giam ? 0 : j * 0.05 }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 grid gap-1 px-3 text-[0.65rem] text-fg-faint" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }} aria-hidden>
        {k.nac.map((t) => <span key={t} className="truncate text-center">{t}</span>)}
      </div>
      <GiaiThich chu={m?.giai_thich} nhan={m?.nhan} />
    </>
  );
}

function Cot({ k }: { k: Extract<KhoiTrucQuan, { kieu: "cot" }> }) {
  const giam = useGiamChuyenDong();
  const [chon, setChon] = useChon();
  const lon = Math.max(1, ...k.muc.map((m) => Number(m.gia_tri) || 0));
  const m = chon === null ? null : k.muc[chon];
  return (
    <>
      <div className="grid grid-cols-5 items-end gap-2" style={{ height: "9.5rem" }}>
        {k.muc.map((x, i) => {
          const v = Number(x.gia_tri) || 0;
          const s = x.sac ?? "trung";
          return (
            <button key={x.nhan} type="button" aria-pressed={chon === i} onClick={() => setChon(chon === i ? null : i)}
              aria-label={`${x.nhan} ${v}${k.don_vi ?? ""}`}
              className={cn("flex h-full flex-col items-center justify-end gap-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                chon === i && "bg-surface/60")}>
              <span className={cn("text-xs tabular-nums", CHU[s])}>{v}{k.don_vi}</span>
              <motion.span className={cn("w-full max-w-10 rounded-t-md", NEN[s])} style={{ height: `${Math.max(3, (v / lon) * 100)}%`, originY: 1 }}
                initial={giam ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.35, delay: giam ? 0 : i * 0.05 }} />
            </button>
          );
        })}
      </div>
      <div className="mt-1.5 grid grid-cols-5 gap-2 text-center text-xs text-fg-muted" aria-hidden>
        {k.muc.map((x) => <span key={x.nhan}>{x.nhan}</span>)}
      </div>
      <GiaiThich chu={m?.giai_thich} nhan={m?.nhan} />
    </>
  );
}

function ChuKy({ k }: { k: Extract<KhoiTrucQuan, { kieu: "chu_ky" }> }) {
  const giam = useGiamChuyenDong();
  return (
    <>
      <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${k.so_nac}, minmax(0, 1fr))` }} aria-label={`Đang ở năm số ${k.hien_tai} của vòng ${k.so_nac} năm`}>
        {Array.from({ length: k.so_nac }, (_, i) => i + 1).map((s) => {
          const nay = s === k.hien_tai;
          return (
            <li key={s} aria-current={nay ? "step" : undefined}
              className={cn("relative grid h-12 place-items-center rounded-lg text-sm tabular-nums",
                nay ? "bg-gold font-semibold text-bg" : s < k.hien_tai ? "bg-gold/15 text-fg-muted" : "bg-surface text-fg-faint")}>
              {nay && !giam && <motion.span className="absolute inset-0 rounded-lg ring-2 ring-gold/60" initial={{ opacity: 0.9, scale: 1 }}
                animate={{ opacity: 0, scale: 1.25 }} transition={{ duration: 1.4, repeat: 2 }} aria-hidden />}
              {s}
            </li>
          );
        })}
      </ol>
      {k.nhan_hien_tai && <p className="mt-3 text-sm font-semibold text-fg">{k.nhan_hien_tai}</p>}
      {k.giai_thich && <p className="mt-1 text-sm leading-relaxed text-fg-muted">{k.giai_thich}</p>}
    </>
  );
}

function HaiCot({ k }: { k: Extract<KhoiTrucQuan, { kieu: "hai_cot" }> }) {
  const cot = (c: { tieu_de: string; ds: string[] }, s: Sac) => c.ds.length > 0 && (
    <div className={cn("rounded-xl border bg-bg/40 p-3", VIEN[s])}>
      <p className={cn("text-xs font-semibold uppercase tracking-wider", CHU[s])}>{c.tieu_de}</p>
      <ul className="mt-2 space-y-1.5 text-sm leading-snug text-fg">
        {c.ds.map((d) => <li key={d} className="flex gap-2"><span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", NEN[s])} aria-hidden />{d}</li>)}
      </ul>
    </div>
  );
  return <div className="grid gap-2 sm:grid-cols-2">{cot(k.trai, "hop")}{cot(k.phai, "chinh")}</div>;
}

const GOC: Record<string, number> = { "Bắc": 0, "Đông Bắc": 45, "Đông": 90, "Đông Nam": 135, "Nam": 180, "Tây Nam": 225, "Tây": 270, "Tây Bắc": 315 };
const VIET_TAT: Record<string, string> = { "Bắc": "B", "Đông Bắc": "ĐB", "Đông": "Đ", "Đông Nam": "ĐN", "Nam": "N", "Tây Nam": "TN", "Tây": "T", "Tây Bắc": "TB" };

function LaBan({ muc }: { muc: Muc[] }) {
  const [chon, setChon] = useChon();
  const id = useId();
  const m = chon === null ? null : muc[chon];
  const R = 92, r = 34, C = 110;
  const diem = (goc: number, ban: number) => {
    const a = ((goc - 90) * Math.PI) / 180;
    return [C + ban * Math.cos(a), C + ban * Math.sin(a)] as const;
  };
  const quat = (goc: number) => {
    const [x1, y1] = diem(goc - 22.5, R), [x2, y2] = diem(goc + 22.5, R), [x3, y3] = diem(goc + 22.5, r), [x4, y4] = diem(goc - 22.5, r);
    return `M${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2} L${x3} ${y3} A${r} ${r} 0 0 0 ${x4} ${y4}Z`;
  };
  return (
    <>
      <div className="flex flex-col items-center gap-3 min-[420px]:flex-row min-[420px]:items-start">
        <svg viewBox="0 0 220 220" className="w-full max-w-[15rem] shrink-0" role="group" aria-labelledby={id}>
          <title id={id}>La bàn tám hướng, hướng hợp được tô sáng</title>
          {muc.map((x, i) => {
            const g = GOC[x.huong ?? ""];
            if (g === undefined) return null;
            const hop = x.sac === "hop";
            const [tx, ty] = diem(g, (R + r) / 2);
            return (
              <g key={x.huong} role="button" tabIndex={0} aria-pressed={chon === i} aria-label={`${x.huong}: ${hop ? x.nhan : "ít hợp"}`}
                onClick={() => setChon(chon === i ? null : i)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setChon(chon === i ? null : i); } }}
                className="cursor-pointer outline-none [&:focus-visible>path]:stroke-gold">
                <path d={quat(g)} className={cn(hop ? "fill-jade/35" : "fill-surface", chon === i ? "stroke-gold" : "stroke-bg")} strokeWidth={chon === i ? 2.5 : 2} />
                <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central"
                  className={cn("text-[13px] font-semibold", hop ? "fill-fg" : "fill-fg-faint")}>{VIET_TAT[x.huong ?? ""]}</text>
              </g>
            );
          })}
          <circle cx={C} cy={C} r={r - 4} className="fill-bg stroke-gold/50" strokeWidth={1} />
          <text x={C} y={C} textAnchor="middle" dominantBaseline="central" className="fill-gold text-[11px]">Nhà</text>
        </svg>
        <ul className="grid w-full grid-cols-2 gap-1.5 text-sm">
          {muc.filter((x) => x.sac === "hop").map((x) => (
            <li key={x.huong} className="rounded-lg border border-jade/40 bg-bg/40 px-2.5 py-1.5">
              <span className="block font-semibold text-fg">{x.huong}</span>
              <span className="block text-xs text-jade">{x.nhan}</span>
            </li>
          ))}
        </ul>
      </div>
      <GiaiThich chu={m?.giai_thich} nhan={m?.huong} />
    </>
  );
}

// Bàn 12 cung theo lối lá số Việt: Tỵ Ngọ Mùi Thân trên cùng, Dần Sửu Tý Hợi dưới cùng, giữa là ô tên cung được hỏi.
const VI_TRI_CHI: Record<string, [number, number]> = {
  "Tỵ": [1, 1], "Ngọ": [1, 2], "Mùi": [1, 3], "Thân": [1, 4], "Thìn": [2, 1], "Dậu": [2, 4],
  "Mão": [3, 1], "Tuất": [3, 4], "Dần": [4, 1], "Sửu": [4, 2], "Tý": [4, 3], "Hợi": [4, 4],
};

function BanCung({ k }: { k: Extract<KhoiTrucQuan, { kieu: "cung" }> }) {
  const { xemCung } = useContext(HanhDongTrucQuan);
  const giam = useGiamChuyenDong();
  const [chon, setChon] = useChon();
  const hoi = k.muc.find((m) => m.vai === "hoi");
  const m = chon === null ? null : k.muc[chon];
  return (
    <>
      <div className="mx-auto grid aspect-square w-full max-w-[22rem] grid-cols-4 grid-rows-4 gap-1">
        {k.muc.map((x, i) => {
          const vt = VI_TRI_CHI[x.chi];
          if (!vt) return null;
          const s = x.sac ?? "nhat";
          return (
            // Ô cung bấm được (đợt 3): hiện "cung này nói về gì" bên dưới bàn.
            <button key={x.chi} type="button" style={{ gridRow: vt[0], gridColumn: vt[1] }} data-vai={x.vai || undefined}
              aria-pressed={chon === i} aria-label={`Cung ${x.nhan}${x.sao?.length ? `: ${x.sao.join(", ")}` : ""}`}
              onClick={() => setChon(chon === i ? null : i)}
              className={cn("relative flex min-w-0 flex-col justify-between overflow-hidden rounded-lg border p-1 text-left text-[0.62rem] leading-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 sm:p-1.5 sm:text-[0.7rem]",
                x.vai === "hoi" ? "border-gold bg-gold/20" : x.vai === "tam_hop" ? "border-jade/50 bg-jade/10"
                  : x.vai === "xung" ? "border-dashed border-moon/70 bg-bg/40" : "border-line/60 bg-bg/30",
                chon === i && "ring-2 ring-gold")}>
              {x.vai === "hoi" && !giam && <motion.span aria-hidden className="absolute inset-0 rounded-lg ring-2 ring-gold/70"
                initial={{ opacity: 0.9 }} animate={{ opacity: 0 }} transition={{ duration: 1.6, repeat: 2 }} />}
              <span className={cn("font-semibold", x.vai ? CHU[s] : "text-fg-muted")}>{x.nhan}</span>
              <span className="truncate text-fg-faint">{x.sao?.join(", ") || "\u00a0"}</span>
            </button>
          );
        })}
        <div style={{ gridRow: "2 / span 2", gridColumn: "2 / span 2" }} className="flex flex-col items-center justify-center gap-1.5 rounded-lg p-2 text-center">
          <span className="font-serif text-lg leading-tight text-gold sm:text-xl">{hoi?.nhan}</span>
          <span className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-[0.65rem] text-fg-faint">
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-jade/60" aria-hidden />tam hợp</span>
            <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm border border-dashed border-moon" aria-hidden />đối diện</span>
          </span>
          {xemCung && (
            <button type="button" onClick={() => xemCung(k.chi_hoi)}
              className="mt-1 min-h-9 rounded-full border border-gold/60 px-3 text-xs font-medium text-gold hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60">
              Xem trên lá số
            </button>
          )}
        </div>
      </div>
      <GiaiThich chu={m?.giai_thich} />
    </>
  );
}

/** HD-CS đợt 3 (ý 4) — quẻ Kinh Dịch bấm từng hào (hào 6 trên cùng). Hào động sáng ngọc, hào chủ vàng; bấm hào → "nói nôm
 *  na" của chính lời hào đó (engine lấy từ KB trong gói bằng chứng), hào tĩnh → một câu ngắn. */
function Hao({ k }: { k: Extract<KhoiTrucQuan, { kieu: "hao" }> }) {
  const [chon, setChon] = useChon();
  const m = chon === null ? null : k.muc[chon];
  return (
    <>
      <ol className="mx-auto max-w-xs space-y-1.5" aria-label="Sáu hào, hào 6 trên cùng">
        {[...k.muc].map((x, i) => ({ x, i })).reverse().map(({ x, i }) => {
          const s = x.sac ?? "nhat";
          const mau = x.dong ? NEN[s] : "bg-fg/70";
          return (
            <li key={x.vi_tri}>
              <button type="button" aria-pressed={chon === i} onClick={() => setChon(chon === i ? null : i)}
                aria-label={`${x.nhan}${x.dong ? ", hào động" : ""}${x.chu ? ", hào chủ" : ""}`}
                className={cn("flex min-h-10 w-full items-center gap-3 rounded-lg px-2 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60",
                  chon === i ? "bg-surface/80" : "hover:bg-surface/50")}>
                <span className="flex w-28 shrink-0 gap-2" aria-hidden>
                  {x.duong ? <span className={cn("h-3 w-full rounded-sm", mau)} />
                    : (<><span className={cn("h-3 w-1/2 rounded-sm", mau)} /><span className={cn("h-3 w-1/2 rounded-sm", mau)} /></>)}
                </span>
                <span className={cn("text-left text-xs", x.dong ? CHU[s] : "text-fg-faint")}>
                  {x.nhan}{x.chu ? " · hào chủ" : x.dong ? " · động" : ""}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <GiaiThich chu={m?.giai_thich} nhan={m?.nhan} />
    </>
  );
}
