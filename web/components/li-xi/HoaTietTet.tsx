"use client";
// LX-2027 — Bộ chất liệu đồ hoạ Tết Đinh Mùi 2027 bằng SVG thuần (0 CDN ngoài, 0 Math.random khi SSR, sạch CSP):
// Texture giấy gấm đồng xu cổ · Cành Hoa Mai Vàng / Hoa Đào Hồng · Biểu trưng Linh Vật Đinh Mùi 2027 (Dê Vàng Thiên Hà Thuỷ) ·
// Con dấu triện son · Pháo hoa bung tia · 12 cánh hoa rơi nhẹ.
import type { CSSProperties } from "react";

/** Texture nền giấy gấm hoa văn đồng xu cổ (pattern tinh tế, không nặng DOM). */
export function TextureGamCo({ id, color }: { id: string; color: string }) {
  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.11]" aria-hidden>
      <defs>
        <pattern id={id} width="44" height="44" patternUnits="userSpaceOnUse">
          <circle cx="22" cy="22" r="16" fill="none" stroke={color} strokeWidth="0.9" />
          <rect x="17" y="17" width="10" height="10" fill="none" stroke={color} strokeWidth="0.7" transform="rotate(45 22 22)" />
          <circle cx="0" cy="0" r="16" fill="none" stroke={color} strokeWidth="0.7" />
          <circle cx="44" cy="0" r="16" fill="none" stroke={color} strokeWidth="0.7" />
          <circle cx="0" cy="44" r="16" fill="none" stroke={color} strokeWidth="0.7" />
          <circle cx="44" cy="44" r="16" fill="none" stroke={color} strokeWidth="0.7" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/** Cành hoa mai vàng hoặc hoa đào hồng phớt uốn lượn vẽ bằng vector SVG sắc nét. */
export function CanhHoaXuan({
  loai,
  className,
}: {
  loai: "mai" | "dao";
  className?: string;
}) {
  const canh = loai === "mai" ? "#fde047" : "#fda4af";
  const nhi = loai === "mai" ? "#ea580c" : "#f59e0b";
  const nhanh = loai === "mai" ? "#f5c85c" : "#fbcfe8";
  const bong = [
    { x: 34, y: 34, r: 10 },
    { x: 74, y: 26, r: 8.5 },
    { x: 56, y: 66, r: 9.5 },
    { x: 102, y: 52, r: 7.5 },
  ];
  return (
    <svg viewBox="0 0 130 110" className={className} aria-hidden>
      {/* Nhánh cây mềm */}
      <path d="M4,98 C28,74 52,58 84,42 C98,35 112,26 124,18" fill="none" stroke={nhanh} strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.65" />
      <path d="M44,64 C40,48 36,38 30,24" fill="none" stroke={nhanh} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55" />
      <path d="M72,48 C84,48 94,52 108,56" fill="none" stroke={nhanh} strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.5" />
      {/* 4 bông hoa 5 cánh */}
      {bong.map((b, idx) => (
        <g key={idx} transform={`translate(${b.x} ${b.y})`}>
          {[0, 72, 144, 216, 288].map((deg) => (
            <ellipse
              key={deg}
              cx="0"
              cy={-b.r * 0.58}
              rx={b.r * 0.36}
              ry={b.r * 0.56}
              fill={canh}
              fillOpacity="0.88"
              transform={`rotate(${deg})`}
            />
          ))}
          <circle cx="0" cy="0" r={b.r * 0.22} fill={nhi} />
        </g>
      ))}
      {/* Nụ hoa nhỏ */}
      <circle cx="116" cy="24" r="3.2" fill={canh} fillOpacity="0.8" />
      <circle cx="20" cy="78" r="2.8" fill={canh} fillOpacity="0.7" />
    </svg>
  );
}

