import type { LuanGiaiResult } from "@/lib/engine";
import { TEN_VI_TRI } from "@/lib/bai-doc";
import { Logo } from "@/components/khung/Logo";
import { VongLacThu } from "./VongLacThu";

// Metaphysics ID — thẻ "danh tính", KHÔNG hiện ngày sinh (để chia sẻ an toàn, docs §4.5 suy luận 5).
export function TheDanhTinh({ kq, tenHienThi }: { kq: LuanGiaiResult; tenHienThi: string }) {
  const tuKhoa = kq.cac_vi_tri.map((v) => v.nghia?.tu_khoa).filter(Boolean).slice(0, 3) as string[];
  return (
    <div className="relative overflow-hidden rounded-2xl p-[1px]" data-testid="the-danh-tinh"
      style={{ background: "linear-gradient(140deg, rgb(var(--gold) / 0.7), rgb(var(--moon) / 0.35) 45%, rgb(var(--jade) / 0.5))" }}>
      <div className="relative overflow-hidden rounded-2xl bg-surface px-6 pb-6 pt-5">
        <VongLacThu className="pointer-events-none absolute -right-16 -top-16 size-64 opacity-60" />
        <div className="flex items-center justify-between">
          <span className="eyebrow">Hồ sơ bản thân</span>
          <Logo className="size-6" />
        </div>
        <p className="mt-3 font-serif text-2xl">{tenHienThi}</p>
        <dl className="mt-5 grid grid-cols-4 gap-2">
          {kq.cac_vi_tri.map((v) => (
            <div key={v.vi_tri} className="rounded-xl bg-bg/50 px-2 py-3 text-center">
              <dd className="font-serif text-3xl leading-none text-gold">{v.gia_tri}</dd>
              <dt className="mt-1.5 text-[0.65rem] uppercase tracking-wider text-fg-faint">{TEN_VI_TRI[v.vi_tri]}</dt>
            </div>
          ))}
        </dl>
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {tuKhoa.map((t) => (
            <li key={t} className="rounded-full border border-line px-3 py-1 text-xs text-fg-muted">{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
