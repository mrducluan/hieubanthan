import type { DinhCao } from "@/lib/engine";

// Dải đời — 4 giai đoạn theo tuổi, đánh dấu tuổi hiện tại. SVG thuần; web chỉ vẽ số liệu engine trả.
const W = 760, H = 170, PAD = 8, TOP = 30, BH = 82, TRUC = TOP + BH + 22;

export function DaiDoi({ dinhCao, tuoi }: { dinhCao: DinhCao[]; tuoi: number }) {
  const cuoi = dinhCao.at(-1);
  if (!cuoi) return null;
  const maxTuoi = Math.max(cuoi.tu_tuoi + 33, tuoi + 6);
  const x = (a: number) => PAD + (a / maxTuoi) * (W - PAD * 2);
  return (
    <figure className="glass overflow-hidden rounded-2xl p-2">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Dải đời đỉnh cao theo tuổi" className="block h-auto w-full">
        <defs>
          <linearGradient id="dd-g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="rgb(var(--gold))" stopOpacity="0.22" />
            <stop offset="1" stopColor="rgb(var(--gold))" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        {dinhCao.map((p, i) => {
          const x0 = x(p.tu_tuoi), x1 = x(p.den_tuoi ?? maxTuoi);
          const w = Math.max(x1 - x0 - 4, 8), cx = x0 + w / 2, dangO = tuoi >= p.tu_tuoi && (p.den_tuoi == null || tuoi < p.den_tuoi);
          return (
            <g key={p.dinh}>
              <rect x={x0} y={TOP} width={w} height={BH} rx={10} fill="url(#dd-g)"
                stroke={dangO ? "rgb(var(--gold))" : "rgb(var(--line))"} strokeWidth={dangO ? 1.5 : 1} />
              <text x={cx} y={TOP + 44} textAnchor="middle" fontFamily="var(--font-display)" fontSize="36" fill="rgb(var(--gold))">{p.so}</text>
              <text x={cx} y={TOP + 66} textAnchor="middle" fontSize="11" fill="rgb(var(--fg-muted))">
                {w < 110 ? `Đỉnh ${p.dinh}` : (p.nghia?.chu_de ?? "").replace(/^Giai đoạn /, "").slice(0, 26)}
              </text>
              <text x={x0} y={TRUC} fontSize="11" fill="rgb(var(--fg-faint))">{p.tu_tuoi}</text>
              {i === dinhCao.length - 1 && <text x={W - PAD} y={TRUC} textAnchor="end" fontSize="11" fill="rgb(var(--fg-faint))">{p.den_tuoi ?? maxTuoi}+</text>}
            </g>
          );
        })}
        {tuoi <= maxTuoi && (
          <g>
            <line x1={x(tuoi)} x2={x(tuoi)} y1={TOP - 10} y2={TOP + BH + 4} stroke="rgb(var(--cinnabar))" strokeWidth="1.5" />
            <circle cx={x(tuoi)} cy={TOP - 10} r="4" fill="rgb(var(--cinnabar))" />
            <text x={x(tuoi)} y={TOP - 17} textAnchor="middle" fontSize="11" fontWeight="600" fill="rgb(var(--cinnabar))">{tuoi} tuổi</text>
          </g>
        )}
      </svg>
      <figcaption className="pb-1 text-center text-xs text-fg-faint">Bốn giai đoạn đời theo tuổi · khung vàng là giai đoạn hiện tại</figcaption>
    </figure>
  );
}
