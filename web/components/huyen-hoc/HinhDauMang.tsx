// Hình trang trí ở cột phải đầu trang công cụ Huyền học (chỉ hiện từ màn rộng — DauMang). Dùng lại nét vẽ của từng mảng
// (HoaTietMang — cùng hình với thẻ mảng ở /huyen-hoc) đặt trong một vành la bàn. Hình tĩnh, không mang dữ liệu, không phải
// lá số của ai; vành ngoài xoay rất chậm bằng lớp CSS có sẵn (tự tắt khi người dùng chọn giảm chuyển động).
import { HoaTietMang, type KieuMang } from "@/components/minh-hoa/TrangTri";
import { cn } from "@/lib/utils";

const tron = (r: number, g: number) => [180 + r * Math.cos(g), 180 + r * Math.sin(g)] as const;
// Toạ độ làm tròn 2 chữ số: máy chủ và trình duyệt in ra cùng một chuỗi (không lệch hydrate vì sai số dấu phẩy động).
const lam = (v: number) => Math.round(v * 100) / 100;

// Sao rải cố định (không ngẫu nhiên → máy chủ và trình duyệt vẽ giống nhau).
const SAO: [number, number, number][] = [
  [22, 64, 1.3], [78, 20, 0.9], [300, 14, 1.2], [346, 92, 1], [10, 196, 0.9], [352, 236, 1.3],
  [48, 318, 1], [288, 344, 1.1], [150, 8, 0.8], [338, 300, 0.8], [18, 276, 0.7], [224, 352, 0.7],
];
const VACH = Array.from({ length: 48 }, (_, k) => tron(160, (k * Math.PI) / 24));
const TAM_HUONG = Array.from({ length: 8 }, (_, k) => [tron(126, (k * Math.PI) / 4), tron(138, (k * Math.PI) / 4)] as const);

export function HinhDauMang({ kieu, className }: { kieu: KieuMang; className?: string }) {
  return (
    <svg viewBox="0 0 360 360" aria-hidden focusable="false" data-testid="hinh-dau-mang" className={cn("h-auto w-full", className)}>
      <defs>
        <radialGradient id="dm-tinh-van" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--moon))" stopOpacity="0.2" />
          <stop offset="60%" stopColor="rgb(var(--moon))" stopOpacity="0.06" />
          <stop offset="100%" stopColor="rgb(var(--moon))" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dm-quang" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgb(var(--gold))" stopOpacity="0.2" />
          <stop offset="100%" stopColor="rgb(var(--gold))" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="dm-nen" cx="50%" cy="32%" r="75%">
          <stop offset="0%" stopColor="rgb(var(--surface-2))" />
          <stop offset="100%" stopColor="rgb(var(--bg))" />
        </radialGradient>
      </defs>
      <circle cx={180} cy={180} r={180} fill="url(#dm-tinh-van)" />
      {SAO.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} className="fill-fg/60" />)}
      {/* vành ngoài: vạch chia như mặt la bàn, xoay rất chậm */}
      <g className="svg-tam quay-cham">
        <circle cx={180} cy={180} r={160} className="fill-none stroke-gold/25" strokeWidth={1} />
        {VACH.map(([x, y], k) => (
          <circle key={k} cx={lam(x)} cy={lam(y)} r={k % 12 === 0 ? 2.6 : k % 4 === 0 ? 1.4 : 0.7} className={k % 12 === 0 ? "fill-gold/80" : "fill-fg/40"} />
        ))}
      </g>
      <g className="svg-tam quay-nguoc">
        <circle cx={180} cy={180} r={146} className="fill-none stroke-jade/25" strokeWidth={1} strokeDasharray="1 9" />
        <circle cx={180} cy={180} r={146} className="fill-none stroke-moon/30" strokeWidth={1.4} strokeDasharray="44 185" strokeLinecap="round" />
      </g>
      {/* mặt đĩa giữa + tám vạch hướng */}
      <circle cx={180} cy={180} r={150} fill="url(#dm-quang)" />
      <circle cx={180} cy={180} r={122} fill="url(#dm-nen)" className="stroke-gold/45" strokeWidth={1.2} />
      {TAM_HUONG.map(([[x1, y1], [x2, y2]], k) => (
        <line key={k} x1={lam(x1)} y1={lam(y1)} x2={lam(x2)} y2={lam(y2)} className={k % 2 ? "stroke-fg/30" : "stroke-gold/70"} strokeWidth={k % 2 ? 1 : 1.6} strokeLinecap="round" />
      ))}
      <circle cx={180} cy={180} r={110} className="fill-none stroke-moon/20" strokeWidth={1} strokeDasharray="2 6" />
      {/* nét vẽ của mảng (hệ 120×80) phóng vào giữa đĩa */}
      <svg x={69} y={106} width={222} height={148} viewBox="0 0 120 80"><HoaTietMang kieu={kieu} /></svg>
    </svg>
  );
}
