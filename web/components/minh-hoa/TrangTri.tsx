// MH-1 — hình trang trí (không mang dữ liệu): bầu trời số ở trang chủ + hình nhỏ cho từng mảng.
// SVG nội dòng, màu theo token giao diện, không tải ảnh ngoài (hợp CSP), có <title> cho trình đọc màn hình.
import { cn } from "@/lib/utils";

const tron = (cx: number, cy: number, r: number, g: number) => [cx + r * Math.cos(g), cy + r * Math.sin(g)] as const;

// Sao rải cố định (không ngẫu nhiên → server và client vẽ giống nhau).
const SAO: [number, number, number][] = [
  [28, 40, 1.4], [70, 18, 1], [330, 26, 1.6], [380, 80, 1.1], [20, 230, 1.2], [385, 280, 1.5], [120, 370, 1],
  [280, 385, 1.3], [60, 130, 0.9], [372, 170, 0.9], [210, 10, 1.1], [14, 340, 1], [150, 60, 0.8], [300, 330, 0.8],
];

/** Trang chủ: vòng chín con số quanh mặt trăng khuyết, nối thành chòm sao — "con số nói gì về bạn".
 *  Chuyển động (chỉ CSS, tắt khi giảm chuyển động): hai vành sao xoay ngược chiều, sao chổi chạy quỹ đạo, chòm sao
 *  tự vẽ rồi có dòng sáng chạy dọc, chín số hiện lần lượt và sáng luân phiên, quầng trăng "thở", rê chuột số nổi lên. */
