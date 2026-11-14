"use client";
// KB-2 — cách cục quanh cung Mệnh: engine nhận diện theo điều kiện công bố, KB diễn giải (nháp AI).
// Không chấm điểm số phận; cách gặp lục sát chỉ ghi chú "giảm", không phán.
import { useState } from "react";
import { ChevronDown, MessageCircleQuestion } from "lucide-react";
import type { LaSoOutputT } from "@/app/api/tuvi/schema";
import { cn } from "@/lib/utils";
import { useChuTuVi } from "@/components/huyen-hoc/chu-tu-vi";

type CC = NonNullable<LaSoOutputT["cach_cuc"]>[number];
const MAU: Record<CC["nhom"], string> = {
  "cát": "border-gold/50 bg-gold/[0.06]", "hung": "border-cinnabar/50 bg-cinnabar/[0.06]", "trung": "border-moon/40 bg-moon/[0.05]",
};
const NHAN: Record<CC["nhom"], string> = { "cát": "text-gold", "hung": "text-cinnabar", "trung": "text-moon" };

// KB-TV3: engine trả điều kiện đã thoả trên chính lá số (chữ thuật ngữ từ KB) — web chỉ chia ba nhóm để hiện.
// Cách "cần lưu ý": "tang" là điều làm nhẹ đi, "giam" là điều làm nặng thêm — đổi nhãn để không đọc ngược nghĩa.
const NHOM_DK = ["can", "tang", "giam"] as const;   // nhãn: khoá cc.dk_<loại>, cách cần lưu ý: cc.dk_<loại>_hung

function DieuKienDat({ ds, hung }: { ds?: CC["dieu_kien_dat"]; hung?: boolean }) {
  const { c } = useChuTuVi();
  if (!ds?.length) return null;
  return (
    <div className="space-y-1.5 rounded-xl border border-fg-faint/15 p-3 text-xs" data-testid="dieu-kien-dat">
      <p className="text-fg-faint">{c("vi_sao")}</p>
      {NHOM_DK.map((loai) => {
        const nhan = c(hung && loai !== "can" ? `cc.dk_${loai}_hung` : `cc.dk_${loai}`);
        const muc = ds.filter((d) => d.loai === loai);
        if (!muc.length) return null;
        return (
          <div key={loai}>
            <p className={cn("font-semibold", loai === "giam" ? "text-cinnabar" : loai === "tang" ? "text-gold" : "text-fg-muted")}>{nhan}</p>
            <ul className="mt-0.5 list-disc space-y-0.5 pl-4 text-fg-muted">
              {muc.map((d) => <li key={d.noi_dung}>{d.noi_dung}</li>)}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

export function CachCuc({ ds, luuY, onHoi }: { ds: CC[]; luuY?: string; onHoi: (cau: string) => void }) {
  const [mo, setMo] = useState<string | null>(ds[0]?.ma ?? null);
  const { c: t, ten } = useChuTuVi();
  if (!ds.length) return null;
  return (
    <section aria-labelledby="tieu-de-cach-cuc" className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="tieu-de-cach-cuc" className="text-2xl">{t("cc.tieu_de")}</h2>
        <p className="text-xs text-fg-faint">{t("cc.dem", { so: String(ds.length) })}</p>
      </div>
      <ul className="grid items-start gap-3 md:grid-cols-2" data-testid="cach-cuc">
        {ds.map((c) => {
          const dangMo = mo === c.ma;
          return (
            <li key={c.ma} className={cn("rounded-2xl border p-4 transition-colors", MAU[c.nhom])}>
              <button type="button" aria-expanded={dangMo} onClick={() => setMo(dangMo ? null : c.ma)} className="flex w-full items-start justify-between gap-3 text-left">
                <span>
                  <span className={cn("text-xs font-semibold uppercase tracking-[0.15em]", NHAN[c.nhom])}>{c.nhom === "cát" ? t("cc.cat") : c.nhom === "hung" ? t("cc.hung") : t("cc.trung")}</span>
                  <span className="mt-0.5 block font-serif text-xl">{c.ten} <span className="text-base text-fg-faint" style={{ fontFamily: "var(--font-han), serif" }}>{c.ten_han}</span></span>
                </span>
                <ChevronDown className={cn("mt-1 size-4 shrink-0 text-fg-faint transition-transform", dangMo && "rotate-180")} aria-hidden />
              </button>
              {dangMo && (
                <div className="mt-3 space-y-2 text-sm">
                  <p className="text-fg-faint">{c.dieu_kien}</p>
                  <p>{c.y}</p>
                  {c.co_ca && (
                    <blockquote className="whitespace-pre-line border-l-2 border-gold/40 pl-3 font-serif italic text-fg-muted" data-testid="co-ca">
                      {c.co_ca}
                      <span className="mt-1 block text-xs not-italic text-fg-faint">{t("cc.co_ca_nguon")}</span>
                    </blockquote>
                  )}
                  <p><span className="text-fg-faint">{t("cc.mat_toi")}</span>{c.mat_toi}</p>
                  <p><span className="text-fg-faint">{t("cc.goi_y")}</span>{c.loi_khuyen}</p>
                  {c.sat_hoi.length > 0 && <p className="text-xs text-cinnabar">{t("cc.sat_hoi", { ds: c.sat_hoi.map((x) => ten("sao", x)).join(", ") })}</p>}
                  <DieuKienDat ds={c.dieu_kien_dat} hung={c.nhom === "hung"} />
                  <button type="button" onClick={() => onHoi(t("cc.cau_hoi", { ten: c.ten }))}
                    className="inline-flex items-center gap-1.5 text-xs text-gold hover:underline">
                    <MessageCircleQuestion className="size-3.5" aria-hidden />{t("cc.hoi")}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {luuY && <p className="text-xs text-fg-faint">{luuY}</p>}
    </section>
  );
}
