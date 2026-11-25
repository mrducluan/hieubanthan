// TET-2027 — Họa tiết SVG siêu nhẹ cho trang trụ /nam/2027 ("Đêm Giao Thừa Thiên Hà Thủy").
// 0 CDN ngoài, 0 JS runtime, sạch CSP-2.
import { useId } from "react";

/** Đường sóng Thiên Hà Thủy + chấm sao vàng kim ngăn cách giữa các chương lớn trên /nam/2027. */
export function DuongSongThienHa({ className = "my-8" }: { className?: string }) {
  const id = useId();
  return (
    <div className={`flex items-center justify-center ${className}`} aria-hidden="true">
      <svg viewBox="0 0 420 18" className="h-4 w-full max-w-md opacity-75" fill="none">
        <defs>
          <linearGradient id={`song-${id}`} x1="0" y1="0" x2="420" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#e9c46a" stopOpacity="0" />
            <stop offset="28%" stopColor="#6fd3b5" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#e9c46a" stopOpacity="1" />
            <stop offset="72%" stopColor="#6fd3b5" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#e9c46a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 9 Q35 2 70 9 T140 9 T210 9 T280 9 T350 9 T420 9"
          stroke={`url(#song-${id})`}
          strokeWidth="1.25"
        />
        <circle cx="210" cy="9" r="3" fill="#e9c46a" />
        <circle cx="140" cy="9" r="1.4" fill="#6fd3b5" fillOpacity="0.8" />
        <circle cx="280" cy="9" r="1.4" fill="#6fd3b5" fillOpacity="0.8" />
      </svg>
    </div>
  );
}

/** 3 micro-icon 18px cho 3 ô dữ kiện tiêu điểm (Can chi Đinh Mùi · Mệnh Thiên Hà Thủy · Tết Nguyên Đán). */
export function IconDuKienTet({ loai }: { loai: "can_chi" | "menh" | "tet" }) {
  if (loai === "can_chi") {
    return (
      <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M7 9C5 5 2 6 3 9c1 2 3 2 4 1m10-1c2-4 5-3 4 0-1 2-3 2-4 1M8 10c2-1 6-1 8 0l1 4c0 3-2 5-5 6-3-1-5-3-5-6l1-4z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (loai === "menh") {
    return (
      <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-jade" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 13c2.5-2.5 5.5-2.5 8 0s5.5 2.5 8 0M3 18c2.5-2.5 5.5-2.5 8 0s5.5 2.5 8 0" strokeLinecap="round" />
        <circle cx="12" cy="6" r="1.6" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[#fca5a5]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <ellipse cx="12" cy="12" rx="6" ry="7" />
      <path d="M9 5h6M9 19h6M12 2v3M12 19v3" strokeLinecap="round" />
    </svg>
  );
}
