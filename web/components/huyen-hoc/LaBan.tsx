// La bàn 8 hướng: tô ngọc = hướng cát, chu sa nhạt = hướng hung (theo `huong_cat` engine trả).
const HUONG = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];

function cung(i: number, r0: number, r1: number) {
  const a0 = ((i * 45 - 22.5 - 90) * Math.PI) / 180, a1 = ((i * 45 + 22.5 - 90) * Math.PI) / 180;
  const p = (r: number, a: number) => `${100 + r * Math.cos(a)} ${100 + r * Math.sin(a)}`;
  return `M ${p(r0, a0)} L ${p(r1, a0)} A ${r1} ${r1} 0 0 1 ${p(r1, a1)} L ${p(r0, a1)} A ${r0} ${r0} 0 0 0 ${p(r0, a0)} Z`;
}

export function LaBan({ quai, nhom, bang, huongCat }: { quai: string; nhom: string; bang: Record<string, string>; huongCat: string[] }) {
  return (
    <figure className="mx-auto w-full max-w-sm">
      <svg viewBox="0 0 200 200" role="img" aria-label={`La bàn 8 hướng cho mệnh ${quai}`} className="h-auto w-full">
        {HUONG.map((h, i) => {
          const cat = huongCat.includes(h);
          const a = ((i * 45 - 90) * Math.PI) / 180;
          return (
            <g key={h}>
              <path d={cung(i, 38, 96)} fill={cat ? "rgb(var(--jade) / 0.16)" : "rgb(var(--cinnabar) / 0.07)"}
                stroke="rgb(var(--line))" strokeWidth="0.6" />
              <text x={100 + 76 * Math.cos(a)} y={100 + 76 * Math.sin(a) - 3} textAnchor="middle" fontSize="7.5" fill="rgb(var(--fg))">{h}</text>
              <text x={100 + 76 * Math.cos(a)} y={100 + 76 * Math.sin(a) + 7} textAnchor="middle" fontSize="6.5"
                fill={cat ? "rgb(var(--jade))" : "rgb(var(--cinnabar))"}>{bang[h]}</text>
            </g>
          );
        })}
        <circle cx="100" cy="100" r="36" fill="rgb(var(--surface))" stroke="rgb(var(--gold) / 0.6)" />
        <text x="100" y="98" textAnchor="middle" fontSize="15" fontFamily="var(--font-display)" fill="rgb(var(--gold))">{quai}</text>
        <text x="100" y="111" textAnchor="middle" fontSize="6.5" fill="rgb(var(--fg-muted))">{nhom}</text>
      </svg>
      <figcaption className="mt-2 flex justify-center gap-4 text-xs text-fg-muted">
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-jade/40" /> Hướng cát</span>
        <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-cinnabar/30" /> Hướng hung</span>
      </figcaption>
    </figure>
  );
}
