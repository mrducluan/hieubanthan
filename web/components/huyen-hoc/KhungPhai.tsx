"use client";
// TP-LICH — khung "Trường phái" dùng chung cho Bát tự, Phong thuỷ, Kinh Dịch (Tử vi có khung riêng TruongPhai.tsx).
// Web chỉ gửi lựa chọn; engine tính lại theo đúng lựa chọn và trả về kết quả + cờ "đổi phái có làm khác không".
import type { ReactNode } from "react";
import { Layers } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/** Mốc đầu năm tính mệnh quái (phong thuỷ): Lập xuân / Tết âm lịch Việt Nam / Tết âm lịch Trung Quốc. */
export type MocNam = "lap_xuan" | "tet_viet" | "tet_trung";

export function KhungPhai({ moTa, children, testId }: { moTa: ReactNode; children: ReactNode; testId: string }) {
  return (
    <section aria-label="Trường phái" className="rounded-2xl border border-line/70 bg-surface/40 px-4 py-3 sm:px-5" data-testid={testId}>
      <h2 className="flex items-center gap-2 text-base font-semibold">
        <Layers className="size-4 text-gold" aria-hidden /> Trường phái
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">{moTa}</p>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function DongPhai<T extends string>({ ten, giaTri, doi, luaChon, goiY, noiBat, nhan }: {
  ten: string; giaTri: T; doi: (v: T) => void; luaChon: [T, string][]; goiY: ReactNode; noiBat?: boolean; nhan: string;
}) {
  return (
    <div className="grid gap-2 border-t border-line/60 py-3 first:border-t-0 sm:grid-cols-[10rem_auto_1fr] sm:items-center sm:gap-4">
      <p className="text-sm font-medium text-fg">{ten}</p>
      <Tabs value={giaTri} onValueChange={(v) => doi(v as T)}>
        <TabsList aria-label={nhan} className="flex-wrap">
          {luaChon.map(([v, chu]) => <TabsTrigger key={v} value={v}>{chu}</TabsTrigger>)}
        </TabsList>
      </Tabs>
      <p className={cn("text-xs leading-relaxed", noiBat ? "text-moon" : "text-fg-faint")}>{goiY}</p>
    </div>
  );
}

/** Dòng chỉ để giải thích (mảng đó không phụ thuộc lựa chọn này) — nói rõ thay vì ẩn đi. */
export function DongGhiChu({ ten, children }: { ten: string; children: ReactNode }) {
  return (
    <div className="grid gap-2 border-t border-line/60 py-3 first:border-t-0 sm:grid-cols-[10rem_1fr] sm:items-center sm:gap-4">
      <p className="text-sm font-medium text-fg">{ten}</p>
      <p className="text-xs leading-relaxed text-fg-faint">{children}</p>
    </div>
  );
}
