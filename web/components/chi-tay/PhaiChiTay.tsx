"use client";
// TK-2 — công tắc trường phái ở /chi-tay: "Sách tướng xưa (phương Đông)" (mặc định) / "Chỉ tay phương Tây". Cả hai phần đều
// dựng ở máy chủ (Google, bot AI đọc được cả hai); phần không chọn chỉ ẩn bằng `hidden`. Lựa chọn nhớ trên máy (lib/chi-tay-phai).
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { datPhaiChiTay, usePhaiChiTay, type PhaiChiTay as Phai } from "@/lib/chi-tay-phai";

const NUT: { ma: Phai; ten: string; mo_ta: string }[] = [
  { ma: "dong", ten: "Sách tướng xưa (phương Đông)", mo_ta: "Tám cung, hình vân tay khắc gỗ" },
  { ma: "tay", ten: "Chỉ tay phương Tây", mo_ta: "Dáng tay, các gò, đường chỉ" },
];

export function CongTacPhai() {
  const phai = usePhaiChiTay();
  return (
    <div className="mb-6" role="radiogroup" aria-label="Trường phái xem chỉ tay" data-testid="ct-phai">
      <div className="grid gap-2 sm:grid-cols-2">
        {NUT.map((n) => {
          const co = phai === n.ma;
          return (
            <button key={n.ma} type="button" role="radio" aria-checked={co} data-testid="ct-phai-nut" data-ma={n.ma}
              onClick={() => datPhaiChiTay(n.ma)}
              className={cn("min-h-[52px] rounded-2xl border px-4 py-2 text-left transition-colors",
                co ? "border-gold bg-gold/10 text-fg" : "border-line text-fg-muted hover:border-gold/50")}>
              <span className="block text-sm font-medium">{n.ten}</span>
              <span className="block text-xs text-fg-faint">{n.mo_ta}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Hai phần nội dung theo phái — luôn có trong HTML máy chủ, chỉ ẩn phần không chọn. */
export function TheoPhai({ dong, tay }: { dong: ReactNode; tay: ReactNode }) {
  const phai = usePhaiChiTay();
  return (
    <>
      <div hidden={phai !== "dong"} data-testid="ct-phan-dong">{dong}</div>
      <div hidden={phai !== "tay"} data-testid="ct-phan-tay">{tay}</div>
    </>
  );
}
