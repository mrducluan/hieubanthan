// QLNS-3 — bộ tranh minh hoạ vector (người, bàn làm việc, văn phòng, số liệu) cho ảnh /og/quan-ly. Vẽ bằng SVG thuần để
// satori dựng ra PNG; một bộ nhân vật dùng chung nên cả bốn ảnh cùng một "thế giới". Mỗi người mặc áo màu của một hành
// (cùng bảng màu với ảnh năm hành) — hình nói đúng nội dung: một đội, năm kiểu làm việc. Không chữ trong tranh (chữ ở khung).
import type { ReactNode } from "react";

export const MAU_H = { moc: "#3f8a5a", hoa: "#c4622d", tho: "#a8801f", kim: "#7a7f93", thuy: "#3f6fb0" } as const;
const DA = ["#f0c9a8", "#d9a47c", "#b97f58"] as const;
const TOC = ["#2a1f1a", "#5a3a24", "#9a6b3a", "#1d1d24"] as const;
const GO = { sang: "#d4ae7a", dam: "#b98f5e", toi: "#8f6a3f" };
const MAN = "#2d3047";

type NguoiP = { x: number; y: number; s?: number; ao: string; da?: number; toc?: number; dai?: boolean; kinh?: boolean };
/** Nhân vật nhìn thẳng, nửa người. (x, y) = tâm đầu; s = tỉ lệ. */
export function Nguoi({ x, y, s = 1, ao, da = 0, toc = 0, dai = false, kinh = false }: NguoiP) {
  const d = DA[da % 3]!, t = TOC[toc % 4]!;
  return (
    <g transform={`translate(${x} ${y + 6 * s}) scale(${s})`}>
      {dai && <rect x={-26} y={-30} width={52} height={64} rx={24} fill={t} />}
      <path d="M-40 74 C-40 32 -22 22 0 22 C22 22 40 32 40 74 Z" fill={ao} />
      <path d="M-9 22 L0 40 L9 22 Z" fill="#fbf7ee" fillOpacity={0.92} />
      <rect x={-7} y={8} width={14} height={18} rx={5} fill={d} />
      <circle cx={0} cy={-6} r={23} fill={d} />
      <path d="M-24 -6 C-27 -35 27 -39 24 -6 C17 -21 -11 -23 -24 -6 Z" fill={t} />
      <circle cx={-8} cy={-3} r={2.2} fill="#2a1f1a" />
      <circle cx={8} cy={-3} r={2.2} fill="#2a1f1a" />
      {kinh && <g fill="none" stroke="#3a3f58" strokeWidth={1.8}><circle cx={-8} cy={-3} r={6.5} /><circle cx={8} cy={-3} r={6.5} /><line x1={-1.5} y1={-3} x2={1.5} y2={-3} /></g>}
      <path d="M-6 9 Q0 14 6 9" stroke="#8a4b3a" strokeWidth={2} fill="none" strokeLinecap="round" />
    </g>
  );
}

/** Mặt sau màn hình laptop đặt trên bàn (nhìn từ phía người ngồi đối diện). (cx, ngay) = giữa đáy tại mặt bàn. */
const Laptop = ({ cx, ngay, w = 70 }: { cx: number; ngay: number; w?: number }) => (
  <g>
    <rect x={cx - w / 2} y={ngay - w * 0.62} width={w} height={w * 0.62} rx={5} fill="#3a3f58" />
    <circle cx={cx} cy={ngay - w * 0.31} r={3.4} fill="#e9c46a" fillOpacity={0.85} />
    <rect x={cx - w / 2 - 6} y={ngay - 3} width={w + 12} height={4} rx={2} fill="#2b2f45" />
  </g>
);

const Cay = ({ x, ngay, s = 1 }: { x: number; ngay: number; s?: number }) => (
  <g transform={`translate(${x} ${ngay}) scale(${s})`}>
    <ellipse cx={0} cy={-46} rx={16} ry={26} fill="#4d8f62" /><ellipse cx={-14} cy={-34} rx={10} ry={20} fill="#3f7a54" transform="rotate(-24 -14 -34)" />
    <ellipse cx={14} cy={-34} rx={10} ry={20} fill="#5aa070" transform="rotate(24 14 -34)" />
    <path d="M-17 -18 L17 -18 L13 0 L-13 0 Z" fill="#c4622d" />
  </g>
);

