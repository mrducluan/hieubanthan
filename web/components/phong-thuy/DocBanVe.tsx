"use client";
// TY-2 đợt 4 — "Máy đọc bản vẽ": người dùng đã đặt ảnh bản vẽ làm nền sơ đồ, tự tích đồng ý, bấm Đọc → engine trả CHỖ gợi ý
// (toạ độ theo ảnh) + đường bao nhà. Web chỉ đổi toạ độ hiển thị (lib/can-anh) và vẽ; mỗi chỗ phải được bấm "Đúng" mới thành
// điểm trên sơ đồ — phương, Cửa – Chủ – Bếp vẫn do engine tính như khi chạm tay. Chỉ bản Việt (bản Anh không gửi ảnh).
import { Check, Crosshair, RotateCw, ScanEye, X } from "lucide-react";
import Link from "@/components/khung/Lien";
import { ChuB, useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import type { ChoBanVe, Diem, KhungBanVe } from "@/lib/can-anh";
import type { LoaiVat } from "@/lib/ho-so-nha";
import { cn } from "@/lib/utils";

export interface KqBanVe { la_ban_ve: boolean | null; khung: KhungBanVe | null; cho: ChoBanVe[]; luu_y: string[] }
/** Một gợi ý đã đổi sang toạ độ sơ đồ (null = ngoài khung nhà). */
export interface GoiYHien { cho: ChoBanVe; diem: Diem | null; daCo: boolean }

export function PanelDocBanVe({ dongY, onDongY, dang, thongBao, kq, goiY, gocXoay, coTheCan, onDoc, onDung, onBo, onDungHet, onXoay, onCan }: {
  dongY: boolean; onDongY: (b: boolean) => void; dang: boolean; thongBao: string | null; kq: KqBanVe | null;
  goiY: GoiYHien[]; gocXoay: number; coTheCan: boolean;
  onDoc: () => void; onDung: (ma: LoaiVat) => void; onBo: (ma: LoaiVat) => void; onDungHet: () => void; onXoay: () => void; onCan: () => void;
}) {
  const { c } = useChuPT();
  const datDuoc = goiY.filter((g) => g.diem);
  return (
    <section className="rounded-xl border border-line/70 bg-surface/40 p-3 text-xs" data-testid="ban-ve" aria-labelledby="ban-ve-td">
      <p id="ban-ve-td" className="flex items-center gap-1.5 text-sm font-medium text-fg"><ScanEye className="size-4 text-gold" aria-hidden /> {c("dv.bv.tieu_de")}</p>
      <p className="mt-1 text-fg-muted"><ChuB chu={c("dv.bv.gioi_thieu")} /></p>
      <label className="mt-2 flex items-start gap-2 text-fg">
        <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[rgb(var(--gold))]" checked={dongY} data-testid="ban-ve-dong-y"
          onChange={(e) => onDongY(e.target.checked)} />
        <span>{c("dv.bv.dong_y")}{" "}<Link href="/chinh-sach-rieng-tu#ben-thu-ba" className="text-gold underline">{c("dv.bv.chinh_sach")}</Link></span>
      </label>
      <button type="button" onClick={onDoc} disabled={!dongY || dang} data-testid="ban-ve-doc"
        className="mt-2 inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-gold/60 bg-gold/10 px-3 py-1 text-gold disabled:opacity-50">
        <ScanEye className="size-3.5" aria-hidden /> {dang ? c("dv.bv.dang") : c("dv.bv.nut")}
      </button>
      {thongBao && <p className="mt-2 text-fg-muted" role="status" data-testid="ban-ve-bao">{thongBao}</p>}

      {kq && kq.la_ban_ve !== false && goiY.length > 0 && (
        <div className="mt-3 space-y-2" aria-live="polite">
          {gocXoay > 0 && (
            <p className="rounded-lg border border-gold/40 bg-gold/5 p-2 text-fg-muted" data-testid="ban-ve-goi-xoay">
              {c("dv.bv.xoay", { phia: c(`dv.bv.phia.${gocXoay}`) })}{" "}
              <button type="button" onClick={onXoay} data-testid="ban-ve-xoay" className="inline-flex min-h-[32px] items-center gap-1 text-gold underline">
                <RotateCw className="size-3.5" aria-hidden /> {c("dv.bv.xoay_nut")}</button>
            </p>
          )}
          {gocXoay === 0 && coTheCan && (
            <p className="rounded-lg border border-gold/40 bg-gold/5 p-2 text-fg-muted" data-testid="ban-ve-goi-can">
              {c("dv.bv.can")}{" "}
              <button type="button" onClick={onCan} data-testid="ban-ve-can" className="inline-flex min-h-[32px] items-center gap-1 text-gold underline">
                <Crosshair className="size-3.5" aria-hidden /> {c("dv.bv.can_nut")}</button>
            </p>
          )}
          <p className="text-fg-muted"><ChuB chu={c("dv.bv.goi_y", { n: String(goiY.length) })} /></p>
          <ul className="space-y-1.5">
            {goiY.map((g) => (
              <li key={g.cho.ma} data-testid={`ban-ve-cho-${g.cho.ma}`} className="flex flex-wrap items-center gap-2 rounded-lg border border-line/60 bg-bg/30 px-2 py-1.5">
                <span className="font-medium text-fg">{c(`dv.ten.${g.cho.ma}`)}</span>
                <span className="text-fg-faint">{Math.round(g.cho.do_tin * 100)}%</span>
                {g.cho.ly_do && <span className="w-full text-fg-muted sm:w-auto sm:flex-1">{g.cho.ly_do}</span>}
                {!g.diem && <span className="w-full text-gold">{c("dv.bv.ngoai")}</span>}
                <span className="ml-auto flex gap-1.5">
                  <button type="button" disabled={!g.diem} onClick={() => onDung(g.cho.ma as LoaiVat)} data-testid={`ban-ve-dung-${g.cho.ma}`}
                    className="inline-flex min-h-[32px] items-center gap-1 rounded-full border border-jade/60 bg-jade/10 px-2.5 text-fg disabled:opacity-40">
                    <Check className="size-3.5" aria-hidden /> {g.daCo ? c("dv.bv.doi") : c("dv.bv.dung")}</button>
                  <button type="button" onClick={() => onBo(g.cho.ma as LoaiVat)} data-testid={`ban-ve-bo-${g.cho.ma}`}
                    className="inline-flex min-h-[32px] items-center gap-1 rounded-full border border-line px-2.5 text-fg-muted hover:text-fg">
                    <X className="size-3.5" aria-hidden /> {c("dv.bv.bo")}</button>
                </span>
              </li>
            ))}
          </ul>
          {datDuoc.length > 1 && (
            <button type="button" onClick={onDungHet} data-testid="ban-ve-dung-het"
              className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-jade/60 px-3 text-fg">
              <Check className="size-3.5" aria-hidden /> {c("dv.bv.dung_het")}</button>
          )}
          <p className="text-fg-faint">{c("dv.bv.nhac")}</p>
        </div>
      )}
      {kq?.luu_y.length ? <ul className="mt-2 list-disc pl-5 text-fg-faint">{kq.luu_y.map((x) => <li key={x}>{x}</li>)}</ul> : null}
    </section>
  );
}

/** Chấm nét đứt trên sơ đồ cho chỗ chưa xác nhận + khung nét đứt đường bao máy thấy (khi chưa căn). Bấm chấm = Đúng. */
export function LopGoiYBanVe({ goiY, bao, rong, sau, net, mau, onDung, ten }: {
  goiY: GoiYHien[]; bao: [Diem, Diem] | null; rong: number; sau: number; net: number;
  mau: (ma: LoaiVat) => string; onDung: (ma: LoaiVat) => void; ten: (ma: LoaiVat) => string;
}) {
  const r = Math.max(0.25, Math.min(rong, sau) * 0.035);
  return (
    <g data-testid="ban-ve-lop">
      {bao && (
        <rect x={bao[0][0] * rong} y={bao[0][1] * sau} width={(bao[1][0] - bao[0][0]) * rong} height={(bao[1][1] - bao[0][1]) * sau}
          fill="none" stroke="rgb(var(--gold))" strokeWidth={net} strokeDasharray={`${net * 4} ${net * 3}`} pointerEvents="none" />
      )}
      {goiY.map((g) => g.diem && (
        <g key={g.cho.ma} data-testid={`ban-ve-cham-${g.cho.ma}`} role="button" tabIndex={-1} aria-label={ten(g.cho.ma as LoaiVat)}
          className="cursor-pointer" onPointerDown={(e) => { e.stopPropagation(); onDung(g.cho.ma as LoaiVat); }}>
          <circle cx={g.diem[0] * rong} cy={g.diem[1] * sau} r={r} fill="rgb(var(--bg) / 0.6)" stroke={mau(g.cho.ma as LoaiVat)}
            strokeWidth={net * 1.4} strokeDasharray={`${net * 2.5} ${net * 2}`} className={cn("motion-safe:animate-pulse")} />
          <text x={g.diem[0] * rong} y={g.diem[1] * sau - r * 1.4} textAnchor="middle" fontSize={r * 1.1} fill="rgb(var(--fg))"
            pointerEvents="none">{ten(g.cho.ma as LoaiVat)}?</text>
        </g>
      ))}
    </g>
  );
}
