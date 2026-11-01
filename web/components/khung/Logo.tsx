import { useId } from "react";

// Dấu hiệu "Cửu Tinh Nhãn": con mắt nhìn vào bên trong, vòng 9 vạch (9 con số thần số / Cửu tinh), sao bốn cánh.
// Chuyển động (BR-2) ở globals.css (.logo-*), chỉ chạy khi người dùng không bật giảm chuyển động.
// Bộ nhận diện đầy đủ: docs/brand (BR-1). Hình dạng giữ đúng file svg gốc — sửa ở đó trước.
export function Logo({ className = "h-7 w-auto" }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const v = `v${id}`;
  const l = `l${id}`;
  return (
    <svg viewBox="8 56 184 88" className={className} aria-hidden>
      <defs>
        <linearGradient id={v} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFEDBE" /><stop offset=".5" stopColor="#E9C46A" /><stop offset="1" stopColor="#B98A2E" />
        </linearGradient>
        <linearGradient id={l} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B9D3FF" /><stop offset="1" stopColor="#3F7FE0" />
        </linearGradient>
      </defs>
      <path d="M14 100 Q100 22 186 100 Q100 178 14 100 Z" pathLength={1} className="logo-mat" fill="none" stroke={`url(#${v})`} strokeWidth="7" strokeLinejoin="round" />
      <g className="logo-vong">
        <circle cx="100" cy="100" r="33" fill="none" stroke={`url(#${l})`} strokeWidth="6" strokeDasharray="18.9 4.14" transform="rotate(-90 100 100)" />
      </g>
      <path className="logo-sao" d="M100 74 C102 95 105 98 126 100 C105 102 102 105 100 126 C98 105 95 102 74 100 C95 98 98 95 100 74 Z" fill={`url(#${v})`} />
    </svg>
  );
}
