"use client";
// Dải chân của lá số HIỆN TRÊN MÀN HÌNH (Tử vi, Bát tự): hieuban.com + mã QR về đúng trang công cụ — người dùng chụp màn
// hình lá số (cách chia sẻ phổ biến nhất, nhất là trên điện thoại) vẫn mang link + QR về web. Nút "Tải ảnh" đã có dải chân
// riêng (lib/chan-anh.ts) và chỉ chụp phần lá số, nên dải này đặt NGOÀI vùng được chụp → không bị in hai lần.
// QR tự vẽ (lib/qr.ts), nền sáng ở cả hai giao diện để máy quét đọc được; cạnh QR = số ô × 2px để chụp màn hình vẫn quét được.
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { duongQr, maHoaQr, type MaQr } from "@/lib/qr";
import { GOC_QR, TEN_MIEN } from "@/lib/the-chia-se";
import { linkQrManHinh } from "@/lib/ma-man-hinh";

export function ChanLaSo({ giaoDien, tieuDe, duong }: { giaoDien: "dem" | "giay"; tieuDe: string; duong?: string }) {
  const hienTai = usePathname();
  const d = duong ?? hienTai ?? "/";
  const qr = useMemo<MaQr | null>(() => { try { return maHoaQr(linkQrManHinh(GOC_QR, d)); } catch { return null; } }, [d]);
  if (!qr) return null;
  const n = qr.kichThuoc + 8;
  return (
    <div className={`la-so-${giaoDien} flex items-center justify-between gap-3 border-t border-[var(--ls-vien)] px-4 py-3 sm:px-6`}
      style={{ background: "var(--ls-nen)", color: "var(--ls-chu)" }} data-testid="chan-la-so">
      <div className="min-w-0 leading-tight">
        <p className="text-sm font-semibold" style={{ color: "var(--ls-nhan)" }}>{tieuDe} · Hiểu Bản Thân</p>
        <p className="text-base font-semibold">{TEN_MIEN}</p>
        <p className="text-xs text-[var(--ls-mo)]">Quét mã để xem lá số của bạn</p>
      </div>
      <svg viewBox={`0 0 ${n} ${n}`} width={n * 2} height={n * 2} shapeRendering="crispEdges" role="img"
        aria-label={`Mã QR mở ${TEN_MIEN}${d}`} className="shrink-0 rounded-md">
        <rect width={n} height={n} fill="#f4efe2" />
        <path d={duongQr(qr, 4)} fill="#0a0a17" />
      </svg>
    </div>
  );
}