/** Biểu trưng Linh Vật Đinh Mùi 2027 (Dê Vàng — Thiên Hà Thuỷ) phong cách khắc gỗ mạ vàng tối giản. */
export function BieuTrungDinhMui({ color, className }: { color: string; className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden>
      {/* Vòng tròn hồi văn kép */}
      <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="1.6" strokeOpacity="0.85" />
      <circle cx="60" cy="60" r="47" fill="none" stroke={color} strokeWidth="0.9" strokeDasharray="4 3" strokeOpacity="0.6" />
      {/* Sóng Thiên Hà Thuỷ phía dưới */}
      <path d="M22,82 Q35,74 48,82 T74,82 T98,82" fill="none" stroke={color} strokeWidth="1.5" strokeOpacity="0.7" />
      <path d="M28,90 Q42,83 56,90 T88,90" fill="none" stroke={color} strokeWidth="1.1" strokeOpacity="0.5" />
      {/* Hình bóng đầu Linh Vật Dê Đinh Mùi uốn sừng cân đối */}
      <path
        d="M44,44 C36,30 22,28 20,40 C19,48 27,52 33,47 C36,44 37,39 34,37"
        fill="none"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M76,44 C84,30 98,28 100,40 C101,48 93,52 87,47 C84,44 83,39 86,37"
        fill="none"
        stroke={color}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M46,45 C52,40 68,40 74,45 L79,57 C80,64 74,73 60,76 C46,73 40,64 41,57 Z"
        fill={color}
        fillOpacity="0.18"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Tai thanh mảnh & vầng hào quang đỉnh */}
      <path d="M43,51 L33,55 L41,59" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M77,51 L87,55 L79,59" fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="60" cy="24" r="3" fill={color} />
      <path d="M52,24 L42,24 M68,24 L78,24" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.75" />
    </svg>
  );
}

/** Con dấu triện son phong cách cổ điển ("ĐINH MÙI · 2027"). */
export function ConDauTrien({ className }: { className?: string }) {
  return (
    <div
      className={`inline-flex flex-col items-center justify-center rounded-md border border-[#f87171]/70 bg-[#991b1b]/90 px-2 py-1 text-[9px] font-bold leading-tight tracking-[0.16em] text-[#fef2f2] shadow-sm ${className ?? ""}`}
      aria-hidden
    >
      <span>ĐINH MÙI</span>
      <span className="text-[8px] font-medium tracking-[0.22em] text-[#fde68a]">2027</span>
    </div>
  );
}

/** Pháo hoa vàng kim & đỏ son (chế độ trang trí tĩnh hoặc bung nổ khi mở bao). */
export function PhaoHoaXuan({
  color,
  bungNo = false,
  className,
}: {
  color: string;
  bungNo?: boolean;
  className?: string;
}) {
  const goc = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  return (
    <svg viewBox="0 0 120 120" className={`${bungNo ? "lx-phao-no" : "lx-sao-nhay"} ${className ?? ""}`} aria-hidden>
      {goc.map((deg) => (
        <g key={deg} transform={`rotate(${deg} 60 60)`}>
          <line x1="60" y1="42" x2="60" y2="16" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.9" />
          <circle cx="60" cy="11" r="2.4" fill="#fef08a" />
        </g>
      ))}
      <circle cx="60" cy="60" r="5" fill={color} fillOpacity="0.85" />
    </svg>
  );
}

/** 12 cánh hoa mai / hoa đào rơi nhẹ — toạ độ cố định 100% (không Math.random → 0 hydration mismatch). */
const CANH_ROI: { left: string; size: number; dur: string; delay: string }[] = [
  { left: "6%", size: 13, dur: "6.8s", delay: "0s" },
  { left: "14%", size: 10, dur: "8.2s", delay: "-2.1s" },
  { left: "23%", size: 14, dur: "7.4s", delay: "-4.5s" },
  { left: "32%", size: 11, dur: "6.4s", delay: "-1.3s" },
  { left: "41%", size: 13, dur: "8.6s", delay: "-3.6s" },
  { left: "51%", size: 10, dur: "7.1s", delay: "-5.2s" },
  { left: "60%", size: 14, dur: "7.9s", delay: "-0.8s" },
  { left: "69%", size: 11, dur: "6.6s", delay: "-2.9s" },
  { left: "77%", size: 13, dur: "8.4s", delay: "-4.1s" },
  { left: "85%", size: 10, dur: "7.2s", delay: "-1.7s" },
  { left: "92%", size: 12, dur: "6.9s", delay: "-3.2s" },
  { left: "46%", size: 9, dur: "9.0s", delay: "-6.0s" },
];

export function CanhHoaRoi({ mau }: { mau: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl" aria-hidden data-testid="lx-hoa-roi">
      {CANH_ROI.map((c, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          width={c.size}
          height={c.size}
          className="lx-canh-roi absolute -top-4"
          style={{ left: c.left, "--lx-dur": c.dur, "--lx-delay": c.delay } as CSSProperties}
        >
          <path d="M10,2 C14,6 15,12 10,18 C5,12 6,6 10,2 Z" fill={mau} fillOpacity="0.82" />
        </svg>
      ))}
    </div>
  );
}
