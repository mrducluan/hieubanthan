// TR-1 — hình một lá bài Tarot vẽ bằng SVG (không ảnh ngoài, hợp CSP; dùng được ở máy chủ cho trang kiến thức / ảnh chia sẻ).
// Mặt trước: khung viền "lá vàng", số (La Mã cho ẩn chính), hình biểu tượng riêng từng lá ẩn chính, bộ ẩn phụ xếp đúng số
// ký hiệu của bộ, lá hoàng gia có vương miện / mũ theo cấp; tên Việt ở chân. Mặt sau: nền đêm sao + vòng chín vạch (nhận diện
// thương hiệu). Màu nhấn theo nguyên tố. Không phải tranh của bộ bài nào — hình ký hiệu giản lược do Hiểu Bản Thân vẽ.
import type { ReactNode } from "react";
import { MAU_NGUYEN_TO, soLaMa, type BoTarot, type LaGon, type NguyenTo } from "@/lib/tarot-chung";
import { cn } from "@/lib/utils";

export const TI_LE = 200 / 120;   // cao / rộng

const GIAY = "#f3ead6", MUC = "#2a2140", VANG = "#E9C46A";

// Ký hiệu bộ (hệ toạ độ 0..1 nhân với cỡ) — mỗi bộ một hình nhỏ.
function KyHieu({ bo, x, y, s, mau }: { bo: BoTarot; x: number; y: number; s: number; mau: string }) {
  const t = `translate(${x - s / 2} ${y - s / 2}) scale(${s / 20})`;
  if (bo === "gay") return <g transform={t}><path d="M10,19 L10,3" stroke={mau} strokeWidth={2.2} strokeLinecap="round" /><path d="M10,6 C13,5 15,7 14,10 C12,10 10,8 10,6 Z M10,9 C7,8 5,10 6,13 C8,13 10,11 10,9 Z" fill={mau} /></g>;
  if (bo === "coc") return <g transform={t}><path d="M4,4 H16 L14.5,11 A4.5,4.5 0 0 1 5.5,11 Z" fill="none" stroke={mau} strokeWidth={1.8} strokeLinejoin="round" /><path d="M10,15 V18 M6.5,18 H13.5" stroke={mau} strokeWidth={1.8} strokeLinecap="round" /></g>;
  if (bo === "kiem") return <g transform={t}><path d="M10,2 L10,17" stroke={mau} strokeWidth={2.2} strokeLinecap="round" /><path d="M5,13 H15" stroke={mau} strokeWidth={2} strokeLinecap="round" /><path d="M10,2 L8,5 H12 Z" fill={mau} /><circle cx={10} cy={18.5} r={1.4} fill={mau} /></g>;
  return <g transform={t}><circle cx={10} cy={10} r={8} fill="none" stroke={mau} strokeWidth={1.8} /><path d="M10,3.5 L11.9,8.3 L17,8.6 L13,11.8 L14.3,16.8 L10,14 L5.7,16.8 L7,11.8 L3,8.6 L8.1,8.3 Z" fill={mau} fillOpacity={0.85} /></g>;
}

/** Vị trí các ký hiệu cho lá số 1–10 (hệ 120×200, vùng 20..100 × 46..150). */
function viTriSo(n: number): [number, number][] {
  const cx = 60, top = 52, bot = 148;
  const col = (k: number, tong: number) => { const d = (bot - top) / (tong - 1 || 1); return Array.from({ length: tong }, (_, i): [number, number] => [k, tong === 1 ? 100 : top + i * d]); };
  switch (n) {
    case 1: return [[cx, 100]];
    case 2: return [[cx, 70], [cx, 130]];
    case 3: return [[cx, 62], [cx, 100], [cx, 138]];
    case 4: return [...col(40, 2), ...col(80, 2)];
    case 5: return [...col(40, 2), ...col(80, 2), [cx, 100]];
    case 6: return [...col(40, 3), ...col(80, 3)];
    case 7: return [...col(40, 3), ...col(80, 3), [cx, 81]];
    case 8: return [...col(40, 4), ...col(80, 4)];
    case 9: return [...col(40, 4), ...col(80, 4), [cx, 100]];
    default: return [...col(40, 4), ...col(80, 4), [cx, 76], [cx, 124]];
  }
}

