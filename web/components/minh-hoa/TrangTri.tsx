// MH-1 — hình trang trí (không mang dữ liệu): bầu trời số ở trang chủ + hình nhỏ cho từng mảng.
// SVG nội dòng, màu theo token giao diện, không tải ảnh ngoài (hợp CSP), có <title> cho trình đọc màn hình.
import { cn } from "@/lib/utils";

const tron = (cx: number, cy: number, r: number, g: number) => [cx + r * Math.cos(g), cy + r * Math.sin(g)] as const;

// Sao rải cố định (không ngẫu nhiên → server và client vẽ giống nhau).
const SAO: [number, number, number][] = [
  [28, 40, 1.4], [70, 18, 1], [300, 26, 1.6], [352, 70, 1.1], [20, 210, 1.2], [345, 250, 1.5], [120, 300, 1],
  [250, 312, 1.3], [60, 120, 0.9], [330, 160, 0.9], [200, 12, 1.1], [12, 300, 1],
];

/** Trang chủ: vòng chín con số quanh mặt trăng khuyết, nối thành chòm sao — "con số nói gì về bạn". */
export function HinhBauTroi({ className }: { className?: string }) {
  const cx = 180, cy = 165, r = 118;
  const so = Array.from({ length: 9 }, (_, i) => ({ n: i + 1, p: tron(cx, cy, r, -Math.PI / 2 + (2 * Math.PI * i) / 9) }));
  const chom = [1, 4, 7, 2, 5, 8, 3, 6, 9, 1];                 // nét chòm sao nối các số
  const d = chom.map((n, i) => `${i ? "L" : "M"}${so[n - 1]!.p[0].toFixed(1)},${so[n - 1]!.p[1].toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 360 330" role="img" aria-label="Minh hoạ: chín con số thần số học xếp thành vòng sao quanh vầng trăng"
      className={cn("h-auto w-full", className)} data-testid="hinh-bau-troi">
      <title>Chín con số thần số học xếp thành vòng sao quanh vầng trăng</title>
      <defs>
        <radialGradient id="hq-trang" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--gold))" stopOpacity="0.35" />
          <stop offset="100%" stopColor="rgb(var(--gold))" stopOpacity="0" />
        </radialGradient>
      </defs>
      {SAO.map(([x, y, rr], i) => <circle key={i} cx={x} cy={y} r={rr} className="animate-twinkle fill-fg/70" style={{ animationDelay: `${i * 0.5}s` }} />)}
      <circle cx={cx} cy={cy} r={r + 26} className="fill-none stroke-gold/15" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={r} className="fill-none stroke-moon/25" strokeWidth={1} strokeDasharray="2 6" />
      <g className="origin-center animate-spin-slow" style={{ transformOrigin: `${cx}px ${cy}px` }}>
        <circle cx={cx} cy={cy} r={r + 40} className="fill-none stroke-jade/15" strokeWidth={1} strokeDasharray="1 10" />
      </g>
      <path d={d} pathLength={1} className="net-ve fill-none stroke-gold/35" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={70} fill="url(#hq-trang)" />
      {/* trăng khuyết: đĩa vàng bị một đĩa màu nền che lệch */}
      <circle cx={cx} cy={cy} r={34} className="fill-gold/90" />
      <circle cx={cx + 14} cy={cy - 9} r={30} className="fill-bg" />
      {so.map(({ n, p: [x, y] }) => (
        <g key={n}>
          <circle cx={x} cy={y} r={17} className="fill-bg stroke-gold/60" strokeWidth={1.2} />
          <text x={x} y={y + 6} textAnchor="middle" className="fill-fg font-serif" fontSize={17}>{n}</text>
        </g>
      ))}
    </svg>
  );
}

export type KieuMang = "than-so" | "tu-vi" | "kinh-dich" | "bat-tu" | "phong-thuy";

/** Hình nhỏ cho thẻ từng mảng (thay icon chung chung). */
export function HinhMang({ kieu, className }: { kieu: KieuMang; className?: string }) {
  return (
    <svg viewBox="0 0 120 80" aria-hidden className={cn("h-16 w-auto", className)}>
      {kieu === "tu-vi" && <LaSoNho />}
      {kieu === "kinh-dich" && <QueNho />}
      {kieu === "bat-tu" && <TruNho />}
      {kieu === "phong-thuy" && <BatQuaiNho />}
      {kieu === "than-so" && <SoNho />}
    </svg>
  );
}

function LaSoNho() {   // khung 12 cung (4×4, bỏ ô giữa) + ngôi sao ở giữa
  const o = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    if (r > 0 && r < 3 && c > 0 && c < 3) continue;
    o.push(<rect key={`${r}${c}`} x={22 + c * 19} y={2 + r * 19} width={18} height={18} rx={2}
      className={r === 0 && c === 2 ? "fill-gold/30 stroke-gold" : "fill-none stroke-gold/40"} strokeWidth={1} />);
  }
  const p = Array.from({ length: 10 }, (_, i) => tron(60, 40, i % 2 ? 6 : 14, -Math.PI / 2 + (Math.PI * i) / 5));
  return <>{o}<path d={p.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ") + "Z"} className="fill-gold" /></>;
}

function QueNho() {    // quẻ Thái (☷ trên ☰ dưới) — trời đất giao hoà
  const hao = [0, 0, 0, 1, 1, 1];
  return <>{hao.map((h, i) => h
    ? <rect key={i} x={30} y={6 + i * 12} width={60} height={7} rx={1.5} className="fill-gold" />
    : <g key={i}><rect x={30} y={6 + i * 12} width={26} height={7} rx={1.5} className="fill-gold/80" /><rect x={64} y={6 + i * 12} width={26} height={7} rx={1.5} className="fill-gold/80" /></g>)}</>;
}

function TruNho() {    // bốn trụ: can trên, chi dưới
  const mau = ["fill-jade/70", "fill-cinnabar/70", "fill-gold/70", "fill-moon/70"];
  return <>{[0, 1, 2, 3].map((i) => (
    <g key={i}>
      <rect x={16 + i * 23} y={6} width={18} height={30} rx={3} className={mau[i]} />
      <rect x={16 + i * 23} y={40} width={18} height={34} rx={3} className="fill-none stroke-gold/50" strokeWidth={1} />
    </g>))}</>;
}

function BatQuaiNho() { // bát quái + kim la bàn
  const p = Array.from({ length: 8 }, (_, i) => tron(60, 40, 34, -Math.PI / 2 + (Math.PI * i) / 4 + Math.PI / 8));
  return <>
    <path d={p.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ") + "Z"} className="fill-none stroke-gold/60" strokeWidth={1.2} />
    <circle cx={60} cy={40} r={20} className="fill-none stroke-jade/50" strokeWidth={1} />
    <path d="M60,22 L64,40 L60,58 L56,40 Z" className="fill-cinnabar/80" />
    <path d="M60,22 L64,40 L56,40 Z" className="fill-gold" />
  </>;
}

function SoNho() {
  const p = Array.from({ length: 9 }, (_, i) => tron(60, 40, 30, -Math.PI / 2 + (2 * Math.PI * i) / 9));
  return <>
    <circle cx={60} cy={40} r={30} className="fill-none stroke-gold/30" strokeWidth={1} />
    {p.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3} className="fill-gold" />)}
    <text x={60} y={48} textAnchor="middle" className="fill-fg font-serif" fontSize={22}>7</text>
  </>;
}
