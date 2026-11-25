"use client";
// TY-2 đợt 3 — "Nhà nhiều lớp" (Dương Trạch Tam Yếu: tĩnh / động / biến / hoá trạch). Người dùng tự khai số lớp từ cổng vào,
// lớp có dãy nhà chính (cổng lệch hay không engine tự suy từ phía cổng — gói 1); ENGINE đếm sao từng lớp và đánh giá (`nhieu_lop` của /api/phongthuy/tam-yeu/so-do).
// Web chỉ thu lựa chọn và vẽ — không tính sao, không chấm mức.
import { Layers, Star } from "lucide-react";
import { ChuB, useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import { NHAN_MUC, type Muc } from "@/components/luan-giai/kieu";
import { cn } from "@/lib/utils";

export interface LuaChonLop { so_lop: number; lop_chu?: number; cua_lech?: boolean }
export interface NhieuLopRes {
  loai: "tinh" | "dong" | "bien" | "hoa"; ten_loai: string; y: string; so_lop: number; quy_uoc: string;
  lop: { so: number; du_nien: string; ten_du_nien: string; sao: string; hanh: string; muc: Muc }[] | null;
  lop_chu: { so: number; muc: Muc } | null; loi_lop_chu: string | null;
  lop_nen_cao: number[]; loi_nen_cao: string | null; ap_sat: string | null; can_cu: string[];
}

const SO = Array.from({ length: 15 }, (_, i) => i + 1);

/** Ba ô nhập: số lớp, lớp nhà chính, cổng lệch. */
export function NhapNhieuLop({ gia, onDoi }: { gia: LuaChonLop | null; onDoi: (g: LuaChonLop | null) => void }) {
  const { c } = useChuPT();
  const so = gia?.so_lop ?? 0;
  return (
    <fieldset className="mt-3 rounded-xl border border-line/70 bg-surface/40 p-3 text-xs" data-testid="tam-yeu-nhieu-lop-nhap">
      <legend className="flex items-center gap-1.5 px-1 text-sm font-medium text-fg"><Layers className="size-4 text-gold" aria-hidden /> {c("nl.nhap_ten")}</legend>
      <p className="text-fg-muted"><ChuB chu={c("nl.nhap_hd")} /></p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-fg-muted">{c("nl.so_lop")}
          <select value={so || ""} data-testid="tam-yeu-so-lop" className="h-9 rounded-lg border border-line bg-bg/40 px-2 text-sm text-fg"
            onChange={(e) => {
              const n = Number(e.target.value);
              onDoi(n ? { so_lop: n, ...(gia?.lop_chu && gia.lop_chu <= n ? { lop_chu: gia.lop_chu } : {}) } : null);
            }}>
            <option value="">{c("nl.chua_chon")}</option>
            {SO.map((n) => <option key={n} value={n}>{n === 1 ? c("nl.mot_san") : String(n)}</option>)}
          </select>
        </label>
        {so > 1 && (
          <label className="flex flex-col gap-1 text-fg-muted">{c("nl.lop_chu")}
            <select value={gia?.lop_chu ?? ""} data-testid="tam-yeu-lop-chu" className="h-9 rounded-lg border border-line bg-bg/40 px-2 text-sm text-fg"
              onChange={(e) => { const n = Number(e.target.value); onDoi({ ...gia!, ...(n ? { lop_chu: n } : { lop_chu: undefined }) }); }}>
              <option value="">{c("nl.chua_chon")}</option>
              {SO.slice(1, so).map((n) => <option key={n} value={n}>{String(n)}</option>)}
            </select>
          </label>
        )}
      </div>
    </fieldset>
  );
}

/** Kết quả: dãy lớp từ cổng (dưới) vào sâu (trên), lớp nhà chính nổi bật, lớp hợp làm nhà chính có dấu sao. */
export function KetQuaNhieuLop({ nl }: { nl: NhieuLopRes }) {
  const { c, en } = useChuPT();
  const nhanMuc = (m: Muc) => (en ? c(m === "can_chu_dong" ? "sd.luu_y" : `sd.${m}`) : NHAN_MUC[m]);
  return (
    <div className="rounded-xl border border-line/70 bg-surface/40 p-4 text-sm" data-testid="tam-yeu-nhieu-lop">
      <p className="text-xs uppercase tracking-wide text-gold">{c("nl.tieu_de")}</p>
      <p className="mt-1 font-medium text-fg">{nl.ten_loai}</p>
      <p className="mt-0.5 text-fg-muted">{nl.y}</p>
      {nl.lop && nl.lop.length > 0 && (
        <ol className="mt-3 flex flex-col-reverse gap-1" aria-label={c("nl.day_aria")}>
          {nl.lop.map((x) => {
            const chinh = nl.lop_chu?.so === x.so;
            return (
              <li key={x.so} data-testid={`tam-yeu-lop-${x.so}`} data-muc={x.muc}
                className={cn("chip-muc flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs", chinh && "ring-1 ring-gold")}>
                <span className="w-14 shrink-0 text-fg-faint">{x.so === 1 ? c("nl.cong") : c("nl.lop", { so: String(x.so) })}</span>
                <span className="font-semibold">{x.sao}</span>
                <span className="text-fg-muted">· {x.ten_du_nien}</span>
                {chinh && <span className="ml-auto rounded-full border border-gold/60 px-2 text-[10px] text-gold">{c("nl.nha_chinh")}</span>}
                {!chinh && nl.lop_nen_cao.includes(x.so) && <Star className="ml-auto size-3.5 text-gold" aria-label={c("nl.hop_lam_chinh")} />}
                <span className="sr-only">{nhanMuc(x.muc)}</span>
              </li>
            );
          })}
        </ol>
      )}
      {nl.loi_lop_chu && <p className="mt-3 text-fg" data-testid="tam-yeu-lop-chu-loi">{nl.loi_lop_chu}</p>}
      {nl.loi_nen_cao && <p className="mt-1 text-fg-muted">{nl.loi_nen_cao}</p>}
      {nl.ap_sat && <p className="mt-2 rounded-lg border border-gold/40 bg-gold/5 p-2 text-fg-muted" data-testid="tam-yeu-ap-sat">{nl.ap_sat}</p>}
      <p className="mt-2 text-[11px] leading-relaxed text-fg-faint">{nl.quy_uoc}</p>
      {nl.can_cu.length > 0 && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer text-fg-muted">{c("nl.vi_sao")}</summary>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-fg-muted">{nl.can_cu.map((x) => <li key={x}>{x}</li>)}</ul>
        </details>
      )}
    </div>
  );
}
