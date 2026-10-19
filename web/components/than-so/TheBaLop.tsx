"use client";
import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import type { ViTriLuanGiai } from "@/lib/engine";
import { TEN_VI_TRI } from "@/lib/bai-doc";
import { cn } from "@/lib/utils";
import { LOP, KhoiLop, type LoaiLop } from "./LopNoiDung";

// Thẻ một con số: ba lớp Đã tính / Diễn giải / Tự soi — người dùng tự lật, không đổ cả khối chữ.
export function TheBaLop({ vt, macDinh = "giai" }: { vt: ViTriLuanGiai; macDinh?: LoaiLop }) {
  const [lop, setLop] = useState<LoaiLop>(macDinh);
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

      <div role="tablist" aria-label={`Ba lớp của ${ten}`} className="mt-4 grid grid-cols-3 gap-1 rounded-full border border-line bg-bg/40 p-1">
        {(Object.keys(LOP) as LoaiLop[]).map((k) => {
          const { ten: tenLop, Icon, mau } = LOP[k];
          const on = lop === k;
          return (
            <button key={k} role="tab" aria-selected={on} type="button" onClick={() => setLop(k)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-full py-1.5 text-xs font-semibold transition-colors",
                on ? (mau === "jade" ? "bg-jade/15 text-jade" : mau === "gold" ? "bg-gold/15 text-gold" : "bg-moon/15 text-moon") : "text-fg-faint hover:text-fg",
              )}>
              <Icon className="size-3.5" aria-hidden /> {tenLop}
            </button>
          );
        })}
      </div>

      <div className="mt-4 min-h-[7.5rem]" role="tabpanel">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={lop} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {lop === "tinh" && (
              <KhoiLop loai="tinh">
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
                      Tổng {ct.tong}{ct.rut_gon.length > 1 ? ` → rút gọn ${ct.rut_gon.slice(1).join(" → ")}` : ""} = <b className="text-jade">{ct.ket_qua}</b>
                    </p>
                  </>
                ) : (
                  <p>Số {vt.gia_tri}.</p>
                )}
                <p className="mt-2 text-xs text-fg-faint">
                  {vt.on_dinh ? "Ổn định qua mọi cách viết tên bạn đã nhập." : vt.ghi_chu_do_nhay}
                </p>
              </KhoiLop>
            )}
            {lop === "giai" && vt.nghia && (
              <KhoiLop loai="giai">
                <p>{vt.nghia.tu_khoa} — {vt.khung}.</p>
                <p className="mt-2"><span className="font-semibold text-cinnabar">Mặt tối:</span> {vt.nghia.mat_toi}.</p>
                <p className="mt-2 text-xs text-fg-faint">Nguồn: {vt.nghia.trich_nguon}</p>
                <Link href={`/than-so/y-nghia-so/so-${vt.gia_tri}`} className="mt-2 inline-block text-xs text-gold hover:underline">Đọc thêm về số {vt.gia_tri} →</Link>
              </KhoiLop>
            )}
            {lop === "soi" && vt.nghia && (
              <KhoiLop loai="soi">
                <p className="font-serif text-lg italic text-moon">“{vt.nghia.phan_chung}”</p>
                <p className="mt-2 text-xs text-fg-faint">
                  Nếu bạn không trả lời được điều gì chứng tỏ mình <em>không</em> phải số này, con số chưa nói gì về bạn.
                </p>
              </KhoiLop>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </article>
  );
}