const Coc = ({ x, ngay }: { x: number; ngay: number }) => (
  <g><rect x={x} y={ngay - 16} width={14} height={16} rx={3} fill="#fbf7ee" /><path d={`M${x + 14} ${ngay - 12} q6 0 6 6 q0 6 -6 6`} stroke="#fbf7ee" strokeWidth={2.4} fill="none" /></g>
);

/** Radar năm đỉnh (tâm cx,cy; bán kính r): khung, hai vòng, đa giác nhóm, năm chấm màu của năm hành. */
function Radar({ cx, cy, r, gia = [0.9, 0.55, 0.8, 0.45, 0.7] }: { cx: number; cy: number; r: number; gia?: number[] }) {
  const mau = [MAU_H.hoa, MAU_H.tho, MAU_H.kim, MAU_H.thuy, MAU_H.moc];
  const dinh = (k: number, t: number) => [cx + r * t * Math.cos(((-90 + 72 * k) * Math.PI) / 180), cy + r * t * Math.sin(((-90 + 72 * k) * Math.PI) / 180)] as const;
  const poly = (t: (k: number) => number) => [0, 1, 2, 3, 4].map((k) => dinh(k, t(k)).join(",")).join(" ");
  return (
    <g>
      <polygon points={poly(() => 1)} fill="none" stroke="#cdbd9a" strokeWidth={1.6} />
      <polygon points={poly(() => 0.55)} fill="none" stroke="#e0d3b4" strokeWidth={1.4} />
      {[0, 1, 2, 3, 4].map((k) => <line key={k} x1={cx} y1={cy} x2={dinh(k, 1)[0]} y2={dinh(k, 1)[1]} stroke="#e0d3b4" strokeWidth={1.2} />)}
      <polygon points={poly((k) => gia[k]!)} fill="#e9c46a" fillOpacity={0.4} stroke="#9a6f1c" strokeWidth={2.2} />
      {[0, 1, 2, 3, 4].map((k) => <circle key={k} cx={dinh(k, gia[k]!)[0]} cy={dinh(k, gia[k]!)[1]} r={r * 0.11} fill={mau[k]} />)}
    </g>
  );
}

/** Cột số liệu: baseline y, các cột rộng w cách nhau g, màu theo hành. */
function Cot({ x, ngay, w = 26, g = 12, cao }: { x: number; ngay: number; w?: number; g?: number; cao: number[] }) {
  const mau = [MAU_H.moc, MAU_H.hoa, MAU_H.tho, MAU_H.kim, MAU_H.thuy, MAU_H.moc];
  return <g>{cao.map((h, i) => <rect key={i} x={x + i * (w + g)} y={ngay - h} width={w} height={h} rx={4} fill={mau[i % 6]} fillOpacity={0.9} />)}
    <line x1={x - 6} y1={ngay + 2} x2={x + cao.length * (w + g)} y2={ngay + 2} stroke="#cdbd9a" strokeWidth={2} /></g>;
}

const Svg = ({ w, h, children }: { w: number; h: number; children: ReactNode }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "flex" }}>{children}</svg>
);

