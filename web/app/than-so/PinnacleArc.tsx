import type { DinhCao } from "@/lib/engine";

// Chữ ký thiết kế: dải đời đỉnh cao — chia cả cuộc đời thành 4 giai đoạn theo
// tuổi, mỗi giai đoạn mang con số + chủ đề, đánh dấu tuổi hiện tại. SVG thuần,
// không thư viện. Màu dùng CSS var qua style để tự đổi theo light/dark.

const W = 760;
const H = 168;
const PAD_X = 8;
const BAND_TOP = 26;
const BAND_H = 78;
const AXIS_Y = BAND_TOP + BAND_H + 20;

const TINTS = ["var(--jade-wash)", "var(--gold-wash)", "var(--jade-wash)", "var(--gold-wash)"];

export function PinnacleArc({ pinnacles, currentAge }: {
  pinnacles: DinhCao[];
  currentAge: number;
}) {
  const last = pinnacles.at(-1);
  if (!last) return null;

  // Trục tuổi: từ 0 tới hết đỉnh cuối + 33 năm (đỉnh cuối mở, cần một mốc kết).
  const maxAge = Math.max((last.tu_tuoi ?? 0) + 33, currentAge + 6);
  const innerW = W - PAD_X * 2;
  const x = (age: number) => PAD_X + (age / maxAge) * innerW;

  const segs = pinnacles.map((p, i) => {
    const start = p.tu_tuoi;
    const end = p.den_tuoi ?? maxAge;
    return { p, i, x0: x(start), x1: x(end), start, end };
  });

  return (
    <div className="arc">
      <svg viewBox={`0 0 ${W} ${H}`} role="img"
        aria-label="Dải đời đỉnh cao theo tuổi">
        {/* các giai đoạn */}
        {segs.map(({ p, i, x0, x1, start, end }) => {
          const w = Math.max(x1 - x0 - 3, 8);
          const cx = x0 + w / 2;
          const narrow = w < 96;
          return (
            <g key={p.dinh}>
              <rect x={x0} y={BAND_TOP} width={w} height={BAND_H} rx={3}
                style={{ fill: TINTS[i % TINTS.length] }} />
              {/* con số lớn */}
              <text x={cx} y={BAND_TOP + 40} textAnchor="middle"
                style={{
                  fill: "var(--jade-deep)", fontFamily: "var(--font-serif)",
                  fontSize: 34, fontWeight: 500,
                }}>
                {p.so}
              </text>
              {/* chủ đề (rút gọn nếu hẹp) */}
              {p.nghia && (
                <text x={cx} y={BAND_TOP + 62} textAnchor="middle"
                  style={{ fill: "var(--ink-soft)", fontFamily: "var(--font-sans)", fontSize: 11 }}>
                  {narrow ? `Đỉnh ${p.dinh}` : shorten(p.nghia.chu_de)}
                </text>
              )}
              {/* mốc tuổi bắt đầu */}
              <text x={x0} y={AXIS_Y} textAnchor="start"
                style={{ fill: "var(--ink-faint)", fontFamily: "var(--font-sans)", fontSize: 11 }}>
                {start}
              </text>
              {i === segs.length - 1 && (
                <text x={W - PAD_X} y={AXIS_Y} textAnchor="end"
                  style={{ fill: "var(--ink-faint)", fontFamily: "var(--font-sans)", fontSize: 11 }}>
                  {end}+
                </text>
              )}
            </g>
          );
        })}

        {/* đường trục mảnh */}
        <line x1={PAD_X} y1={BAND_TOP + BAND_H + 4} x2={W - PAD_X} y2={BAND_TOP + BAND_H + 4}
          style={{ stroke: "var(--line)" }} strokeWidth={1} />

        {/* đánh dấu tuổi hiện tại */}
        {currentAge <= maxAge && (
          <g>
            <line x1={x(currentAge)} y1={BAND_TOP - 8} x2={x(currentAge)} y2={BAND_TOP + BAND_H + 4}
              style={{ stroke: "var(--clay)" }} strokeWidth={1.5} />
            <circle cx={x(currentAge)} cy={BAND_TOP - 8} r={3.5} style={{ fill: "var(--clay)" }} />
            <text x={x(currentAge)} y={BAND_TOP - 14} textAnchor="middle"
              style={{ fill: "var(--clay)", fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600 }}>
              {currentAge} tuổi
            </text>
          </g>
        )}
      </svg>
      <p className="arc-caption">
        Bốn giai đoạn đời theo tuổi · dấu đỏ là tuổi hiện tại
      </p>
    </div>
  );
}

function shorten(s: string): string {
  return s.length > 22 ? s.replace(/^Giai đoạn /, "") : s;
}
