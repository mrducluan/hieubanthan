"use client";
import { useState } from "react";
import Link from "@/components/khung/Lien";
import { motion, AnimatePresence } from "motion/react";
import type { ViTriLuanGiai } from "@/lib/engine";
import { TEN_VI_TRI } from "@/lib/bai-doc";
import { cn } from "@/lib/utils";
import { Calculator, ChevronDown } from "lucide-react";
import { KhoiLop } from "./LopNoiDung";
import { KiemChung } from "./KiemChung";
import { useChuThanSo } from "./chu-than-so";
import { useDuong } from "@/components/khung/NgonNgu";

// Thẻ một con số: Diễn giải + Kiểm chứng hiện sẵn; Cách tính (vết cộng từng chữ số) thu gọn, bấm mới mở.
export function TheBaLop({ vt }: { vt: ViTriLuanGiai }) {
  const [mo, setMo] = useState(false);
  const ct = vt.cach_tinh;
  const { c, en } = useChuThanSo();
  const d = useDuong();
  const ten = en ? (TEN_VI_TRI[vt.vi_tri] ? c(`vi_tri.${vt.vi_tri}`) : vt.ten) : TEN_VI_TRI[vt.vi_tri] ?? vt.ten;
  return (
    <article className="glass rounded-2xl p-5" data-testid={`the-${vt.vi_tri}`} aria-label={c("the.aria", { ten, so: String(vt.gia_tri) })}>
      <header className="flex items-start gap-4">
        <span className="font-serif text-5xl leading-none text-gold" data-testid="gia-tri">{vt.gia_tri}</span>
        <div className="min-w-0 flex-1">
          <p className="eyebrow">{ten}</p>
          {vt.nghia && <h3 className="mt-0.5 text-xl leading-snug">{vt.nghia.tu_khoa}</h3>}
          <p className="mt-0.5 text-sm text-fg-faint">{vt.khung}</p>
        </div>
      </header>

      {vt.nghia && (
        <KhoiLop loai="giai" className="mt-4">
          {/* Hướng lớn của số (kho chân dung) thay câu lặp lại tiêu đề. */}
          {vt.kiem_chung?.huong_lon && <p>{vt.kiem_chung.huong_lon}</p>}
          <p className={vt.kiem_chung?.huong_lon ? "mt-2" : undefined}><span className="font-semibold text-cinnabar">{c("the.mat_toi")}</span> {vt.nghia.mat_toi}.</p>
          <p className="mt-2 text-xs text-fg-faint">{c("the.nguon", { nguon: vt.nghia.trich_nguon })}</p>
          <Link href={en ? d("/than-so/y-nghia-so", `/${vt.gia_tri}`) : `/than-so/y-nghia-so/so-${vt.gia_tri}`} className="mt-2 inline-block text-xs text-gold hover:underline">{c("the.doc_them", { so: String(vt.gia_tri) })}</Link>
        </KhoiLop>
      )}
      {vt.kiem_chung && <KiemChung key={`${vt.vi_tri}-${vt.gia_tri}`} kc={vt.kiem_chung} so={vt.gia_tri} viTri={vt.vi_tri} />}

      {/* Cách tính thu gọn mặc định — ai cần kiểm tra phép cộng thì bấm mở. */}
      <button type="button" onClick={() => setMo((v) => !v)} aria-expanded={mo} aria-controls={mo ? `cach-tinh-${vt.vi_tri}` : undefined}
        className="mt-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg" data-testid="mo-cach-tinh">
        <Calculator className="size-4 text-jade" aria-hidden /> {mo ? c("the.an_cach_tinh") : c("the.xem_cach_tinh")}
        <ChevronDown className={cn("size-4 transition-transform", mo && "rotate-180")} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {mo && (
          <motion.div id={`cach-tinh-${vt.vi_tri}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <KhoiLop loai="tinh" className="mt-3">
              {ct ? (
                <>
                  <ul className="flex flex-wrap gap-1" aria-label={c("the.so_hang")}>
                    {ct.so_hang.map((x, i) => (
                      <li key={i} className="flex min-w-[1.9rem] flex-col items-center rounded-md bg-surface-2 px-1.5 py-1 text-xs">
                        <span className="text-fg-faint">{x.ky_tu}</span>
                        <span className="font-semibold text-jade">{x.so}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 font-mono text-sm text-fg-muted">
                    {ct.dien_giai ?? `${c("the.tong", { tong: String(ct.tong) })}${ct.rut_gon.length > 1 ? c("the.rut_gon", { ds: ct.rut_gon.slice(1).join(" → ") }) : ""} = ${ct.ket_qua}`}
                  </p>
                </>
              ) : (
                <p>{c("the.so", { so: String(vt.gia_tri) })}</p>
              )}
              <p className="mt-2 text-xs text-fg-faint">
                {vt.on_dinh ? null : vt.ghi_chu_do_nhay}
              </p>
            </KhoiLop>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
