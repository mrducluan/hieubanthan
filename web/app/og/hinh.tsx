// SEO-K — hình minh hoạ theo mảng cho ảnh chia sẻ / ảnh đại diện bài (1200×630, Google Discover / ảnh tìm kiếm).
// Chỉ VẼ theo tham số công khai (mảng, hướng tốt, số, hào) — không có dữ liệu cá nhân, không tự suy ra kiến thức.
// Satori (next/og) vẽ <svg> thành ảnh nhưng không có font cho <text> trong svg → nhãn chữ đặt bằng <div> tuyệt đối.

export const MANG_HINH = ["than-so", "tu-vi", "bat-tu", "kinh-dich", "phong-thuy", "lich"] as const;
export type MangHinh = (typeof MANG_HINH)[number];

const VANG = "#e9c46a", NGOC = "#5fc4a5", CHU = "#e07a5f", MO = "rgba(236,235,247,0.55)", VIEN = "rgba(233,196,106,0.35)";
const HUONG = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
const CX = 930, CY = 315;

const p = (r: number, doGoc: number) => {
  const a = ((doGoc - 90) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)] as const;
};

function Nhan({ x, y, chu, mau = MO, co = 22 }: { x: number; y: number; chu: string; mau?: string; co?: number }) {
  return (
    <div style={{ position: "absolute", left: x - 90, top: y - co * 0.7, width: 180, display: "flex", justifyContent: "center", fontSize: co, color: mau }}>
      {chu}
    </div>
  );
}

function LaBan({ tot }: { tot: string[] }) {
  const quat = (i: number, r0: number, r1: number) => {
    const [a, b] = [i * 45 - 22.5, i * 45 + 22.5];
    const [x0, y0] = p(r0, a), [x1, y1] = p(r1, a), [x2, y2] = p(r1, b), [x3, y3] = p(r0, b);
    return `M ${x0} ${y0} L ${x1} ${y1} A ${r1} ${r1} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r0} ${r0} 0 0 0 ${x0} ${y0} Z`;
  };
  return (
    <>
      <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
        {HUONG.map((h, i) => (
          <path key={h} d={quat(i, 70, 215)} fill={tot.includes(h) ? "rgba(95,196,165,0.28)" : tot.length ? "rgba(224,122,95,0.10)" : "rgba(233,196,106,0.06)"}
            stroke={VIEN} strokeWidth="2" />
        ))}
        <circle cx={CX} cy={CY} r="235" fill="none" stroke="rgba(185,167,255,0.25)" strokeWidth="2" strokeDasharray="4 12" />
        <circle cx={CX} cy={CY} r="66" fill="#141331" stroke={VANG} strokeWidth="3" />
        {[0, 90, 180, 270].map((g) => { const [x, y] = p(56, g); return <line key={g} x1={CX} y1={CY} x2={x} y2={y} stroke={VANG} strokeWidth="3" />; })}
        <circle cx={CX} cy={CY} r="7" fill={VANG} />
      </svg>
      {HUONG.map((h, i) => { const [x, y] = p(150, i * 45); return <Nhan key={h} x={x} y={y} chu={h} mau={tot.includes(h) ? NGOC : MO} co={h.length > 4 ? 19 : 22} />; })}
    </>
  );
}

function VongCung() {
  // 12 ô cung Tử vi quanh một khung vuông (bố cục lá số truyền thống), ô Mệnh tô vàng.
  const o = 108, x0 = CX - 2 * o, y0 = CY - 2 * o;
  const vt: [number, number][] = [[3, 3], [2, 3], [1, 3], [0, 3], [0, 2], [0, 1], [0, 0], [1, 0], [2, 0], [3, 0], [3, 1], [3, 2]];
  return (
    <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
      {vt.map(([c, h], i) => (
        <rect key={i} x={x0 + c * o + 4} y={y0 + h * o + 4} width={o - 8} height={o - 8} rx="10"
          fill={i === 0 ? "rgba(233,196,106,0.30)" : "rgba(255,255,255,0.04)"} stroke={VIEN} strokeWidth="2" />
      ))}
      <rect x={x0 + o + 14} y={y0 + o + 14} width={2 * o - 28} height={2 * o - 28} rx="16" fill="none" stroke="rgba(185,167,255,0.3)" strokeWidth="2" strokeDasharray="5 9" />
      {Array.from({ length: 14 }, (_, i) => { const [x, y] = p(60 + (i % 3) * 18, i * 26); return <circle key={i} cx={x} cy={y} r={i % 4 ? 3 : 5} fill={i % 4 ? MO : VANG} />; })}
    </svg>
  );
}

