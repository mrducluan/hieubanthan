import { useId } from "react";

// Dấu hiệu "Cửu Tinh Nhãn φ-Master" (Brand Kit v2.0 — Chuẩn Lưới Tỉ Lệ Vàng φ = 1.6180339887):
// - Khung mắt Vesica Piscis: W = 161.80, H = 100.00 (R = 90.45, W/H = φ)
// - Vòng 9 vạch Cửu tinh: D = 61.80 (r = 30.90 = 50 / φ, dasharray="10.00 11.5723" tách bạch ở mọi kích thước)
// - Sao bốn cánh dẫn đường: D = 38.20 (r = 19.10 = 30.90 / φ) + hạt tâm Ngọc Bích #6FD3B5
// Chuyển động (BR-2) ở globals.css (.logo-*), chỉ chạy khi người dùng không bật giảm chuyển động.
// Bộ nhận diện đầy đủ: docs/brand (BR-1 / Brand Kit v2.0).
export function Logo({ className = "h-7 w-auto" }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const v = `v${id}`;
  const l = `l${id}`;
  return (
    <svg viewBox="8 44 184 112" className={className} aria-hidden>
      <defs>
        <linearGradient id={v} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF3D1" /><stop offset=".45" stopColor="#E9C46A" /><stop offset="1" stopColor="#B8862D" />
        </linearGradient>
        <linearGradient id={l} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C4DAFF" /><stop offset=".55" stopColor="#5B95F5" /><stop offset="1" stopColor="#3F7FE0" />
        </linearGradient>
      </defs>
      <path d="M19.1 100 A90.45 90.45 0 0 1 180.9 100 A90.45 90.45 0 0 1 19.1 100 Z" pathLength={1} className="logo-mat" fill="none" stroke={`url(#${v})`} strokeWidth="6.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.2 100 L19.1 97.0 L19.1 103.0 Z M186.8 100 L180.9 97.0 L180.9 103.0 Z" fill={`url(#${v})`} />
      <g className="logo-vong">
        <circle cx="100" cy="100" r="30.9" fill="none" stroke={`url(#${l})`} strokeWidth="5.4" strokeLinecap="round" strokeDasharray="10.00 11.5723" transform="rotate(-90 100 100)" />
      </g>
      <path className="logo-sao" d="M100 80.9 C101.6 95.8 104.2 98.4 119.1 100 C104.2 101.6 101.6 104.2 100 119.1 C98.4 104.2 95.8 101.6 80.9 100 C95.8 98.4 98.4 95.8 100 80.9 Z" fill={`url(#${v})`} />
      <circle cx="100" cy="100" r="2.4" fill="#6FD3B5" />
    </svg>
  );
}
