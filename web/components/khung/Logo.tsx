// Dấu hiệu: vòng lạc thư (9 chấm) trong vòng tròn — thần số + phương Đông.
export function Logo({ className = "size-7" }: { className?: string }) {
  const cham = [
    [12, 7], [7, 12], [17, 12], [12, 17], [12, 12],
    [8.5, 8.5], [15.5, 8.5], [8.5, 15.5], [15.5, 15.5],
  ];
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10.5" fill="none" stroke="rgb(var(--gold))" strokeWidth="1" opacity="0.8" />
      <circle cx="12" cy="12" r="7.5" fill="none" stroke="rgb(var(--gold))" strokeWidth="0.5" opacity="0.45" />
      {cham.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === 4 ? 1.5 : 0.9} fill={i === 4 ? "rgb(var(--gold))" : "rgb(var(--fg))"} />
      ))}
    </svg>
  );
}