function Que({ hao }: { hao: number[] }) {
  const ds = hao.length === 6 ? hao : [1, 0, 1, 1, 0, 1];
  return (
    <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
      <circle cx={CX} cy={CY} r="225" fill="none" stroke={VIEN} strokeWidth="2" />
      {ds.map((h, i) => {
        const y = CY + 150 - i * 60;                         // hào 1 ở dưới
        return h ? <rect key={i} x={CX - 150} y={y - 16} width="300" height="32" rx="6" fill={VANG} />
          : <g key={i}><rect x={CX - 150} y={y - 16} width="125" height="32" rx="6" fill={VANG} /><rect x={CX + 25} y={y - 16} width="125" height="32" rx="6" fill={VANG} /></g>;
      })}
    </svg>
  );
}

function BonTru() {
  const ten = ["Năm", "Tháng", "Ngày", "Giờ"];
  return (
    <>
      <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
        {ten.map((_, i) => (
          <g key={i}>
            <rect x={CX - 210 + i * 108} y={CY - 170} width="88" height="300" rx="14" fill={i === 2 ? "rgba(233,196,106,0.28)" : "rgba(255,255,255,0.05)"} stroke={VIEN} strokeWidth="2" />
            <circle cx={CX - 166 + i * 108} cy={CY - 90} r="22" fill="none" stroke={i === 2 ? VANG : MO} strokeWidth="3" />
            <rect x={CX - 188 + i * 108} y={CY + 10} width="44" height="44" rx="8" fill="none" stroke={i === 2 ? VANG : MO} strokeWidth="3" />
          </g>
        ))}
      </svg>
      {ten.map((t, i) => <Nhan key={t} x={CX - 166 + i * 108} y={CY + 165} chu={t} mau={i === 2 ? VANG : MO} />)}
    </>
  );
}

function VongSo({ so }: { so: string }) {
  return (
    <>
      <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
        <circle cx={CX} cy={CY} r="200" fill="none" stroke={VIEN} strokeWidth="2" />
        <circle cx={CX} cy={CY} r="235" fill="none" stroke="rgba(185,167,255,0.25)" strokeWidth="2" strokeDasharray="4 12" />
        {Array.from({ length: 9 }, (_, i) => { const [x, y] = p(200, i * 40); return <circle key={i} cx={x} cy={y} r="10" fill={VANG} />; })}
      </svg>
      {Array.from({ length: 9 }, (_, i) => { const [x, y] = p(160, i * 40); return <Nhan key={i} x={x} y={y + 4} chu={String(i + 1)} co={26} />; })}
      <div style={{ position: "absolute", left: CX - 150, top: CY - 95, width: 300, display: "flex", justifyContent: "center", fontSize: 150, color: VANG, fontFamily: "Serif", lineHeight: 1 }}>
        {so}
      </div>
    </>
  );
}

function Lich() {
  return (
    <svg width="1200" height="630" viewBox="0 0 1200 630" style={{ position: "absolute", top: 0, left: 0 }}>
      <rect x={CX - 210} y={CY - 190} width="420" height="380" rx="24" fill="rgba(255,255,255,0.04)" stroke={VIEN} strokeWidth="2" />
      <rect x={CX - 210} y={CY - 190} width="420" height="70" rx="24" fill="rgba(233,196,106,0.25)" />
      {Array.from({ length: 35 }, (_, i) => (
        <circle key={i} cx={CX - 165 + (i % 7) * 55} cy={CY - 80 + Math.floor(i / 7) * 58} r={i === 17 ? 20 : 8}
          fill={i === 17 ? VANG : [3, 10, 24, 30].includes(i) ? NGOC : [6, 20].includes(i) ? CHU : MO} />
      ))}
    </svg>
  );
}

export function HinhMang({ mang, tot, so, hao }: { mang: MangHinh; tot: string[]; so: string; hao: number[] }) {
  if (mang === "phong-thuy") return <LaBan tot={tot} />;
  if (mang === "tu-vi") return <VongCung />;
  if (mang === "kinh-dich") return <Que hao={hao} />;
  if (mang === "bat-tu") return <BonTru />;
  if (mang === "lich") return <Lich />;
  return <VongSo so={so} />;
}

export const NHAN_MANG: Record<MangHinh, string> = {
  "than-so": "Thần số học", "tu-vi": "Tử vi", "bat-tu": "Bát tự", "kinh-dich": "Kinh Dịch", "phong-thuy": "Phong thuỷ", lich: "Lịch âm · ngày tốt",
};
