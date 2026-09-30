// Vòng trang trí: 3 vòng tròn + 9 cung lạc thư + 24 vạch — SVG thuần, dùng cho nghi thức và thẻ danh tính.
export function VongLacThu({ className = "", quay = false }: { className?: string; quay?: boolean }) {
  const vach = Array.from({ length: 24 }, (_, i) => i * 15);
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden>
      <g className={quay ? "origin-center animate-spin-slow" : ""} style={{ transformBox: "fill-box" }}>
        <circle cx="100" cy="100" r="96" fill="none" stroke="rgb(var(--gold) / 0.35)" strokeWidth="0.8" />
        {vach.map((g) => (
          <line key={g} x1="100" y1="6" x2="100" y2={g % 45 === 0 ? 16 : 11}
            stroke="rgb(var(--gold) / 0.5)" strokeWidth="0.8" transform={`rotate(${g} 100 100)`} />
        ))}
      </g>
      <circle cx="100" cy="100" r="74" fill="none" stroke="rgb(var(--moon) / 0.25)" strokeWidth="0.6" strokeDasharray="2 4" />
      <circle cx="100" cy="100" r="52" fill="none" stroke="rgb(var(--jade) / 0.25)" strokeWidth="0.6" />
    </svg>
  );
}
