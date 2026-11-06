// NT-1 — "Bản đồ gương mặt": gương mặt giản lược (không phải mặt ai) với 22 vùng của tướng pháp; mỗi vùng tô theo mức
// engine đã chấm (thuận / cân bằng / cần lưu ý / trung tính), vùng đang hỏi hoặc vùng lưu niên của năm nay sáng lên.
// Component THUẦN: nhận dữ liệu đã tính, không gọi engine. Dùng được ở máy chủ (`tinh`, cho hình minh hoạ trang kiến thức)
// và trình duyệt (bấm / phím vào vùng). Hai bên đối xứng (vùng trái + phải cùng một id; `ben` chỉ tô một bên khi cần).
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { laVung, VUNG_MAT, type MucVung, type VungMat } from "@/lib/nhan-tuong-chung";

const MAU: Record<MucVung, string> = {
  thuan: "fill-jade/35 stroke-jade",
  can_bang: "fill-gold/30 stroke-gold",
  can_chu_dong: "fill-cinnabar/35 stroke-cinnabar",
  trung_tinh: "fill-moon/20 stroke-moon/70",
};
const NHAN_MUC: Record<MucVung, string> = { thuan: "thuận", can_bang: "cân bằng", can_chu_dong: "nên chú ý", trung_tinh: "trung tính" };
// Chấm màu chú thích — lớp viết đủ (Tailwind chỉ sinh lớp xuất hiện nguyên văn trong mã).
const CHAM: Record<MucVung, string> = { thuan: "bg-jade", can_bang: "bg-gold", can_chu_dong: "bg-cinnabar", trung_tinh: "bg-moon" };

type Hinh = { kieu: "rect"; x: number; y: number; w: number; h: number; rx?: number } | { kieu: "ellipse"; cx: number; cy: number; rx: number; ry: number } | { kieu: "path"; d: string };
/** Hình của từng vùng (toạ độ 300×380, mặt nhìn thẳng, bên TRÁI của người soi = bên phải màn hình). `doi`: có bản đối xứng. */
const HINH: Record<Exclude<VungMat, "toan_mat">, { hinh: Hinh; doi?: boolean }> = {
  tran_tren: { hinh: { kieu: "rect", x: 108, y: 50, w: 84, h: 34, rx: 14 } },
  tran_giua: { hinh: { kieu: "rect", x: 112, y: 88, w: 76, h: 28, rx: 12 } },
  tran_ben: { hinh: { kieu: "ellipse", cx: 88, cy: 84, rx: 22, ry: 20 }, doi: true },
  thai_duong: { hinh: { kieu: "ellipse", cx: 68, cy: 126, rx: 17, ry: 22 }, doi: true },
  an_duong: { hinh: { kieu: "rect", x: 132, y: 118, w: 36, h: 26, rx: 9 } },
  long_may: { hinh: { kieu: "rect", x: 76, y: 116, w: 54, h: 12, rx: 6 }, doi: true },
  dien_trach: { hinh: { kieu: "rect", x: 80, y: 130, w: 50, h: 11, rx: 5 }, doi: true },
  mat: { hinh: { kieu: "ellipse", cx: 106, cy: 153, rx: 25, ry: 11 }, doi: true },
  ngu_vi: { hinh: { kieu: "ellipse", cx: 70, cy: 156, rx: 11, ry: 13 }, doi: true },
  le_duong: { hinh: { kieu: "rect", x: 84, y: 167, w: 44, h: 13, rx: 6 }, doi: true },
  son_can: { hinh: { kieu: "rect", x: 136, y: 146, w: 28, h: 20, rx: 7 } },
  song_mui: { hinh: { kieu: "rect", x: 138, y: 168, w: 24, h: 46, rx: 9 } },
  quyen: { hinh: { kieu: "ellipse", cx: 92, cy: 200, rx: 25, ry: 19 }, doi: true },
  chuan_dau: { hinh: { kieu: "ellipse", cx: 150, cy: 228, rx: 16, ry: 14 } },
  canh_mui: { hinh: { kieu: "ellipse", cx: 125, cy: 229, rx: 11, ry: 9 }, doi: true },
  nhan_trung: { hinh: { kieu: "rect", x: 142, y: 245, w: 16, h: 20, rx: 6 } },
  phap_lenh: { hinh: { kieu: "path", d: "M126,238 L134,242 L124,288 L112,284 Z" }, doi: true },
  mieng: { hinh: { kieu: "rect", x: 112, y: 268, w: 76, h: 22, rx: 11 } },
  thua_tuong: { hinh: { kieu: "rect", x: 136, y: 294, w: 28, h: 14, rx: 6 } },
  cam: { hinh: { kieu: "ellipse", cx: 150, cy: 328, rx: 40, ry: 17 } },
  ham: { hinh: { kieu: "ellipse", cx: 90, cy: 282, rx: 22, ry: 32 }, doi: true },
  tai: { hinh: { kieu: "ellipse", cx: 46, cy: 180, rx: 13, ry: 29 }, doi: true },
};