/** Văn phòng: cửa sổ, màn hình số liệu trên tường (radar + cột), bàn dài với năm người mặc áo năm hành, laptop, cây, cốc. 1088×330. */
export function CanhVanPhong() {
  const ngay = 236;
  const nguoi: NguoiP[] = [
    { x: 150, y: 168, ao: MAU_H.moc, da: 0, toc: 0 },
    { x: 340, y: 172, ao: MAU_H.hoa, da: 1, toc: 3, dai: true },
    { x: 540, y: 166, ao: MAU_H.tho, da: 2, toc: 1, kinh: true },
    { x: 745, y: 172, ao: MAU_H.kim, da: 0, toc: 2, dai: true },
    { x: 940, y: 168, ao: MAU_H.thuy, da: 1, toc: 0 },
  ];
  return (
    <Svg w={1088} h={330}>
      <defs>
        <linearGradient id="v-tuong" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f7f0de" /><stop offset="1" stopColor="#eadfc4" /></linearGradient>
        <linearGradient id="v-troi" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#cfe3f1" /><stop offset="1" stopColor="#eef5f8" /></linearGradient>
        <clipPath id="v-khung"><rect x={0} y={0} width={1088} height={330} rx={28} /></clipPath>
      </defs>
      <g clipPath="url(#v-khung)">
        <rect x={0} y={0} width={1088} height={330} fill="url(#v-tuong)" />
        <rect x={0} y={262} width={1088} height={68} fill="#e2d2b0" />
        {/* cửa sổ */}
        <rect x={46} y={22} width={240} height={140} rx={8} fill="#fbf7ee" stroke="#cdbd9a" strokeWidth={3} />
        <rect x={56} y={32} width={220} height={120} fill="url(#v-troi)" />
        <line x1={166} y1={32} x2={166} y2={152} stroke="#fbf7ee" strokeWidth={5} /><line x1={56} y1={92} x2={276} y2={92} stroke="#fbf7ee" strokeWidth={5} />
        <circle cx={232} cy={66} r={16} fill="#f6d77a" fillOpacity={0.8} />
        {/* màn hình số liệu trên tường */}
        <rect x={620} y={14} width={440} height={134} rx={14} fill={MAN} />
        <rect x={630} y={24} width={420} height={114} rx={8} fill="#faf6ea" />
        {Radar({ cx: 716, cy: 82, r: 44 })}
        {Cot({ x: 800, ngay: 124, cao: [46, 70, 34, 84, 58, 76] })}
        <rect x={720} y={148} width={140} height={8} rx={4} fill="#a99c80" fillOpacity={0.5} />
        {/* người ngồi sau bàn */}
        {nguoi.map((n, i) => <g key={i}>{Nguoi({ ...n, s: 1.12 })}</g>)}
        {nguoi.map((n, i) => <g key={i}>{Laptop({ cx: n.x, ngay: ngay, w: 46 })}</g>)}
        {/* bàn */}
        <rect x={16} y={ngay} width={1056} height={16} rx={6} fill={GO.sang} />
        <rect x={30} y={ngay + 16} width={1028} height={52} fill={GO.dam} />
        <rect x={44} y={ngay + 68} width={16} height={26} fill={GO.toi} /><rect x={1028} y={ngay + 68} width={16} height={26} fill={GO.toi} />
        {Cay({ x: 1038, ngay: ngay, s: 1.1 })}{Coc({ x: 252, ngay: ngay })}{Coc({ x: 644, ngay: ngay })}{Coc({ x: 846, ngay: ngay })}
        <g><rect x={428} y={ngay - 12} width={56} height={10} rx={2} fill="#fbf7ee" /><rect x={434} y={ngay - 20} width={56} height={10} rx={2} fill="#f3ead2" /></g>
      </g>
    </Svg>
  );
}

