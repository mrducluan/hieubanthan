"use client";
// SX-C — "Sách xưa ghi gì": engine CHỌN các câu cổ thư ứng với đúng lá số / ngôi nhà và đã viết lời theo ba nhóm
// (A nói nguyên ý · B "nên chú ý…" · C "hàm ý theo ghi chép xưa…", đã nói giảm). Web chỉ hiển thị: gập sẵn, mở theo từng
// nhóm; lời Việt trước, chữ Hán sau. Không màu đỏ, không biểu tượng cảnh báo — nhóm C chỉ khác ở nhãn "ghi chép xưa".
import { useState } from "react";
import { ChevronDown, ScrollText } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

export interface MucSachGhi {
  ve: string; sach: string; loi: string; nhom: "A" | "B" | "C"; chu_de: string;
  han?: string; am?: string; viec?: string; ngay_nay?: string; tom_y?: boolean;
}
export interface KhoiSachGhi { nhom: { ma: string; ten: string; muc: MucSachGhi[] }[]; cau_ket: string; so_muc: number }

const NHAN: Record<MucSachGhi["nhom"], { chu: string; lop: string }> = {
  A: { chu: "Sách ghi", lop: "border-jade/30 text-jade" },
  B: { chu: "Nên chú ý", lop: "border-gold/40 text-gold" },
  C: { chu: "Ghi chép xưa", lop: "border-fg-faint/40 text-fg-muted" },
};

export function SachXuaGhi({ khoi, moDun, tieuDe, moTa }: {
  khoi?: KhoiSachGhi | null; moDun: "tuvi" | "battu" | "phongthuy" | "nhantuong"; tieuDe: string; moTa?: string;
}) {
  const [mo, setMo] = useState<string | null>(null);
  if (!khoi?.nhom?.length) return null;
  const id = `sach-ghi-${moDun}`;
  return (
    <section className="glass space-y-4 rounded-[1.25rem] p-5 sm:p-6" data-testid="sach-ghi" aria-labelledby={id}>
      <div>
        <h2 id={id} className="flex items-center gap-2 font-serif text-xl sm:text-2xl">
          <ScrollText className="size-5 text-gold" aria-hidden /> {tieuDe}
        </h2>
        <p className="mt-1 text-sm text-fg-muted">
          {moTa ?? `${khoi.so_muc} câu trong sách xưa ứng với đúng dữ kiện của bạn. Sách khen thì ghi nguyên ý; sách chê thì chuyển thành điều nên chú ý; chuyện nặng thì chỉ nêu hàm ý để giữ gìn.`}
        </p>
      </div>
      <ul className="space-y-2">
        {khoi.nhom.map((n) => {
          const dangMo = mo === n.ma;
          return (
            <li key={n.ma} className="rounded-xl border border-white/10">
              <button type="button" aria-expanded={dangMo} aria-controls={`${id}-${n.ma}`} data-testid="sach-ghi-nhom"
                className="flex min-h-[48px] w-full items-center justify-between gap-3 px-4 py-2 text-left"
                onClick={() => { setMo(dangMo ? null : n.ma); if (!dangMo) ghi("chart_interacted", { mo_dun: moDun, kind: "sach_ghi_mo", muc: n.ma }); }}>
                <span className="font-medium">{n.ten}</span>
                <span className="flex items-center gap-2 text-xs text-fg-muted">
                  {n.muc.length} câu <ChevronDown className={cn("size-4 transition-transform", dangMo && "rotate-180")} aria-hidden />
                </span>
              </button>
              {dangMo && (
                <ol id={`${id}-${n.ma}`} className="grid gap-3 border-t border-white/10 p-4 md:grid-cols-2">
                  {n.muc.map((m, i) => (
                    <li key={i} className="rounded-lg bg-white/[0.03] p-3" data-nhom={m.nhom}>
                      <p className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                        <span className={cn("rounded-full border px-2 py-0.5", NHAN[m.nhom].lop)}>{NHAN[m.nhom].chu}</span>
                        <span>{m.ve}</span>
                      </p>
                      <p className="mt-2 text-[0.95rem] leading-relaxed">{m.loi}</p>
                      {m.viec && <p className="mt-1.5 text-sm text-fg-muted"><span className="text-fg">Việc nhỏ:</span> {m.viec}</p>}
                      {m.ngay_nay && <p className="mt-1.5 text-sm text-fg-muted"><span className="text-fg">Ngày nay:</span> {m.ngay_nay}</p>}
                      {m.han ? (
                        <p className="mt-2 border-l-2 border-gold/40 pl-3 text-sm">
                          <span lang="zh-Hant" className="font-serif leading-relaxed">{m.han}</span>
                          {m.am && <span className="mt-0.5 block text-xs italic text-fg-muted">{m.am}</span>}
                          <span className="mt-0.5 block text-xs text-fg-faint">{m.sach}</span>
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-fg-faint">Tóm ý từ sách {m.sach}</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-fg-faint">{khoi.cau_ket}</p>
    </section>
  );
}
