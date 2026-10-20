"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { ViTriLuanGiai } from "@/lib/engine";
import { TEN_VI_TRI } from "@/lib/bai-doc";
import { cn } from "@/lib/utils";
import { Calculator, ChevronDown } from "lucide-react";
import { KhoiLop } from "./LopNoiDung";
import { KiemChung } from "./KiemChung";

// Thẻ một con số: Diễn giải + Kiểm chứng hiện sẵn; Cách tính (vết cộng từng chữ số) thu gọn, bấm mới mở.
export function TheBaLop({ vt }: { vt: ViTriLuanGiai }) {
  const [mo, setMo] = useState(false);
  const ct = vt.cach_tinh;
  const ten = TEN_VI_TRI[vt.vi_tri] ?? vt.ten;
  return (
    <article className="glass rounded-2xl p-5" data-testid={`the-${vt.vi_tri}`} aria-label={`${ten}: số ${vt.gia_tri}`}>
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
          <p>{vt.nghia.tu_khoa} — {vt.khung}.</p>
          <p className="mt-2"><span className="font-semibold text-cinnabar">Mặt tối:</span> {vt.nghia.mat_toi}.</p>
          <p className="mt-2 text-xs text-fg-faint">Nguồn: {vt.nghia.trich_nguon}</p>
          <Link href={`/than-so/y-nghia-so/so-${vt.gia_tri}`} className="mt-2 inline-block text-xs text-gold hover:underline">Đọc thêm về số {vt.gia_tri} →</Link>
        </KhoiLop>
      )}
      {vt.kiem_chung && <KiemChung key={`${vt.vi_tri}-${vt.gia_tri}`} kc={vt.kiem_chung} so={vt.gia_tri} viTri={vt.vi_tri} />}

      {/* Cách tính thu gọn mặc định — ai cần kiểm tra phép cộng thì bấm mở. */}
      <button type="button" onClick={() => setMo((v) => !v)} aria-expanded={mo} aria-controls={mo ? `cach-tinh-${vt.vi_tri}` : undefined}
        className="mt-4 inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg" data-testid="mo-cach-tinh">
        <Calculator className="size-4 text-jade" aria-hidden /> {mo ? "Ẩn cách tính" : "Xem cách tính"}
        <ChevronDown className={cn("size-4 transition-transform", mo && "rotate-180")} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {mo && (
          <motion.div id={`cach-tinh-${vt.vi_tri}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
            <KhoiLop loai="tinh" className="mt-3">
              {ct ? (
                <>
                  <ul className="flex flex-wrap gap-1" aria-label="Từng số hạng">
                    {ct.so_hang.map((x, i) => (
                      <li key={i} className="flex min-w-[1.9rem] flex-col items-center rounded-md bg-surface-2 px-1.5 py-1 text-xs">
                        <span className="text-fg-faint">{x.ky_tu}</span>
                        <span className="font-semibold text-jade">{x.so}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 font-mono text-sm text-fg-muted">
                    {ct.dien_giai ?? `Tổng ${ct.tong}${ct.rut_gon.length > 1 ? ` → rút gọn ${ct.rut_gon.slice(1).join(" → ")}` : ""} = ${ct.ket_qua}`}
                  </p>
                </>
              ) : (
                <p>Số {vt.gia_tri}.</p>
              )}
              <p className="mt-2 text-xs text-fg-faint">
                {vt.on_dinh ? "Ổn định qua mọi cách viết tên bạn đã nhập." : vt.ghi_chu_do_nhay}
              </p>
            </KhoiLop>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
