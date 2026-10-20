"use client";
// TV-V2 — khung mở/đóng dùng chung cho các khối Tử vi nâng cao: nội dung (và lời gọi engine bên trong)
// chỉ được dựng khi người dùng bấm mở lần đầu → không bắn 4 request mỗi lần mở trang.
import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function KhoiMoLuoi({ id, Icon, tieuDe, moTa, onMoLanDau, moSan = false, children }: {
  id: string; Icon: LucideIcon; tieuDe: string; moTa: string;
  /** Gọi đúng một lần khi người dùng mở lần đầu (ghi sự kiện đo lường). */
  onMoLanDau?: () => void; moSan?: boolean; children: ReactNode;
}) {
  const [mo, setMo] = useState(moSan);
  const [daMo, setDaMo] = useState(moSan);
  return (
    <section aria-labelledby={`tieu-de-${id}`} className="rounded-2xl border border-line/70 bg-surface/40" data-testid={id}>
      <h2 id={`tieu-de-${id}`} className="text-xl">
        <button type="button" aria-expanded={mo} aria-controls={`noi-dung-${id}`}
          onClick={() => {
            if (!daMo) { setDaMo(true); onMoLanDau?.(); }
            setMo((v) => !v);
          }}
          className="flex min-h-11 w-full items-start gap-3 rounded-2xl p-4 text-left transition-colors hover:bg-surface-2/40 sm:p-5">
          <Icon className="mt-0.5 size-5 shrink-0 text-gold" aria-hidden />
          <span className="flex-1">
            <span className="block">{tieuDe}</span>
            <span className="mt-0.5 block font-sans text-sm font-normal text-fg-muted">{moTa}</span>
          </span>
          <ChevronDown className={cn("mt-1 size-4 shrink-0 text-fg-muted transition-transform", mo && "rotate-180")} aria-hidden />
        </button>
      </h2>
      {/* Đã mở một lần thì giữ nội dung (ẩn khi đóng) để không gọi lại engine. */}
      {daMo && <div id={`noi-dung-${id}`} hidden={!mo} className="border-t border-line/70 p-4 sm:p-5">{children}</div>}
    </section>
  );
}

/** Nhãn ba lớp: ĐÃ TÍNH (engine) · DIỄN GIẢI (kho tri thức) · TỰ SOI (câu hỏi cho người đọc). */
export function NhanLop({ lop }: { lop: "tinh" | "giai" | "soi" }) {
  const t = { tinh: ["Đã tính", "text-jade"], giai: ["Diễn giải", "text-gold"], soi: ["Tự soi", "text-moon"] }[lop];
  return <span className={cn("eyebrow", t[1])}>{t[0]}</span>;
}
