// CHANG-4 — vòng hoàng đạo 12 cung cho ảnh thẻ Chiêm tinh (`app/og/sao`, `app/og/sao2`, ImageResponse phía máy chủ).
// Chỉ vẽ: ô cung nào sáng là do mã đã ký mang theo (không tính gì). Không dùng ký hiệu cung (phông ảnh có thể thiếu glyph).
import { MAU } from "@/lib/og-chung";
import { CUNG_12 } from "@/lib/the-sao";

export interface DiemSao { cung: string; mau: string; ban_kinh: number }

const diem = (cx: number, cy: number, r: number, g: number) => [cx + r * Math.cos(g), cy + r * Math.sin(g)] as const;

/** Vòng 12 cung (Bạch Dương ở bên trái như bản đồ sao, đi ngược chiều kim đồng hồ), ô có điểm sáng tô màu của điểm. */
export function VongHoangDao({ cx, cy, r, ds }: { cx: number; cy: number; r: number; ds: DiemSao[] }) {
  const goc = (i: number) => Math.PI - (i * Math.PI) / 6;   // giữa ô thứ i (độ 15° + 30° × i), Bạch Dương bắt đầu ở 9 giờ
  const o = CUNG_12.map((c, i) => {
    const a0 = goc(i) + Math.PI / 12, a1 = goc(i) - Math.PI / 12;
    const [x0, y0] = diem(cx, cy, r, a0), [x1, y1] = diem(cx, cy, r, a1);
    const [x2, y2] = diem(cx, cy, r * 0.72, a1), [x3, y3] = diem(cx, cy, r * 0.72, a0);
    const sang = ds.find((d) => d.cung === c);
    return (
      <path key={c} d={`M${x0.toFixed(1)} ${y0.toFixed(1)} A${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} A${r * 0.72} ${r * 0.72} 0 0 0 ${x3.toFixed(1)} ${y3.toFixed(1)} Z`}
        fill={sang ? sang.mau : MAU.nen2} fillOpacity={sang ? 0.32 : 0.6} stroke={MAU.mo} strokeOpacity={0.45} strokeWidth={1.5} />
    );
  });
  const cham = ds.map((d, k) => {
    const i = CUNG_12.indexOf(d.cung as (typeof CUNG_12)[number]);
    if (i < 0) return null;
    const [x, y] = diem(cx, cy, r * 0.86, goc(i) + (k - (ds.length - 1) / 2) * 0.12);
    return <circle key={`c${k}`} cx={x.toFixed(1)} cy={y.toFixed(1)} r={d.ban_kinh} fill={d.mau} />;
  });
  return [
    <circle key="ngoai" cx={cx} cy={cy} r={r + 10} fill="none" stroke={MAU.vang} strokeOpacity={0.35} strokeWidth={1.5} />,
    ...o,
    <circle key="trong" cx={cx} cy={cy} r={r * 0.72 - 8} fill="none" stroke={MAU.mo} strokeOpacity={0.3} strokeWidth={1} />,
    ...cham,
  ];
}
