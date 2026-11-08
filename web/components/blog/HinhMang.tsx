// UI-BLOG — hình đại diện thẻ bài theo MẢNG (SVG nội dòng, không tải ảnh, hợp CSP). Dùng khi ảnh bìa đã in sẵn tiêu đề
// (bìa ban biên tập vẽ / ảnh NotFair) để thẻ không lặp tiêu đề hai lần, và khi bài chưa có ảnh. Nền giấy sáng như bìa vẽ.
import type { MangBlog } from "@/lib/blog-mang";

const MAU: Record<MangBlog, string> = {
  than_so: "#B8862B", tu_vi: "#7A5BB5", bat_tu: "#3E8A6B", kinh_dich: "#5A6472", phong_thuy: "#2F7A8C",
  hop_doi: "#B5576E", xem_ngay: "#B0702B", chung: "#3F7FE0",
};

function Hoa({ mang, c }: { mang: MangBlog; c: string }) {
  const n = { fill: "none", stroke: c, strokeWidth: 2 } as const;
  switch (mang) {
    case "than_so": {
      const d = Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2 - Math.PI / 2; return [100 + 62 * Math.cos(a), 100 + 62 * Math.sin(a)] as const; });
      return <g>{d.map(([x, y], i) => { const [x2, y2] = d[(i + 4) % 9]!; return <line key={`l${i}`} x1={x} y1={y} x2={x2} y2={y2} stroke={c} strokeOpacity={0.35} />; })}
        {d.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={11} {...n} fill="#fffaf0" />)}</g>;
    }
    case "tu_vi":
      return <g>{Array.from({ length: 12 }, (_, i) => { const p = i < 4 ? [i, 0] : i < 6 ? [3, i - 3] : i < 10 ? [9 - i, 3] : [0, 12 - i];
        return <rect key={i} x={40 + p[0]! * 31} y={40 + p[1]! * 31} width={27} height={27} rx={4} {...n} fill={i % 5 === 0 ? `${c}33` : "none"} />; })}
        <circle cx={100} cy={100} r={22} {...n} /></g>;
    case "bat_tu":
      return <g>{[0, 1, 2, 3].map((i) => <g key={i}><rect x={44 + i * 30} y={52} width={22} height={40} rx={4} {...n} fill={i === 2 ? `${c}33` : "none"} />
        <rect x={44 + i * 30} y={100} width={22} height={40} rx={4} {...n} /></g>)}<line x1={36} y1={150} x2={164} y2={150} {...n} /></g>;
    case "kinh_dich":
      return <g>{[1, 0, 1, 1, 0, 1].map((duong, i) => duong
        ? <rect key={i} x={50} y={46 + i * 20} width={100} height={9} rx={2} fill={c} />
        : <g key={i}><rect x={50} y={46 + i * 20} width={42} height={9} rx={2} fill={c} /><rect x={108} y={46 + i * 20} width={42} height={9} rx={2} fill={c} /></g>)}</g>;
    case "phong_thuy":
      return <g><circle cx={100} cy={100} r={62} {...n} /><circle cx={100} cy={100} r={40} {...n} strokeOpacity={0.5} />
        {Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2; return <line key={i} x1={100 + 40 * Math.cos(a)} y1={100 + 40 * Math.sin(a)} x2={100 + 62 * Math.cos(a)} y2={100 + 62 * Math.sin(a)} {...n} />; })}
        <path d="M100 66 L108 100 L100 134 L92 100 Z" fill={c} /></g>;
    case "hop_doi":
      return <g><circle cx={80} cy={100} r={42} {...n} /><circle cx={120} cy={100} r={42} {...n} /><path d="M100 70 A42 42 0 0 1 100 130 A42 42 0 0 1 100 70" fill={`${c}33`} /></g>;
    case "xem_ngay":
      return <g><rect x={46} y={52} width={108} height={96} rx={10} {...n} /><line x1={46} y1={76} x2={154} y2={76} {...n} />
        {Array.from({ length: 12 }, (_, i) => <circle key={i} cx={64 + (i % 4) * 24} cy={94 + Math.floor(i / 4) * 20} r={i === 6 ? 7 : 3.5} fill={c} fillOpacity={i === 6 ? 1 : 0.5} />)}</g>;
    default:
      return <g><path d="M30 100 Q100 40 170 100 Q100 160 30 100 Z" {...n} /><circle cx={100} cy={100} r={22} {...n} />
        <path d="M100 86 L104 96 L114 100 L104 104 L100 114 L96 104 L86 100 L96 96 Z" fill={c} /></g>;
  }
}

export function HinhMang({ mang, className = "" }: { mang: MangBlog; className?: string }) {
  const c = MAU[mang];
  return (
    <div className={`relative flex items-center justify-center overflow-hidden bg-[linear-gradient(135deg,#fffaf0,#f6ecd6)] ${className}`} data-hinh-mang={mang} aria-hidden>
      <svg viewBox="0 0 200 200" className="h-[78%] max-h-56 w-auto transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" aria-hidden focusable="false">
        <circle cx={100} cy={100} r={92} fill="none" stroke={c} strokeOpacity={0.18} />
        <Hoa mang={mang} c={c} />
      </svg>
    </div>
  );
}
