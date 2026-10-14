"use client";
// ND — nút kêu gọi đặt từ CMS: link trong site + ghi sự kiện cms_khoi_bam (mã đo do ban biên tập đặt, trang, vị trí)
// để so số bấm theo URL. Không gửi gì khác.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ghi } from "@/lib/do-luong";
import { cn } from "@/lib/utils";

export function NutMoiCms({ href, chu, chinh, maDo, duong, viTri }: {
  href: string; chu: string; chinh: boolean; maDo: string | null; duong: string; viTri: string;
}) {
  return (
    <Link href={href} onClick={() => ghi("cms_khoi_bam", { ma_do: maDo ?? "khong_ma", trang: duong, vi_tri: viTri })}
      className={cn("inline-flex min-h-11 items-center gap-2 rounded-full px-6 font-medium transition-transform hover:-translate-y-0.5",
        chinh ? "bg-gold text-bg" : "border border-line text-fg hover:border-gold/60")}>
      {chu} <ArrowRight className="size-4" aria-hidden />
    </Link>
  );
}