/** Ba vignette của ảnh "ba bước" (280×104): 1 nhập ngày sinh · 2 xem bản đồ · 3 nhận kế hoạch. */
export function CanhBuoc({ buoc }: { buoc: 1 | 2 | 3 }) {
  const nen = <rect x={0} y={0} width={280} height={104} rx={14} fill="#f1e8d2" />;
  if (buoc === 1) {
    return (
      <Svg w={280} h={104}>{nen}
        <rect x={20} y={14} width={104} height={84} rx={10} fill="#fffdf6" stroke="#cdbd9a" strokeWidth={2} />
        <rect x={20} y={14} width={104} height={20} rx={10} fill="#9a6f1c" /><rect x={20} y={26} width={104} height={8} fill="#9a6f1c" />
        {[0, 1, 2, 3].map((c) => [0, 1, 2].map((r) => <circle key={`${c}${r}`} cx={38 + c * 22} cy={48 + r * 16} r={4} fill={c === 2 && r === 1 ? "#c4622d" : "#d8cba8"} />))}
        <circle cx={82} cy={64} r={9} fill="none" stroke="#c4622d" strokeWidth={2.4} />
        {Nguoi({ x: 206, y: 44, s: 0.78, ao: MAU_H.hoa, da: 1, toc: 0, dai: true })}
        {Laptop({ cx: 206, ngay: 94, w: 64 })}
        <rect x={150} y={94} width={116} height={9} rx={4} fill={GO.sang} />
      </Svg>
    );
  }
  if (buoc === 2) {
    return (
      <Svg w={280} h={104}>{nen}
        <rect x={52} y={8} width={176} height={74} rx={8} fill={MAN} /><rect x={58} y={14} width={164} height={62} rx={4} fill="#faf6ea" />
        {Radar({ cx: 104, cy: 46, r: 24 })}{Cot({ x: 142, ngay: 64, w: 11, g: 6, cao: [22, 34, 16, 40, 28] })}
        <rect x={128} y={82} width={24} height={7} fill="#5b5f78" /><rect x={110} y={89} width={60} height={5} rx={2.5} fill="#5b5f78" />
        {[MAU_H.moc, MAU_H.hoa, MAU_H.tho, MAU_H.kim, MAU_H.thuy].map((m, i) => (
          <g key={i}><circle cx={74 + i * 33} cy={92} r={8} fill={m} /></g>
        ))}
      </Svg>
    );
  }
  return (
    <Svg w={280} h={104}>{nen}
      <rect x={30} y={8} width={112} height={90} rx={10} fill="#fffdf6" stroke="#cdbd9a" strokeWidth={2} />
      <rect x={66} y={3} width={40} height={12} rx={5} fill="#9a6f1c" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}><circle cx={52} cy={34 + i * 17} r={6} fill={i < 2 ? MAU_H.moc : "none"} stroke={MAU_H.moc} strokeWidth={2} />
          {i < 2 && <path d={`M${49} ${34 + i * 17} l2.4 2.6 l4.4 -5`} stroke="#fff" strokeWidth={2} fill="none" strokeLinecap="round" />}
          <rect x={66} y={31 + i * 17} width={56 - i * 8} height={6} rx={3} fill="#d8cba8" /></g>
      ))}
      {Nguoi({ x: 216, y: 40, s: 0.8, ao: MAU_H.tho, da: 0, toc: 1, kinh: true })}
      <rect x={168} y={92} width={100} height={9} rx={4} fill={GO.sang} />
      <rect x={176} y={72} width={44} height={20} rx={3} fill="#fbf7ee" /><rect x={182} y={78} width={32} height={4} rx={2} fill="#cdbd9a" />
    </Svg>
  );
}

/** Nhân vật trong vòng tròn (ảnh năm hành): d = đường kính; mau = màu hành (nền nhạt + áo). */
export function NhanVatHanh({ d, mau, kieu }: { d: number; mau: string; kieu: number }) {
  const cfg = [{ da: 0, toc: 0, dai: false }, { da: 1, toc: 3, dai: true }, { da: 2, toc: 1, dai: false }, { da: 0, toc: 2, dai: true }, { da: 1, toc: 0, dai: false }][kieu % 5]!;
  const r = d / 2, s = d / 120;
  return (
    <Svg w={d} h={d}>
      <defs><clipPath id={`nv-${kieu}`}><circle cx={r} cy={r} r={r - 2} /></clipPath></defs>
      <circle cx={r} cy={r} r={r - 1} fill={mau} fillOpacity={0.2} />
      <g clipPath={`url(#nv-${kieu})`}>{Nguoi({ x: r, y: r - 6 * s, s: s * 1.05, ao: mau, ...cfg })}</g>
      <circle cx={r} cy={r} r={r - 2} fill="none" stroke={mau} strokeWidth={4} />
    </Svg>
  );
}