export function HinhBauTroi({ className }: { className?: string }) {
  const cx = 200, cy = 200, r = 128;
  const so = Array.from({ length: 9 }, (_, i) => ({ n: i + 1, p: tron(cx, cy, r, -Math.PI / 2 + (2 * Math.PI * i) / 9) }));
  const chom = [1, 4, 7, 2, 5, 8, 3, 6, 9, 1];                 // nét chòm sao nối các số
  const d = chom.map((n, i) => `${i ? "L" : "M"}${so[n - 1]!.p[0].toFixed(1)},${so[n - 1]!.p[1].toFixed(1)}`).join(" ");
  const vach = Array.from({ length: 36 }, (_, k) => tron(cx, cy, r + 46, (k * Math.PI) / 18));
  return (
    <svg viewBox="0 0 400 400" role="img" aria-label="Minh hoạ: chín con số thần số học xếp thành vòng sao quanh vầng trăng"
      className={cn("h-auto w-full overflow-visible", className)} data-testid="hinh-bau-troi">
      <title>Chín con số thần số học xếp thành vòng sao quanh vầng trăng</title>
      <defs>
        <radialGradient id="hq-trang" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--gold))" stopOpacity="0.45" />
          <stop offset="100%" stopColor="rgb(var(--gold))" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hq-tinh-van" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--moon))" stopOpacity="0.22" />
          <stop offset="60%" stopColor="rgb(var(--moon))" stopOpacity="0.06" />
          <stop offset="100%" stopColor="rgb(var(--moon))" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hq-duoi" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgb(var(--gold))" stopOpacity="0" />
          <stop offset="100%" stopColor="rgb(255 236 190)" stopOpacity="0.9" />
        </linearGradient>
        <radialGradient id="hq-so" cx="50%" cy="35%" r="70%">
          <stop offset="0%" stopColor="rgb(var(--surface-2))" />
          <stop offset="100%" stopColor="rgb(var(--bg))" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={190} fill="url(#hq-tinh-van)" />
      {SAO.map(([x, y, rr], i) => <circle key={i} cx={x} cy={y} r={rr} className="animate-twinkle fill-fg/70" style={{ animationDelay: `${i * 0.45}s` }} />)}
      {/* vành ngoài: vạch chia như mặt la bàn, xoay chậm */}
      <g className="svg-tam quay-cham" aria-hidden>
        <circle cx={cx} cy={cy} r={r + 46} className="fill-none stroke-gold/20" strokeWidth={1} />
        {vach.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={k % 9 === 0 ? 2.2 : k % 3 === 0 ? 1.3 : 0.7} className={k % 9 === 0 ? "fill-gold/80" : "fill-fg/40"} />)}
      </g>
      <g className="svg-tam quay-nguoc" aria-hidden>
        <circle cx={cx} cy={cy} r={r + 28} className="fill-none stroke-jade/20" strokeWidth={1} strokeDasharray="1 9" />
        <circle cx={cx} cy={cy} r={r + 28} className="fill-none stroke-moon/25" strokeWidth={1.4} strokeDasharray="40 120" strokeLinecap="round" />
      </g>
      <circle cx={cx} cy={cy} r={r} className="fill-none stroke-moon/25" strokeWidth={1} strokeDasharray="2 6" />
      {/* sao chổi chạy trên quỹ đạo các con số */}
      <g className="svg-tam quy-dao" aria-hidden>
        <circle cx={cx} cy={cy} r={r + 28} fill="none" stroke="none" />
        <path d={`M${cx - 70} ${cy - r - 28 + 20} Q ${cx - 30} ${cy - r - 28 + 2} ${cx} ${cy - r - 28}`} fill="none" stroke="url(#hq-duoi)" strokeWidth={2} strokeLinecap="round" />
        <circle cx={cx} cy={cy - r - 28} r={3} fill="rgb(255 236 190)" style={{ filter: "drop-shadow(0 0 6px rgb(var(--gold)))" }} />
      </g>
      <path d={d} pathLength={1} className="net-ve fill-none stroke-gold/35" strokeWidth={1} />
      <path d={d} pathLength={1} className="dong-chay fill-none stroke-gold" strokeWidth={1.6} strokeLinecap="round" style={{ filter: "drop-shadow(0 0 4px rgb(var(--gold)))" }} aria-hidden />
      <circle cx={cx} cy={cy} r={84} fill="url(#hq-trang)" className="svg-tam tho-trang" />
      {/* trăng khuyết: đĩa vàng bị một đĩa màu nền che lệch */}
      <circle cx={cx} cy={cy} r={40} className="fill-gold/90" />
      <circle cx={cx + 16} cy={cy - 11} r={35} className="fill-bg" />
      {so.map(({ n, p: [x, y] }, i) => (
        <g key={n} className="svg-tam so-hien" style={{ animationDelay: `${0.25 + i * 0.12}s` }}>
          <g className="svg-tam nut-so">
            <circle cx={x} cy={y} r={20} fill="url(#hq-so)" className="stroke-gold/60" strokeWidth={1.4} />
            {/* vành sáng luân phiên: chỉ đổi opacity (mặc định ẩn → giảm chuyển động vẫn đủ hình) */}
            <circle cx={x} cy={y} r={20} fill="none" stroke="rgb(255 236 190)" strokeWidth={1.4} opacity={0} className="so-luot"
              style={{ animationDelay: `${2 + i}s`, filter: "drop-shadow(0 0 6px rgb(var(--gold)))" }} aria-hidden />
            <text x={x} y={y + 7} textAnchor="middle" className="fill-fg font-serif" fontSize={20}>{n}</text>
          </g>
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
      <HoaTietMang kieu={kieu} />
    </svg>
  );
}

/** Nét vẽ của hình mảng (hệ toạ độ 120×80) — để lồng vào hình lớn hơn (vd hình năm mảng ở /huyen-hoc). */
export function HoaTietMang({ kieu }: { kieu: KieuMang }) {
  return <>
    {kieu === "tu-vi" && <LaSoNho />}
    {kieu === "kinh-dich" && <QueNho />}
    {kieu === "bat-tu" && <TruNho />}
    {kieu === "phong-thuy" && <BatQuaiNho />}
    {kieu === "than-so" && <SoNho />}
  </>;
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
