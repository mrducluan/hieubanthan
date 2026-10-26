// CTA-2 — thẻ bù lưới cuối trang (lib/the-lap.ts): cùng khung với thẻ bên cạnh để hàng liền mạch, thêm chip "Kiến thức /
// Công cụ / Thư viện" ở chân thẻ để người đọc biết đây là lối đi tiếp chứ không phải bài cùng loại. Đo bằng data-the-lap (e2e) — bấm
// đi qua link thường, không thêm sự kiện riêng.
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HinhMang } from "@/components/minh-hoa/TrangTri";
import type { TheLap as TheLapT } from "@/lib/the-lap";

function Chip({ nhan }: { nhan: TheLapT["nhan"] }) {
  return <span className="inline-flex w-fit items-center rounded-full border border-gold/40 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gold">{nhan}</span>;
}

/** Chân thẻ: chip loại + mũi tên (đặt dưới để tiêu đề thẳng hàng với thẻ thật bên cạnh). */
function Chan({ nhan }: { nhan: TheLapT["nhan"] }) {
  return (
    <span className="mt-auto flex items-center justify-between gap-2 pt-3"><Chip nhan={nhan} />
      <ArrowRight className="size-4 shrink-0 text-gold/70 transition-transform group-hover:translate-x-1" aria-hidden /></span>
  );
}

/** kieu "anh": thẻ bài có ảnh bìa 16:9 → phần trên là hình vẽ của mảng cùng tỉ lệ. kieu "chu": thẻ chữ (Kiến thức {mảng}).
 *  "chu-nho": thẻ "Đọc tiếp" của bài blog. "lon": thẻ thư viện /kien-thuc (không bọc <li> — lưới đó là div). */
export function TheLap({ t, kieu, className = "" }: { t: TheLapT; kieu: "anh" | "chu" | "chu-nho" | "lon"; className?: string }) {
  if (kieu === "anh") {
    return (
      <li className={className} data-the-lap={t.duong}>
        <Link href={t.duong} className="glass group flex h-full flex-col overflow-hidden rounded-2xl hover:border-gold/50">
          <span className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-gold/10 via-transparent to-transparent" aria-hidden>
            <HinhMang kieu={t.hinh} className="h-20 transition-transform duration-300 group-hover:scale-105 sm:h-24" />
          </span>
          <span className="flex flex-1 flex-col p-4">
            <span className="font-serif text-lg leading-snug">{t.ten}</span>
            <span className="mt-1.5 line-clamp-2 text-sm text-fg-muted">{t.mo_ta}</span>
            <Chan nhan={t.nhan} />
          </span>
        </Link>
      </li>
    );
  }
  if (kieu === "lon") {
    return (
      <Link href={t.duong} className={`glass group flex flex-col rounded-2xl p-6 transition-colors hover:border-gold/50 ${className}`} data-the-lap={t.duong}>
        <HinhMang kieu={t.hinh} className="mb-3 transition-transform group-hover:scale-105" />
        <span className="font-serif text-xl">{t.ten}</span>
        <span className="mt-2 flex-1 text-sm text-fg-muted">{t.mo_ta}</span>
        <span className="mt-4 flex items-center justify-between gap-2"><Chip nhan={t.nhan} />
          <ArrowRight className="size-4 text-gold transition-transform group-hover:translate-x-1" aria-hidden /></span>
      </Link>
    );
  }
  if (kieu === "chu-nho") {
    return (
      <li className={className} data-the-lap={t.duong}>
        <Link href={t.duong} className="glass group flex h-full flex-col rounded-2xl p-4 text-sm hover:border-gold/50">
          <span className="font-medium text-fg">{t.ten}</span>
          <span className="mt-1 line-clamp-2 block text-fg-faint">{t.mo_ta}</span>
          <Chan nhan={t.nhan} />
        </Link>
      </li>
    );
  }
  return (
    <li className={className} data-the-lap={t.duong}>
      <Link href={t.duong} className="glass group flex h-full flex-col rounded-2xl p-4 transition-colors hover:border-gold/50">
        <span className="flex items-center justify-between gap-2 font-serif text-lg">{t.ten}
          <ArrowRight className="size-4 shrink-0 text-gold/70 transition-transform group-hover:translate-x-1" aria-hidden /></span>
        <span className="mt-1 line-clamp-2 text-sm text-fg-muted">{t.mo_ta}</span>
        <span className="mt-auto pt-3"><Chip nhan={t.nhan} /></span>
      </Link>
    </li>
  );
}