/** Hình biểu tượng riêng từng lá ẩn chính (nét đơn, hệ 120×200, tâm 60,98). */
const AN_CHINH: Record<number, ReactNode> = {
  0: <><path d="M38,140 L58,80 L82,140" fill="none" strokeWidth={2.2} /><circle cx={58} cy={66} r={9} /><path d="M30,142 H90 M66,84 L84,70" strokeWidth={2} /></>,
  1: <><path d="M60,60 V136 M40,136 H80" strokeWidth={2.4} /><path d="M50,84 C52,74 68,74 70,84 C68,94 52,94 50,84 Z" /><circle cx={60} cy={56} r={4} fill={VANG} stroke="none" /></>,
  2: <><path d="M38,58 V140 M82,58 V140" strokeWidth={3} /><path d="M48,74 Q60,66 72,74 V128 Q60,136 48,128 Z" fill="none" strokeWidth={2} /><path d="M52,100 A8,8 0 1 0 68,100" fill="none" strokeWidth={2} /></>,
  3: <><path d="M30,138 Q60,110 90,138" fill="none" strokeWidth={2} /><circle cx={60} cy={82} r={16} fill="none" strokeWidth={2.2} /><path d="M48,82 H72 M60,70 V94" strokeWidth={2} /><path d="M36,120 Q44,104 52,120 M68,120 Q76,104 84,120" fill="none" strokeWidth={2} /></>,
  4: <><rect x={38} y={76} width={44} height={60} fill="none" strokeWidth={2.4} /><path d="M38,76 L60,56 L82,76" fill="none" strokeWidth={2.4} /><path d="M52,136 V112 H68 V136" fill="none" strokeWidth={2} /></>,
  5: <><path d="M60,58 V140" strokeWidth={2.6} /><path d="M44,76 H76 M48,94 H72 M52,112 H68" strokeWidth={2.4} /><path d="M42,140 H78" strokeWidth={2.4} /></>,
  6: <><path d="M60,138 C34,118 30,92 42,84 C50,78 58,84 60,92 C62,84 70,78 78,84 C90,92 86,118 60,138 Z" fill="none" strokeWidth={2.4} /><circle cx={60} cy={66} r={6} fill={VANG} stroke="none" /></>,
  7: <><rect x={36} y={84} width={48} height={32} rx={4} fill="none" strokeWidth={2.4} /><circle cx={46} cy={126} r={8} fill="none" strokeWidth={2.2} /><circle cx={74} cy={126} r={8} fill="none" strokeWidth={2.2} /><path d="M60,84 V62 M50,66 H70" strokeWidth={2.2} /></>,
  8: <><path d="M38,98 C38,70 82,70 82,98 C82,126 38,126 38,98 Z" fill="none" strokeWidth={2.4} /><path d="M46,98 C46,82 74,82 74,98 C74,114 46,114 46,98 Z" fill="none" strokeWidth={2} /><path d="M52,60 Q60,52 68,60" fill="none" strokeWidth={2.4} /></>,
  9: <><path d="M60,58 V140" strokeWidth={2.4} /><path d="M46,80 L60,66 L74,80 V96 H46 Z" fill="none" strokeWidth={2.2} /><path d="M60,74 L63,80 H57 Z" fill={VANG} stroke="none" /></>,
  10: <><circle cx={60} cy={98} r={32} fill="none" strokeWidth={2.4} /><circle cx={60} cy={98} r={10} fill="none" strokeWidth={2} /><path d="M60,66 V130 M28,98 H92 M37,75 L83,121 M83,75 L37,121" strokeWidth={1.6} /></>,
  11: <><path d="M60,58 V140 M34,74 H86" strokeWidth={2.4} /><path d="M34,74 L26,100 H42 Z M86,74 L78,100 H94 Z" fill="none" strokeWidth={2} /></>,
  12: <><path d="M34,60 H86 M60,60 V84" strokeWidth={2.4} /><circle cx={60} cy={132} r={9} fill="none" strokeWidth={2.2} /><path d="M60,84 V122 M60,96 L46,112 M60,96 L74,112" strokeWidth={2.2} /></>,
  13: <><path d="M40,70 Q60,54 80,70 V96 Q60,112 40,96 Z" fill="none" strokeWidth={2.4} /><circle cx={52} cy={84} r={4} /><circle cx={68} cy={84} r={4} /><path d="M44,120 Q60,110 76,120 L68,140 H52 Z" fill="none" strokeWidth={2} /></>,
  14: <><path d="M42,64 H58 V96 Q58,110 44,116" fill="none" strokeWidth={2.4} /><path d="M78,136 H62 V104 Q62,90 76,84" fill="none" strokeWidth={2.4} /><path d="M50,100 Q60,96 70,100" fill="none" strokeWidth={2} strokeDasharray="2 3" /></>,
  15: <><path d="M44,76 L34,54 L50,66 M76,76 L86,54 L70,66" fill="none" strokeWidth={2.2} /><circle cx={60} cy={92} r={18} fill="none" strokeWidth={2.4} /><path d="M50,120 L40,140 M70,120 L80,140 M44,132 H76" strokeWidth={2} /></>,
  16: <><rect x={44} y={80} width={32} height={58} fill="none" strokeWidth={2.4} /><path d="M40,80 H80 M48,80 L44,68 H76 L72,80" fill="none" strokeWidth={2} /><path d="M82,50 L66,66 L78,70 L62,88" fill="none" strokeWidth={2.4} stroke={VANG} /></>,
  17: <><path d="M60,60 L65,78 L84,80 L70,92 L75,110 L60,100 L45,110 L50,92 L36,80 L55,78 Z" fill="none" strokeWidth={2.4} /><path d="M40,130 Q60,120 80,130 M44,140 Q60,132 76,140" fill="none" strokeWidth={2} /></>,
  18: <><path d="M76,66 A30,30 0 1 0 76,130 A24,24 0 1 1 76,66 Z" fill="none" strokeWidth={2.4} /><path d="M32,140 H88" strokeWidth={2} /><path d="M36,132 L44,124 L50,132 M72,132 L80,124 L86,132" fill="none" strokeWidth={2} /></>,
  19: <><circle cx={60} cy={98} r={20} fill="none" strokeWidth={2.4} /><path d="M60,64 V72 M60,124 V132 M26,98 H34 M86,98 H94 M36,74 L42,80 M78,116 L84,122 M84,74 L78,80 M42,116 L36,122" strokeWidth={2.4} strokeLinecap="round" /></>,
  20: <><path d="M60,56 L48,76 H56 V96 H64 V76 H72 Z" fill="none" strokeWidth={2.2} /><path d="M36,118 Q60,104 84,118 M36,118 L40,140 M84,118 L80,140 M60,112 V138" fill="none" strokeWidth={2} /></>,
  21: <><ellipse cx={60} cy={98} rx={30} ry={42} fill="none" strokeWidth={2.4} /><circle cx={60} cy={82} r={7} fill="none" strokeWidth={2} /><path d="M60,90 V118 M60,100 L48,110 M60,100 L72,110 M60,118 L52,134 M60,118 L68,134" strokeWidth={2} /></>,
};

