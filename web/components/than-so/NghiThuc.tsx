"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { VongLacThu } from "./VongLacThu";
import { useChuThanSo } from "./chu-than-so";

// "Đang tính" có nghi thức — hiện ĐÚNG các bước engine làm, không giả vờ chậm quá ~1,6 s.
const BUOC = ["nghi_thuc.b1", "nghi_thuc.b2", "nghi_thuc.b3"] as const;

export function NghiThuc({ daCoKetQua, onXong }: { daCoKetQua: boolean; onXong: () => void }) {
  const giam = useReducedMotion();
  const { c } = useChuThanSo();
  const [buoc, setBuoc] = useState(0);

  useEffect(() => {
    if (giam) { if (daCoKetQua) onXong(); return; }
    if (buoc < BUOC.length) {
      const t = setTimeout(() => setBuoc((b) => b + 1), 520);
      return () => clearTimeout(t);
    }
    if (daCoKetQua) {
      const t = setTimeout(onXong, 250);
      return () => clearTimeout(t);
    }
  }, [buoc, daCoKetQua, giam, onXong]);

  return (
    <div role="status" aria-live="polite" className="mx-auto flex max-w-md flex-col items-center py-10 text-center">
      <div className="relative size-48">
        <VongLacThu className="absolute inset-0 size-full" quay />
        <motion.div
          className="absolute inset-[34%] rounded-full bg-gold/20 blur-xl"
          animate={giam ? undefined : { scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </div>
      <p className="mt-6 font-serif text-2xl">{c("nghi_thuc.tieu_de")}</p>
      <ul className="mt-5 w-full space-y-2 text-left text-sm">
        <AnimatePresence>
          {BUOC.slice(0, Math.max(buoc, 1)).map((b, i) => (
            <motion.li key={b} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 text-fg-muted">
              <span className={`grid size-5 place-items-center rounded-full ${i < buoc ? "bg-jade/20 text-jade" : "bg-surface-2"}`}>
                {i < buoc ? <Check className="size-3" aria-hidden /> : null}
              </span>
              {c(b)}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
