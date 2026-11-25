// BD-1 — biểu tượng vector của năm hành (tự vẽ, không ảnh ngoài): Hỏa ngọn lửa · Thủy giọt nước có sóng · Mộc chiếc lá ·
// Kim viên đá cắt mặt · Thổ dãy núi. Vẽ quanh gốc (0, 0) trong khung 24 × 24 rồi phóng theo `co`. Chuyển động nhẹ bằng CSS
// (`.bh-*` trong globals.css) — chỉ chạy khi người dùng không bật giảm chuyển động.
import { useId, type SVGProps } from "react";

export const MAU_HANH: Record<string, { mau: string; sang: string }> = {
  "Hỏa": { mau: "rgb(242 128 104)", sang: "rgb(255 205 140)" },
  "Thủy": { mau: "rgb(126 172 255)", sang: "rgb(200 225 255)" },
  "Mộc": { mau: "rgb(111 211 160)", sang: "rgb(200 245 210)" },
  "Kim": { mau: "rgb(214 211 230)", sang: "rgb(255 255 255)" },
  "Thổ": { mau: "rgb(233 196 106)", sang: "rgb(255 236 180)" },
};

type P = { hanh: string; co?: number; x?: number; y?: number; dong?: boolean; mo?: number } & Omit<SVGProps<SVGGElement>, "x" | "y">;

/** Một biểu tượng hành, tâm tại (x, y), cạnh ~`co` đơn vị SVG. `dong` = có chuyển động; `mo` = độ trong. */
export function HanhVector({ hanh, co = 24, x = 0, y = 0, dong = true, mo = 1, ...g }: P) {
  const m = MAU_HANH[hanh] ?? MAU_HANH["Kim"]!;
  const s = co / 24;
  const lop = dong ? "bh-dong" : "";
  const id = `bh-giot-${useId().replace(/:/g, "")}`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={mo} aria-hidden {...g}>
      {hanh === "Hỏa" && (
        <g className={`${lop} bh-lua`}>
          <path d="M0 -11C3 -6 8 -3.5 8 2.5C8 7.6 4.4 11 0 11C-4.4 11 -8 7.6 -8 2.5C-8 -1.5 -5.4 -3.6 -4.2 -6.6C-3.2 -3.6 -2 -2 0 -1.4C-1.2 -5 -1.8 -8 0 -11Z" fill={m.mau} />
          <path className="bh-lua-trong" d="M0 1.5C2.2 3.6 3.8 5.2 3.8 7.1C3.8 9.3 2 10.6 0 10.6C-2 10.6 -3.8 9.3 -3.8 7.1C-3.8 4.9 -1.4 3.8 0 1.5Z" fill={m.sang} />
        </g>
      )}
      {hanh === "Thủy" && (
        <g className={lop}>
          <path d="M0 -11C4.2 -5.4 8 -1.4 8 3.4C8 7.8 4.4 11 0 11C-4.4 11 -8 7.8 -8 3.4C-8 -1.4 -4.2 -5.4 0 -11Z" fill={m.mau} />
          <clipPath id={id}><path d="M0 -11C4.2 -5.4 8 -1.4 8 3.4C8 7.8 4.4 11 0 11C-4.4 11 -8 7.8 -8 3.4C-8 -1.4 -4.2 -5.4 0 -11Z" /></clipPath>
          <g clipPath={`url(#${id})`}>
            <path className="bh-song" d="M-20 4q2.5 -2.2 5 0t5 0t5 0t5 0t5 0t5 0t5 0t5 0" fill="none" stroke={m.sang} strokeWidth="1.6" strokeLinecap="round" />
            <path className="bh-song bh-song-2" d="M-20 7.6q2.5 -2 5 0t5 0t5 0t5 0t5 0t5 0t5 0t5 0" fill="none" stroke={m.sang} strokeWidth="1.1" strokeLinecap="round" opacity=".7" />
          </g>
          <ellipse cx="-3.2" cy="-1.5" rx="1.3" ry="2.4" fill="white" opacity=".55" transform="rotate(25 -3.2 -1.5)" />
        </g>
      )}
      {hanh === "Mộc" && (
        <g className={`${lop} bh-la`}>
          <path d="M-8.5 9.5C-9.6 -1.6 -2.6 -10 9.4 -10.4C9.8 1.4 2.2 9.6 -8.5 9.5Z" fill={m.mau} />
          <path d="M-8.5 9.5L6 -6.5M-4.2 4.8L-4.6 -1.2M-1 1.2L4.6 0.8M1.8 -2L1.6 -7" fill="none" stroke={m.sang} strokeWidth="1.1" strokeLinecap="round" opacity=".85" />
        </g>
      )}
      {hanh === "Kim" && (
        <g className={lop}>
          <path d="M-9.5 -3L-5.2 -9.5H5.2L9.5 -3L0 10.5Z" fill={m.mau} />
          <path d="M-9.5 -3H9.5M-5.2 -9.5L-2.4 -3L0 10.5M5.2 -9.5L2.4 -3L0 10.5M-2.4 -3L0 -9.5L2.4 -3" fill="none" stroke="rgb(90 88 120)" strokeWidth=".7" />
          <path className="bh-lap-lanh" d="M-2.4 -3L0 -9.5L2.4 -3L0 10.5Z" fill="white" opacity=".5" />
        </g>
      )}
      {hanh === "Thổ" && (
        <g className={lop}>
          <path d="M-11.5 9L-4.5 -3.5L-1 1.8L4 -8.5L11.5 9Z" fill={m.mau} />
          <path d="M4 -8.5L6.4 -3.6L5 -4.4L3.8 -3.1L2.5 -4.6Z" fill={m.sang} />
          <path className="bh-dat" d="M-12 10.2H12" stroke={m.sang} strokeWidth="1.2" strokeLinecap="round" opacity=".7" />
        </g>
      )}
    </g>
  );
}