function ve(h: Hinh, phai: boolean, props: Record<string, unknown>) {
  const g = phai ? "translate(300 0) scale(-1 1)" : undefined;
  if (h.kieu === "rect") return <rect x={h.x} y={h.y} width={h.w} height={h.h} rx={h.rx ?? 0} transform={g} {...props} />;
  if (h.kieu === "ellipse") return <ellipse cx={h.cx} cy={h.cy} rx={h.rx} ry={h.ry} transform={g} {...props} />;
  return <path d={h.d} transform={g} {...props} />;
}

export function BanDoMat({ muc = {}, sang = [], chon = null, onChon, nhan = {}, tinh = false, className, chuThich = true, ghiChu }: {
  /** Mức từng vùng (engine `da_tinh.ban_do`). */ muc?: Record<string, MucVung | null | undefined>;
  /** Vùng đang được nhấn mạnh (câu đang hỏi, vùng lưu niên năm nay…). */ sang?: string[];
  /** Vùng đang chọn (viền đậm). */ chon?: string | null;
  onChon?: (vung: VungMat) => void;
  /** Tên hiển thị của vùng (tooltip / nhãn trình đọc màn hình). */ nhan?: Record<string, string>;
  /** Vẽ tĩnh (máy chủ, không bấm, không hiệu ứng). */ tinh?: boolean;
  className?: string; chuThich?: boolean;
  /** Dòng chú thích riêng dưới hình (vd "Năm nay nhìn vào Sơn Căn"). */ ghiChu?: ReactNode;
}) {
  const coMuc = Object.values(muc).some(Boolean);
  const vungSang = new Set(sang.filter(laVung));
  return (
    <figure className={cn("relative", className)} data-testid="ban-do-mat">
      <svg viewBox="0 0 300 380" role={onChon && !tinh ? "group" : "img"} aria-label="Bản đồ gương mặt theo tướng pháp — gương mặt giản lược, không phải mặt của ai"
        className="mx-auto h-auto w-full max-w-[20rem] overflow-visible">
        <defs>
          <radialGradient id="bdm-quang" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="rgb(var(--gold))" stopOpacity="0.14" />
            <stop offset="100%" stopColor="rgb(var(--gold))" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={150} cy={190} r={175} fill="url(#bdm-quang)" />
        {/* Khung mặt + đường nét: mờ, dưới các vùng. Hai tai, chân tóc, mày, mắt, mũi, miệng — chỉ gợi hình. */}
        <g data-vung="toan_mat" data-muc={muc.toan_mat ?? undefined} data-sang={vungSang.has("toan_mat") ? "1" : undefined}
          {...(!tinh && onChon ? { role: "button", tabIndex: 0, "aria-label": nhan.toan_mat ?? "Khuôn mặt tổng thể", onClick: () => onChon("toan_mat"),
            onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChon("toan_mat"); } } } : {})}>
          <title>{`${nhan.toan_mat ?? "Khuôn mặt tổng thể"}${muc.toan_mat ? ` — ${NHAN_MUC[muc.toan_mat]}` : ""}`}</title>
          <path d="M150,22 C96,22 56,72 54,150 C52,232 94,330 150,354 C206,330 248,232 246,150 C244,72 204,22 150,22 Z"
            className={cn("fill-surface/60 transition-colors duration-300", muc.toan_mat ? MAU[muc.toan_mat].split(" ")[1] : "stroke-gold/70",
              (vungSang.has("toan_mat") || chon === "toan_mat") && "stroke-gold stroke-[3]", !tinh && onChon && "cursor-pointer focus:outline-none")}
            strokeWidth={vungSang.has("toan_mat") || chon === "toan_mat" ? 3 : 1.6} />
        </g>
        <path d="M70,66 Q150,34 230,66" className="fill-none stroke-gold/35" strokeWidth={1} strokeDasharray="3 5" />
        <path d="M80,124 Q106,112 130,122 M170,122 Q194,112 220,124" className="fill-none stroke-gold/70" strokeWidth={2.2} strokeLinecap="round" />
        <path d="M84,153 Q106,140 128,153 Q106,165 84,153 Z M172,153 Q194,140 216,153 Q194,165 172,153 Z" className="fill-none stroke-gold/60" strokeWidth={1.3} />
        <circle cx={106} cy={153} r={3.2} className="fill-gold/80" /><circle cx={194} cy={153} r={3.2} className="fill-gold/80" />
        <path d="M150,150 L146,218 Q150,236 158,232" className="fill-none stroke-gold/55" strokeWidth={1.3} strokeLinecap="round" />
        <path d="M118,279 Q150,290 182,279" className="fill-none stroke-cinnabar/70" strokeWidth={2} strokeLinecap="round" />
        <path d="M54,160 Q38,160 40,190 Q42,214 56,210 M246,160 Q262,160 260,190 Q258,214 244,210" className="fill-none stroke-gold/55" strokeWidth={1.3} />
        {/* Ba vạch tam đình */}
        <path d="M44,120 H256 M44,232 H256" className="stroke-jade/35" strokeWidth={1} strokeDasharray="2 4" />
        {(Object.keys(HINH) as Exclude<VungMat, "toan_mat">[]).map((v) => {
          const m = muc[v] ?? null;
          const dangSang = vungSang.has(v);
          const dangChon = chon === v;
          const lop = cn("transition-colors duration-300",
            m ? MAU[m] : coMuc ? "fill-transparent stroke-line/50" : "fill-transparent stroke-gold/15",
            dangSang && "stroke-gold stroke-[2.5]", dangChon && "stroke-fg stroke-[2.5]",
            !tinh && onChon && "cursor-pointer hover:fill-gold/25 focus:outline-none focus-visible:stroke-fg");
          const ten = nhan[v] ?? v;
          const props = { className: lop, strokeWidth: dangSang || dangChon ? 2.5 : 1.2, vectorEffect: "non-scaling-stroke" as const };
          const giao = !tinh && onChon ? {
            role: "button", tabIndex: 0, "aria-label": `${ten}${m ? ` — ${NHAN_MUC[m]}` : ""}`, "aria-pressed": dangChon,
            onClick: () => onChon(v), onKeyDown: (e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChon(v); } },
          } : {};
          return (
            <g key={v} data-vung={v} data-muc={m ?? undefined} data-sang={dangSang ? "1" : undefined} {...giao}>
              <title>{`${ten}${m ? ` — ${NHAN_MUC[m]}` : ""}`}</title>
              {ve(HINH[v].hinh, false, props)}
              {HINH[v].doi && ve(HINH[v].hinh, true, props)}
              {dangSang && !tinh && (
                <g className="motion-safe:animate-pulse pointer-events-none">{ve(HINH[v].hinh, false, { className: "fill-none stroke-gold/60", strokeWidth: 6 })}
                  {HINH[v].doi && ve(HINH[v].hinh, true, { className: "fill-none stroke-gold/60", strokeWidth: 6 })}</g>
              )}
            </g>
          );
        })}
      </svg>
      {chuThich && (coMuc || ghiChu) && (
        <figcaption className="mt-2 text-center text-xs text-fg-muted">
          {ghiChu}
          {coMuc && (
            <span className="mt-1 flex flex-wrap justify-center gap-x-3 gap-y-1" aria-label="Chú thích màu">
              {(["thuan", "can_bang", "can_chu_dong", "trung_tinh"] as MucVung[]).map((k) => (
                <span key={k} className="inline-flex items-center gap-1"><i aria-hidden className={cn("inline-block size-2.5 rounded-full", CHAM[k])} />{NHAN_MUC[k]}</span>
              ))}
            </span>
          )}
        </figcaption>
      )}
    </figure>
  );
}

export { VUNG_MAT };
