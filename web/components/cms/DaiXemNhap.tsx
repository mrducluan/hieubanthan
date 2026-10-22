"use client";
// ND-6 — dải báo "đang xem bản nháp" trên mọi trang khi trình duyệt bật chế độ nháp từ nút "Xem trước" của CMS (layout chỉ
// hiện khi draft mode bật). Bài blog có dải riêng (BaiCms) → ẩn ở /blog/… để không lặp.
import { Eye } from "lucide-react";
import { usePathname } from "next/navigation";

export function DaiXemNhap() {
  const duong = usePathname() || "/";
  if (duong.startsWith("/blog/")) return null;
  return (
    <div role="status" data-testid="dai-xem-nhap"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b border-gold/50 bg-gold/15 px-4 py-2 text-center text-sm backdrop-blur">
      <span className="inline-flex items-center gap-2"><Eye className="size-4" aria-hidden /> Đang xem <b>bản nháp</b> từ CMS — người đọc chưa thấy bản này.</span>
      <a href={`/api/cms/thoat-xem-truoc?duong=${encodeURIComponent(duong)}`} className="text-gold underline">Thoát xem trước</a>
    </div>
  );
}
