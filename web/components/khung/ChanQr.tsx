"use client";
// Dải chân gọn (hieuban.com + mã QR về đúng trang) cho các khối vẽ trên màn hình ngoài lá số — sơ đồ nhà, la bàn, quẻ,
// nhịp 3 tháng, dòng 10 năm: ai chụp màn hình khối này vẫn mang link về web (cùng lý do với ChanLaSo, dùng màu của site).
// QR tự vẽ (lib/qr.ts), nền sáng để máy quét đọc được; cạnh QR = số ô × 2px để chụp màn hình vẫn quét được.
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { duongQr, maHoaQr, type MaQr } from "@/lib/qr";
import { GOC_QR, TEN_MIEN } from "@/lib/the-chia-se";
import { cn } from "@/lib/utils";

export function ChanQr({ duong, nhan = "Quét để mở trang này", className }: { duong?: string; nhan?: string; className?: string }) {
  const hienTai = usePathname();
  const d = duong ?? hienTai ?? "/";
  const qr = useMemo<MaQr | null>(() => { try { return maHoaQr(`${GOC_QR}${d}`); } catch { return null; } }, [d]);
  if (!qr) return null;
  const n = qr.kichThuoc + 8;
  return (
    <div className={cn("mt-3 flex items-center justify-between gap-3 border-t border-line/60 pt-3", className)} data-testid="chan-qr">
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-semibold text-fg">{TEN_MIEN}</p>
        <p className="text-[0.7rem] text-gold">{nhan}</p>
      </div>
      <svg viewBox={`0 0 ${n} ${n}`} width={n * 2} height={n * 2} shapeRendering="crispEdges" role="img"
        aria-label={`Mã QR mở ${TEN_MIEN}${d}`} className="shrink-0 rounded-md">
        <rect width={n} height={n} fill="#f4efe2" />
        <path d={duongQr(qr, 4)} fill="#0a0a17" />
      </svg>
    </div>
  );
}