function VuongMien({ cap, mau }: { cap: number; mau: string }) {
  if (cap === 11) return <path d="M46,74 H74 L70,86 H50 Z" fill="none" stroke={mau} strokeWidth={2} />;            // mũ tiểu đồng
  if (cap === 12) return <path d="M44,86 L52,66 L60,80 L68,66 L76,86 Z" fill="none" stroke={mau} strokeWidth={2.2} />;   // mũ hiệp sĩ
  if (cap === 13) return <path d="M42,88 L46,68 L54,80 L60,64 L66,80 L74,68 L78,88 Z" fill="none" stroke={mau} strokeWidth={2.2} />;
  return <><path d="M42,88 L46,66 L54,78 L60,62 L66,78 L74,66 L78,88 Z" fill="none" stroke={mau} strokeWidth={2.2} /><path d="M60,52 V62 M56,56 H64" stroke={mau} strokeWidth={2} /></>;
}

/** Mặt trước. `nguoc` (TR-2): chỉ HÌNH xoay 180° — số, tên giữ chiều đọc được (lá 6 xoay ngược trông như số 9) — và có
 *  nhãn "NGƯỢC" ở góc, để người mới nhìn là biết lá rút ngược. */
export function MatTruoc({ la, w, nguoc = false, nhanNguoc = "NGƯỢC" }: { la: LaGon; w?: number; nguoc?: boolean; /** QTE: chữ nhãn góc lá ngược (bản Anh: "REVERSED"). */ nhanNguoc?: string }) {
  const mau = MAU_NGUYEN_TO[la.nguyen_to].hex;
  const h = w ? w * TI_LE : undefined;
  const nhan = la.loai === "an_chinh" ? soLaMa(la.so) : la.loai === "so" ? (la.so === 1 ? "A" : String(la.so)) : ({ 11: "P", 12: "Kn", 13: "Q", 14: "K" } as Record<number, string>)[la.so] ?? "";
  return (
    <svg viewBox="0 0 120 200" width={w ?? "100%"} height={h ?? "100%"} role="img" aria-label={`${la.ten} (${la.en})${nguoc ? ` — ${nhanNguoc.toLowerCase()}` : ""}`} className="block select-none" data-nguoc={nguoc ? 1 : 0}>
      <defs>
        <linearGradient id={`vang-${la.id}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff2c8" /><stop offset="0.5" stopColor={VANG} /><stop offset="1" stopColor="#b9892f" /></linearGradient>
      </defs>
      <rect x={1} y={1} width={118} height={198} rx={9} fill={`url(#vang-${la.id})`} />
      <rect x={4} y={4} width={112} height={192} rx={7} fill={GIAY} />
      <rect x={9} y={9} width={102} height={182} rx={5} fill="none" stroke={mau} strokeWidth={1.2} strokeOpacity={0.6} />
      <text x={60} y={30} textAnchor="middle" fontSize={la.loai === "an_chinh" && la.so >= 10 ? 13 : 15} fontWeight={700} fill={MUC} fontFamily="Georgia, serif">{nhan}</text>
      <g transform={nguoc ? "rotate(180 60 100)" : undefined}>
        <g stroke={MUC} strokeLinecap="round" strokeLinejoin="round" fill={MUC}>
          {la.loai === "an_chinh" && AN_CHINH[la.so]}
        </g>
        {la.loai === "so" && la.bo && viTriSo(la.so).map(([x, y], i) => <KyHieu key={i} bo={la.bo!} x={x} y={y} s={la.so <= 3 ? 30 : la.so <= 6 ? 22 : 18} mau={mau} />)}
        {la.loai === "hoang_gia" && la.bo && <><VuongMien cap={la.so} mau={MUC} /><KyHieu bo={la.bo} x={60} y={116} s={40} mau={mau} /></>}
      </g>
      {nguoc && (
        <g data-testid="nhan-nguoc">
          <rect x={72} y={14} width={38} height={14} rx={7} fill="#b9772f" />
          <text x={91} y={24.2} textAnchor="middle" fontSize={7.4} fontWeight={700} fill="#fff8e6" fontFamily="system-ui, sans-serif" letterSpacing={0.4}>{nhanNguoc}</text>
        </g>
      )}
      <text x={60} y={176} textAnchor="middle" fontSize={la.ten.length > 14 ? 8.5 : 10} fontWeight={600} fill={MUC} fontFamily="Georgia, serif">{la.ten}</text>
      <text x={60} y={188} textAnchor="middle" fontSize={6.5} fill={MUC} fillOpacity={0.6} fontFamily="system-ui, sans-serif">{la.en}</text>
    </svg>
  );
}

export function MatSau({ w, sang = false }: { w?: number; sang?: boolean }) {
  const h = w ? w * TI_LE : undefined;
  const vach = Array.from({ length: 9 }, (_, k) => { const g = -Math.PI / 2 + (2 * Math.PI * k) / 9; return [60 + 24 * Math.cos(g), 100 + 24 * Math.sin(g), 60 + 30 * Math.cos(g), 100 + 30 * Math.sin(g)] as const; });
  return (
    <svg viewBox="0 0 120 200" width={w ?? "100%"} height={h ?? "100%"} aria-hidden className="block select-none">
      <defs>
        <linearGradient id="ls-nen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#1b1838" /><stop offset="1" stopColor="#0b0b1c" /></linearGradient>
        <linearGradient id="ls-vang" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff2c8" /><stop offset="0.5" stopColor={VANG} /><stop offset="1" stopColor="#b9892f" /></linearGradient>
      </defs>
      <rect x={1} y={1} width={118} height={198} rx={9} fill="url(#ls-vang)" />
      <rect x={4} y={4} width={112} height={192} rx={7} fill="url(#ls-nen)" />
      <rect x={9} y={9} width={102} height={182} rx={5} fill="none" stroke={VANG} strokeOpacity={sang ? 0.9 : 0.45} strokeWidth={1} />
      {[[22, 30, 1], [96, 22, 0.8], [30, 170, 0.9], [92, 178, 1.1], [18, 110, 0.7], [102, 96, 0.7], [60, 40, 0.6], [60, 160, 0.6]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} fill="#fff" fillOpacity={0.7} />)}
      <circle cx={60} cy={100} r={36} fill="none" stroke={VANG} strokeOpacity={0.5} strokeWidth={1} />
      <circle cx={60} cy={100} r={27} fill="none" stroke={VANG} strokeOpacity={0.35} strokeWidth={0.8} strokeDasharray="2 4" />
      {vach.map(([x1, y1, x2, y2], i) => <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={VANG} strokeWidth={1.4} strokeLinecap="round" />)}
      <path d="M60,88 L63,97 L72,100 L63,103 L60,112 L57,103 L48,100 L57,97 Z" fill={VANG} />
    </svg>
  );
}

/** Lá bài có thể lật (CSS 3D): `lat` = đang ngửa; `nguoc` xoay HÌNH mặt trước 180° (chữ giữ chiều đọc, có nhãn NGƯỢC). Component thuần, không trạng thái.
 *  `w` = bề rộng px; bỏ trống → co giãn theo khung cha (giữ tỉ lệ 120:200). */
export function LaBai({ la, lat, nguoc = false, w, className, sang = false, onClick, nhan, tatHieuUng = false, chu }: {
  la: LaGon | null; lat: boolean; nguoc?: boolean; w?: number; className?: string; sang?: boolean; onClick?: () => void; nhan?: string; tatHieuUng?: boolean;
  /** QTE: chữ theo ngôn ngữ (mặc định tiếng Việt). */ chu?: { nguoc: string; up: string; nhan_nguoc: string };
}) {
  const Tag = onClick ? "button" : "div";
  const c = chu ?? { nguoc: " (ngược)", up: "Lá bài úp", nhan_nguoc: "NGƯỢC" };
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick} aria-label={nhan ?? (la && lat ? `${la.ten}${nguoc ? c.nguoc : ""}` : c.up)}
      className={cn("relative block rounded-[9px] shadow-card outline-none focus-visible:ring-2 focus-visible:ring-gold", onClick && "cursor-pointer", !w && "w-full", className)}
      style={{ width: w, height: w ? w * TI_LE : undefined, aspectRatio: w ? undefined : "120 / 200", perspective: 900 }} data-testid="la-bai" data-lat={lat ? 1 : 0} data-id={la?.id}>
      <div className="relative size-full" style={{ transformStyle: "preserve-3d", transform: lat ? "rotateY(180deg)" : "rotateY(0deg)", transition: tatHieuUng ? "none" : "transform 650ms cubic-bezier(.45,0,.25,1)" }}>
        <div className="absolute inset-0 overflow-hidden rounded-[9px]" style={{ backfaceVisibility: "hidden" }}><MatSau w={w} sang={sang} /></div>
        <div className="absolute inset-0 overflow-hidden rounded-[9px]" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          {la && <MatTruoc la={la} w={w} nguoc={nguoc} nhanNguoc={c.nhan_nguoc} />}
        </div>
      </div>
    </Tag>
  );
}

export const mauNguyenTo = (nt: NguyenTo) => MAU_NGUYEN_TO[nt];