/** Hai người trao đổi quanh bàn nhỏ (ảnh tình huống): hai bong bóng thoại, một bản báo cáo trên bàn. 290×330. */
export function CanhTraoDoi() {
  return (
    <Svg w={290} h={330}>
      <defs><clipPath id="td-khung"><rect x={0} y={0} width={290} height={330} rx={24} /></clipPath></defs>
      <g clipPath="url(#td-khung)">
        <rect x={0} y={0} width={290} height={330} fill="#f1e8d2" /><rect x={0} y={270} width={290} height={60} fill="#e2d2b0" />
        <path d="M24 22 h128 a14 14 0 0 1 14 14 v44 a14 14 0 0 1 -14 14 h-80 l-22 20 v-20 h-26 a14 14 0 0 1 -14 -14 v-44 a14 14 0 0 1 14 -14 z" fill="#fffdf6" stroke="#cdbd9a" strokeWidth={2} />
        {[0, 1, 2].map((i) => <circle key={i} cx={64 + i * 26} cy={58} r={6} fill="#9a6f1c" fillOpacity={0.7} />)}
        <path d="M150 104 h106 a14 14 0 0 1 14 14 v40 a14 14 0 0 1 -14 14 h-24 v20 l-22 -20 h-60 a14 14 0 0 1 -14 -14 v-40 a14 14 0 0 1 14 -14 z" fill="#fffdf6" stroke="#cdbd9a" strokeWidth={2} />
        <path d="M184 140 l12 12 l26 -28" stroke={MAU_H.moc} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {Nguoi({ x: 78, y: 200, s: 1.05, ao: MAU_H.hoa, da: 1, toc: 3, dai: true })}
        {Nguoi({ x: 214, y: 216, s: 1.05, ao: MAU_H.kim, da: 0, toc: 0, kinh: true })}
        <rect x={20} y={254} width={250} height={14} rx={6} fill={GO.sang} /><rect x={32} y={268} width={226} height={40} fill={GO.dam} />
        <rect x={108} y={236} width={78} height={18} rx={3} fill="#fbf7ee" />{Cot({ x: 118, ngay: 251, w: 8, g: 4, cao: [8, 13, 6, 14, 10, 12] })}
      </g>
    </Svg>
  );
}

/** Biểu tượng nhỏ cho từng tuần của kế hoạch (ô tròn d). */
export function BieuTuongTuan({ tuan, d }: { tuan: 1 | 2 | 3 | 4; d: number }) {
  const c = d / 2, g = "#fbf7ee";
  return (
    <Svg w={d} h={d}>
      <circle cx={c} cy={c} r={c} fill="#9a6f1c" />
      {tuan === 1 && [0, 1, 2].map((i) => <rect key={i} x={c - 13 + i * 10} y={c + 10 - [12, 22, 17][i]!} width={7} height={[12, 22, 17][i]} rx={2} fill={g} />)}
      {tuan === 2 && <g><rect x={c - 11} y={c - 14} width={22} height={28} rx={4} fill="none" stroke={g} strokeWidth={2.6} />
        <path d={`M${c - 6} ${c} l4 4 l8 -9`} stroke={g} strokeWidth={2.8} fill="none" strokeLinecap="round" strokeLinejoin="round" /></g>}
      {tuan === 3 && <g stroke={g} strokeWidth={2.6} fill="none" strokeLinecap="round"><line x1={c - 14} y1={c - 8} x2={c + 14} y2={c - 8} /><line x1={c} y1={c - 8} x2={c} y2={c + 13} />
        <line x1={c - 8} y1={c + 13} x2={c + 8} y2={c + 13} /><path d={`M${c - 14} ${c - 8} l-5 11 h10 z M${c + 14} ${c - 8} l-5 11 h10 z`} /></g>}
      {tuan === 4 && <g fill={g}><rect x={c - 15} y={c - 12} width={19} height={13} rx={5} /><rect x={c - 4} y={c - 1} width={19} height={13} rx={5} fillOpacity={0.8} /></g>}
    </Svg>
  );
}
