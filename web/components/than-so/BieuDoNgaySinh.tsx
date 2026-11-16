"use client";
import type { MoRong } from "@/lib/engine";
import { cn } from "@/lib/utils";
import { useChuThanSo } from "./chu-than-so";

// Lưới 3×3 (3-6-9 / 2-5-8 / 1-4-7) + mũi tên — chỉ hiển thị dữ liệu engine.
const O = [[3, 6, 9], [2, 5, 8], [1, 4, 7]];

export function BieuDoNgaySinh({ mo }: { mo: MoRong }) {
  const bd = mo.bieu_do;
  const { c } = useChuThanSo();
  return (
    <div className="grid gap-6 md:grid-cols-[15rem_1fr]" data-testid="bieu-do">
      <div role="table" aria-label={c("bd.aria")} className="grid gap-1.5 self-start">
        {O.map((hang, i) => (
          <div role="row" key={i} className="grid grid-cols-3 gap-1.5">
            {hang.map((so, j) => {
              const n = bd.luoi[i]?.[j] ?? 0;
              return (
                <div role="cell" key={so} aria-label={c("bd.o", { so: String(so), n: String(n) })}
                  className={cn("grid aspect-square place-items-center rounded-xl text-center font-serif text-lg",
                    n ? "border border-gold/40 bg-gold/10 text-gold" : "border border-dashed border-line text-fg-faint")}>
                  {n ? String(so).repeat(n) : so}
                </div>
              );
            })}
          </div>
        ))}
        {bd.so_thieu.length > 0 && <p className="mt-2 text-sm text-fg-muted">{c("bd.vang", { ds: bd.so_thieu.join(", ") })}</p>}
      </div>
      <div className="space-y-3">
        {bd.mui_ten.length === 0 && <p className="text-sm text-fg-muted">{c("bd.khong_mui_ten")}</p>}
        {bd.mui_ten.map((m) => (
          <article key={`${m.ma}-${m.trong}`} className="rounded-xl border border-line/70 bg-bg/40 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="font-serif text-lg">{m.ten ?? m.ma}</h4>
              <span className="text-xs text-fg-faint">{m.ma}</span>
            </div>
            {m.y_nghia && <p className="mt-1 text-sm">{m.y_nghia}</p>}
            {m.trong
              ? m.goi_y && <p className="mt-1 text-sm text-jade">{c("bd.goi_y")} {m.goi_y}</p>
              : m.mat_toi && <p className="mt-1 text-sm text-cinnabar">{c("bd.mat_toi")} {m.mat_toi}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}

const VI_TRI_NO = new Set(["ngay_sinh", "duong_doi", "su_menh", "linh_hon", "nhan_cach"]);

export function ChiSoPhu({ mo }: { mo: MoRong }) {
  const { c } = useChuThanSo();
  const so = (n: number) => c("phu.so", { so: String(n) });
  const muc = [
    mo.so_ngay_sinh.nghia && { ten: c("phu.ngay_sinh"), tag: so(mo.so_ngay_sinh.so), noi: mo.so_ngay_sinh.nghia },
    mo.so_thai_do.nghia && { ten: c("phu.thai_do"), tag: so(mo.so_thai_do.so), noi: mo.so_thai_do.nghia },
    mo.so_truong_thanh.nghia && { ten: c("phu.truong_thanh"), tag: so(mo.so_truong_thanh.so), noi: mo.so_truong_thanh.nghia },
    ...mo.no_nghiep.map((n) => n.nghia && { ten: n.nghia.ten, tag: c("phu.o", { vt: VI_TRI_NO.has(n.vi_tri) ? c(`no.${n.vi_tri}`) : n.vi_tri }), noi: n.nghia.y_nghia, goi_y: n.nghia.goi_y }),
    mo.bai_hoc_nghiep.length > 0 && {
      ten: c("phu.bai_hoc"), tag: c("phu.so_vang", { ds: mo.bai_hoc_nghiep.map((b) => b.so).join(", ") }),
      noi: mo.bai_hoc_nghiep.map((b) => b.nghia).filter(Boolean).join(" "),
    },
  ].filter(Boolean) as { ten: string; tag: string; noi: string; goi_y?: string }[];
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {muc.map((m) => (
        <article key={m.ten + m.tag} className="rounded-xl border border-line/70 bg-bg/40 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h4 className="font-serif text-lg">{m.ten}</h4>
            <span className="shrink-0 text-xs text-gold">{m.tag}</span>
          </div>
          <p className="mt-1 text-sm">{m.noi}</p>
          {m.goi_y && <p className="mt-1 text-sm text-jade">{c("bd.goi_y")} {m.goi_y}</p>}
        </article>
      ))}
      <p className="text-xs text-fg-faint md:col-span-2">
        {c("phu.nguon", { nguon: mo.trich_nguon })}
      </p>
    </div>
  );
}
