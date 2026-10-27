// Trang /huyen-hoc — hình đầu trang: năm mảng (thần số, Tử vi, Bát tự, Phong thuỷ, Kinh Dịch) xếp quanh Thái cực, nối
// thành ngôi sao năm cánh. Hình trang trí, không mang dữ liệu; mỗi mảng là một link tới công cụ (trông như nút → bấm được). Chỉ dùng lớp chuyển động có sẵn (globals.css) — tự tắt khi
// người dùng chọn giảm chuyển động, lúc đó hình tĩnh vẫn đủ năm mảng.
import { HoaTietMang, type KieuMang } from "@/components/minh-hoa/TrangTri";
import { cn } from "@/lib/utils";

const tron = (cx: number, cy: number, r: number, g: number) => [cx + r * Math.cos(g), cy + r * Math.sin(g)] as const;

// Cùng thứ tự với năm thẻ bên dưới (lib/huyen-hoc.ts MANG_HH), xếp theo chiều kim đồng hồ từ đỉnh.
const NUT: { kieu: KieuMang; ten: string; href: string }[] = [
  { kieu: "than-so", ten: "Thần số", href: "/than-so" },
  { kieu: "tu-vi", ten: "Tử vi", href: "/tu-vi" },
  { kieu: "bat-tu", ten: "Bát tự", href: "/bat-tu" },
  { kieu: "phong-thuy", ten: "Phong thuỷ", href: "/phong-thuy" },
  { kieu: "kinh-dich", ten: "Kinh Dịch", href: "/kinh-dich" },
];

// Sao rải cố định (server và client vẽ giống nhau).
const SAO: [number, number, number][] = [
  [30, 46, 1.3], [92, 22, 0.9], [318, 30, 1.5], [382, 96, 1], [16, 214, 1.1], [388, 250, 1.4], [70, 372, 1],
  [300, 388, 1.2], [52, 140, 0.8], [360, 168, 0.8], [206, 12, 1], [16, 330, 0.9], [150, 52, 0.7], [250, 360, 0.7],
];

export function HinhNguMang({ className }: { className?: string }) {
  const cx = 200, cy = 196, r = 138;
  const nut = NUT.map((n, i) => ({ ...n, p: tron(cx, cy, r, -Math.PI / 2 + (2 * Math.PI * i) / 5) }));
  // Ngôi sao năm cánh: nối cách một đỉnh (0 → 2 → 4 → 1 → 3 → 0).
  const sao = [0, 2, 4, 1, 3, 0].map((k, i) => `${i ? "L" : "M"}${nut[k]!.p[0].toFixed(1)},${nut[k]!.p[1].toFixed(1)}`).join(" ");
  const vach = Array.from({ length: 40 }, (_, k) => tron(cx, cy, r + 40, (k * Math.PI) / 20));
  return (
    <svg viewBox="0 0 400 400" data-testid="hinh-ngu-mang" aria-labelledby="nm-tieu-de"
      className={cn("h-auto w-full overflow-visible", className)}>
      <title id="nm-tieu-de">Năm mảng huyền học xếp quanh Thái cực: thần số, Tử vi, Bát tự, Phong thuỷ, Kinh Dịch</title>
      <defs>
        <radialGradient id="nm-tinh-van" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--moon))" stopOpacity="0.22" />
          <stop offset="60%" stopColor="rgb(var(--moon))" stopOpacity="0.06" />
          <stop offset="100%" stopColor="rgb(var(--moon))" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nm-quang" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--gold))" stopOpacity="0.4" />
          <stop offset="100%" stopColor="rgb(var(--gold))" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nm-nut" cx="50%" cy="30%" r="75%">
          <stop offset="0%" stopColor="rgb(var(--surface-2))" />
          <stop offset="100%" stopColor="rgb(var(--bg))" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={196} fill="url(#nm-tinh-van)" />
      {SAO.map(([x, y, rr], i) => <circle key={i} cx={x} cy={y} r={rr} className="animate-twinkle fill-fg/70" style={{ animationDelay: `${i * 0.4}s` }} />)}
      {/* vành la bàn xoay chậm */}
      <g className="svg-tam quay-cham" aria-hidden>
        <circle cx={cx} cy={cy} r={r + 40} className="fill-none stroke-gold/20" strokeWidth={1} />
        {vach.map(([x, y], k) => <circle key={k} cx={x} cy={y} r={k % 8 === 0 ? 2.2 : k % 2 === 0 ? 1.1 : 0.6} className={k % 8 === 0 ? "fill-gold/80" : "fill-fg/40"} />)}
      </g>
      <g className="svg-tam quay-nguoc" aria-hidden>
        <circle cx={cx} cy={cy} r={r + 22} className="fill-none stroke-jade/20" strokeWidth={1} strokeDasharray="1 9" />
        <circle cx={cx} cy={cy} r={r + 22} className="fill-none stroke-moon/25" strokeWidth={1.4} strokeDasharray="36 110" strokeLinecap="round" />
      </g>
      <circle cx={cx} cy={cy} r={r} className="fill-none stroke-moon/25" strokeWidth={1} strokeDasharray="2 6" />
      <path d={sao} pathLength={1} className="net-ve fill-none stroke-gold/30" strokeWidth={1} />
      <path d={sao} pathLength={1} className="dong-chay fill-none stroke-gold" strokeWidth={1.5} strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 4px rgb(var(--gold)))" }} aria-hidden />
      {/* Thái cực ở tâm: quầng thở + xoay rất chậm */}
      <circle cx={cx} cy={cy} r={74} fill="url(#nm-quang)" className="svg-tam tho-trang" />
      <g className="svg-tam quay-nguoc">
        <circle cx={cx} cy={cy} r={34} className="fill-bg stroke-gold/80" strokeWidth={1.4} />
        <path d={`M${cx},${cy - 34} A34,34 0 0 1 ${cx},${cy + 34} A17,17 0 0 1 ${cx},${cy} A17,17 0 0 0 ${cx},${cy - 34} Z`} className="fill-gold/90" />
        <circle cx={cx} cy={cy - 17} r={5} className="fill-gold/90" />
        <circle cx={cx} cy={cy + 17} r={5} className="fill-bg" />
      </g>
      {nut.map(({ kieu, ten, href, p: [x, y] }, i) => (
        <a key={kieu} href={href} aria-label={`Mở ${ten}`} className="group/nut outline-none">
          <g className="svg-tam so-hien" style={{ animationDelay: `${0.2 + i * 0.14}s` }}>
            <g className="svg-tam nut-so">
              <circle cx={x} cy={y} r={38} fill="url(#nm-nut)" strokeWidth={1.4}
                className="stroke-gold/60 group-hover/nut:stroke-gold group-focus-visible/nut:stroke-gold" />
              <circle cx={x} cy={y} r={44} fill="none" strokeWidth={2} className="stroke-transparent group-focus-visible/nut:stroke-gold" aria-hidden />
              <svg x={x - 27} y={y - 20} width={54} height={36} viewBox="0 0 120 80" aria-hidden><HoaTietMang kieu={kieu} /></svg>
              <text x={x} y={y + 58} textAnchor="middle" className="fill-fg font-serif" fontSize={18} aria-hidden>{ten}</text>
            </g>
          </g>
        </a>
      ))}
    </svg>
  );
}
