// Hình một lá bài Tarot. TR-5 (chủ dự án chốt 2026-11-10, thay "hình ký hiệu tự vẽ" của TR-1): mặt trước là TRANH Rider–Waite
// in năm 1909 (phạm vi công cộng; KHÔNG dùng bản tô màu lại năm 1971 còn bản quyền) — tệp webp tự lưu ở `public/tarot/rws`
// (không ảnh ngoài, hợp CSP). Mặt sau: nền đêm sao + vòng chín vạch (nhận diện thương hiệu), vẽ SVG. Dùng được ở máy chủ.
import { MAU_NGUYEN_TO, type LaGon, type NguyenTo } from "@/lib/tarot-chung";
import { cn } from "@/lib/utils";

export const TI_LE = 200 / 120;   // cao / rộng

const VANG = "#E9C46A";

/** Đường dẫn tranh của một lá (tự lưu trong `public/tarot/rws`, 360 px, webp). */
export const anhLa = (id: string) => `/tarot/rws/${id}.webp`;

/** Mặt trước (TR-5): tranh Rider–Waite in năm 1909 (Pamela Colman Smith vẽ, phạm vi công cộng — bản quét tự lưu trên site,
 *  không gọi ảnh ngoài) trong viền vàng. `nguoc`: xoay cả tranh 180° như lá thật + nhãn "NGƯỢC" giữ chiều đọc ở góc.
 *  Tên Việt của lá không in trên tranh — nơi dùng đặt tên cạnh lá; `alt` của ảnh luôn có tên. */
export function MatTruoc({ la, w, nguoc = false, nhanNguoc = "NGƯỢC", gap = false }: { la: LaGon; w?: number; nguoc?: boolean; /** QTE: chữ nhãn góc lá ngược (bản Anh: "REVERSED"). */ nhanNguoc?: string;
  /** tải ngay (lá sắp lật) thay vì chờ cuộn tới */ gap?: boolean }) {
  return (
    <span data-nguoc={nguoc ? 1 : 0} data-mat-truoc={la.id}
      className="relative block select-none overflow-hidden rounded-[9px] [container-type:inline-size]"
      style={{ width: w ?? "100%", height: w ? w * TI_LE : undefined, aspectRatio: w ? undefined : "120 / 200", padding: "2.6%", background: `linear-gradient(135deg,#fff2c8,${VANG} 50%,#b9892f)` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={anhLa(la.id)} alt={`${la.ten}${la.en ? ` (${la.en})` : ""}${nguoc ? ` — ${nhanNguoc.toLowerCase()}` : ""}`} width={360} height={618} loading={gap ? "eager" : "lazy"} decoding="async" draggable={false}
        className="block size-full rounded-[6px] bg-[#f3ead6] object-cover" style={nguoc ? { transform: "rotate(180deg)" } : undefined} />
      {nguoc && (
        <span data-testid="nhan-nguoc" className="absolute right-[6%] top-[4%] rounded-full bg-[#b9772f] font-sans font-bold leading-none tracking-wide text-[#fff8e6] shadow"
          style={{ fontSize: "max(7px, 7.5cqw)", padding: "0.35em 0.7em" }}>{nhanNguoc}</span>
      )}
    </span>
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

/** Lá bài có thể lật (CSS 3D): `lat` = đang ngửa; `nguoc` xoay tranh mặt trước 180° (có nhãn NGƯỢC giữ chiều đọc). Component thuần, không trạng thái.
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
          {la && <MatTruoc la={la} w={w} nguoc={nguoc} nhanNguoc={c.nhan_nguoc} gap />}
        </div>
      </div>
    </Tag>
  );
}

export const mauNguyenTo = (nt: NguyenTo) => MAU_NGUYEN_TO[nt];
