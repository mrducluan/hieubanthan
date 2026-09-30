"use client";
import { motion, useReducedMotion } from "motion/react";
import { Handshake, Sparkles, Zap } from "lucide-react";
import { EASE } from "@/lib/chuyen-dong";

export interface KetQuaHopDoiT {
  engine_version: string;
  a: { duong_doi: number; tu_khoa: string | null };
  b: { duong_doi: number; tu_khoa: string | null };
  cac_cap: {
    vi_tri: string; ten_vi_tri: string; so_a: number; so_b: number; cap: string;
    nghia: { hoa: string; va: string; cung_lam: string } | null;
  }[];
  cach_doc: string;
  nguon: { nguon?: string | null; trang_thai?: string | null };
}

function Cau({ so, ten, tuKhoa, tre }: { so: number; ten: string; tuKhoa: string | null; tre: number }) {
  const giam = useReducedMotion();
  return (
    <motion.div className="flex w-28 flex-col items-center text-center sm:w-36"
      {...(giam ? {} : { initial: { opacity: 0, scale: 0.7 }, animate: { opacity: 1, scale: 1 }, transition: { delay: tre, duration: 0.7, ease: EASE } })}>
      <div className="relative grid size-24 place-items-center rounded-full border border-gold/50 bg-gold/10 shadow-glow sm:size-28">
        <span className="text-gradient-gold font-serif text-5xl">{so}</span>
      </div>
      <p className="mt-3 font-serif text-lg leading-tight">{ten}</p>
      {tuKhoa && <p className="mt-0.5 text-xs text-fg-muted">{tuKhoa}</p>}
    </motion.div>
  );
}

// Hai "vì sao" nối bằng một sợi sáng + từng cặp số: hoà / va / cùng làm. Không có điểm số hợp/khắc.
export function KetQuaHopDoi({ kq, tenA, tenB }: { kq: KetQuaHopDoiT; tenA: string; tenB: string }) {
  return (
    <div className="space-y-8" data-testid="ket-qua-hop-doi">
      <div className="flex items-center justify-center gap-2 sm:gap-6">
        <Cau so={kq.a.duong_doi} ten={tenA} tuKhoa={kq.a.tu_khoa} tre={0} />
        <div className="relative h-px w-12 bg-gradient-to-r from-gold/0 via-gold to-gold/0 sm:w-28" aria-hidden>
          <Sparkles className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 text-gold" />
        </div>
        <Cau so={kq.b.duong_doi} ten={tenB} tuKhoa={kq.b.tu_khoa} tre={0.2} />
      </div>
      <p className="mx-auto max-w-xl text-center text-sm text-fg-muted">{kq.cach_doc}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {kq.cac_cap.map((c) => (
          <article key={c.vi_tri} className="glass rounded-2xl p-5" data-testid={`cap-${c.vi_tri}`}>
            <header className="flex items-baseline justify-between gap-3">
              <h3 className="text-xl">{c.ten_vi_tri}</h3>
              <span className="font-serif text-lg text-gold">{c.so_a} × {c.so_b}</span>
            </header>
            {c.nghia ? (
              <dl className="mt-4 space-y-3 text-[0.95rem]">
                <div className="flex gap-3"><dt><Sparkles className="mt-1 size-4 text-jade" aria-label="Điểm hoà" /></dt><dd><b className="text-jade">Điểm hoà.</b> {c.nghia.hoa}</dd></div>
                <div className="flex gap-3"><dt><Zap className="mt-1 size-4 text-cinnabar" aria-label="Điểm va" /></dt><dd><b className="text-cinnabar">Điểm va.</b> {c.nghia.va}</dd></div>
                <div className="flex gap-3"><dt><Handshake className="mt-1 size-4 text-gold" aria-label="Cùng làm" /></dt><dd><b className="text-gold">Cùng làm.</b> {c.nghia.cung_lam}</dd></div>
              </dl>
            ) : <p className="mt-3 text-sm text-fg-faint">Kho tri thức chưa có nghĩa cho cặp {c.cap}.</p>}
          </article>
        ))}
      </div>
      {kq.nguon.nguon && (
        <p className="text-center text-xs text-fg-faint">
          Nguồn: {kq.nguon.nguon}{kq.nguon.trang_thai === "nhap_ai" ? " · bản nháp, đang được duyệt dần" : ""}
        </p>
      )}
    </div>
  );
}
