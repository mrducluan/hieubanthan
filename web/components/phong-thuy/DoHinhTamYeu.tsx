"use client";
// TY-2 — Đồ hình Cửa – Chủ – Bếp kiểu sách Dương Trạch Tam Yếu, VẼ LẠI từ kết quả engine (không có bảng 64 đồ hình
// riêng: tính trùng thì dễ lệch engine — TY-1). Cửu cung 3×3, Bắc ở trên như SoDoNha; ba chỗ đặt theo phương engine trả,
// mỗi cặp một đường nối mang du niên + màu theo MỨC engine chấm (lục thuận · xám-lam cân bằng · hổ phách cần lưu ý,
// không dùng đỏ). Web không tính du niên, không chấm mức — chỉ đặt điểm vào ô và kẻ đường.
import { LUOI_9 } from "@/components/huyen-hoc/SoDoNha";
import { useChuPT } from "@/components/huyen-hoc/chu-phong-thuy";
import type { Muc } from "@/components/luan-giai/kieu";
import { cn } from "@/lib/utils";

/** Bảng tên quái ↔ phương (bảng tên, không phải phép tính). */
const PHUONG_CUA_QUAI: Record<string, string> = {
  "Khảm": "Bắc", "Cấn": "Đông Bắc", "Chấn": "Đông", "Tốn": "Đông Nam",
  "Ly": "Nam", "Khôn": "Tây Nam", "Đoài": "Tây", "Càn": "Tây Bắc",
};
export interface CapDoHinh { cap: string; tu: string; den: string; du_nien: string; muc: Muc }
type Cho = "cua" | "chu" | "bep";

const O = 100;                                   // cạnh một ô trong viewBox 300×300
function tam(phuong: string): [number, number] {
  const i = LUOI_9.indexOf(phuong as (typeof LUOI_9)[number]);
  return [(i % 3) * O + O / 2, Math.floor(i / 3) * O + O / 2];
}

export function DoHinhTamYeu({ huong, cap, className }: {
  /** Phương của ba chỗ (engine trả `huong`). */
  huong: Partial<Record<Cho, string | null>>;
  cap: CapDoHinh[];
  className?: string;
}) {
  const { c, huong: tenHuong, quai: tenQuai, duNien } = useChuPT();
  const cho = (["cua", "chu", "bep"] as Cho[]).filter((k) => huong[k]);
  // Mỗi ô có thể có nhiều chỗ (vd cửa và phòng chính cùng phía) — xếp chồng nhãn trong ô.
  const theoO = new Map<string, Cho[]>();
  for (const k of cho) { const l = theoO.get(huong[k]!) ?? []; l.push(k); theoO.set(huong[k]!, l); }
  const moTa = cap.map((p) => `${tenHuong(PHUONG_CUA_QUAI[p.tu])} – ${tenHuong(PHUONG_CUA_QUAI[p.den])}: ${duNien(p.du_nien)}`).join("; ");
  return (
    <figure className={cn("w-full max-w-xs", className)} data-testid="tam-yeu-do-hinh">
      <figcaption className="mb-1.5 text-sm font-medium text-fg">{c("ty.do_hinh")}</figcaption>
      <svg viewBox="-6 -6 312 312" className="w-full" role="img" aria-label={c("ty.do_hinh_aria", { mo_ta: moTa })}>
        {LUOI_9.map((o, i) => {
          const x = (i % 3) * O, y = Math.floor(i / 3) * O;
          const giua = o === "Trung cung";
          const co = theoO.has(o);
          return (
            <g key={o}>
              <rect x={x + 2} y={y + 2} width={O - 4} height={O - 4} rx={10}
                className={cn(co ? "fill-gold/10 stroke-gold/60" : giua ? "fill-surface-2/30 stroke-line/50" : "fill-bg/30 stroke-line/60")} strokeWidth={1} />
              <text x={x + 9} y={y + 17} className="fill-fg-faint" fontSize={10} letterSpacing={0.5}>
                {giua ? c("ty.tam").toUpperCase() : `${tenHuong(o).toUpperCase()}`}
              </text>
              {!giua && <text x={x + 9} y={y + 30} className="fill-fg-faint" fontSize={9}>{tenQuai(Object.keys(PHUONG_CUA_QUAI).find((q) => PHUONG_CUA_QUAI[q] === o))}</text>}
            </g>
          );
        })}
        {cap.map((p) => {
          const a = PHUONG_CUA_QUAI[p.tu], b = PHUONG_CUA_QUAI[p.den];
          if (!a || !b || a === b) return null;
          const [x1, y1] = tam(a), [x2, y2] = tam(b);
          const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
          const nhan = duNien(p.du_nien, true);
          const w = Math.max(44, nhan.length * 6.4 + 12);
          return (
            <g key={p.cap} className="chip-muc" data-muc={p.muc} data-testid={`tam-yeu-do-hinh-${p.cap}`}>
              <line x1={x1} y1={y1 + 14} x2={x2} y2={y2 + 14} stroke="currentColor" strokeWidth={2.2}
                strokeDasharray={p.muc === "can_chu_dong" ? "6 4" : undefined} strokeLinecap="round" />
              <rect x={mx - w / 2} y={my + 14 - 9} width={w} height={18} rx={9} className="fill-bg" stroke="currentColor" strokeWidth={1} />
              <text x={mx} y={my + 14 + 4} textAnchor="middle" fontSize={10.5} fill="currentColor" fontWeight={600}>{nhan}</text>
            </g>
          );
        })}
        {[...theoO.entries()].map(([o, ks]) => {
          const [x, y] = tam(o);
          return ks.map((k, j) => (
            <g key={k}>
              <rect x={x - 32} y={y + 2 + j * 22} width={64} height={20} rx={10} className="fill-gold/90" />
              <text x={x} y={y + 16 + j * 22} textAnchor="middle" fontSize={11} fontWeight={700} className="fill-bg">{c(`ty.${k}`)}</text>
            </g>
          ));
        })}
      </svg>
      <p className="mt-1 text-[11px] leading-relaxed text-fg-faint">{c("ty.do_hinh_ghi")}</p>
    </figure>
  );
}
