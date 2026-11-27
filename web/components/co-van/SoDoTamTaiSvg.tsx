"use client";
// Sơ đồ Tam Tài trực giao (Thiên · Nhân · Địa) + Sóng nhịp 12 tháng — Starry-Night SVG.
// Bất biến CD-1: Tuyệt đối KHÔNG cộng gộp hay tính trung bình điểm giữa ba trụ; mỗi đỉnh giữ mức độc lập.
// Bất biến bảng màu: Tuyệt đối KHÔNG dùng sắc đỏ; chỉ dùng Gold (#E5C76B), Jade (#34D399), Moon (#7DD3FC), Amber (#FBBF24), Slate (#94A3B8).
import { useState } from "react";
import { ArrowUpRight, CalendarClock, Compass, Sparkles, User } from "lucide-react";
import Link from "@/components/khung/Lien";
import type { Muc } from "@/components/luan-giai/kieu";
import { cn } from "@/lib/utils";

export interface TruTamTai {
  ma: "nhan" | "thien" | "dia";
  ten_tru: string;
  nguon: string;
  muc: Muc | null;
  nhan_muc: string | null;
  nhan_xet: string;
  hanh_dong: string;
  can_cu: string[];
  lien_ket: { ten: string; duong: string };
  ma_mau: string;
}

export interface NhipThangTamTai {
  thang: string;
  nhip: "day_manh" | "can_bang" | "phong_thu";
  nhan_nhip: string;
  goi_y?: string;
}

interface CauHinhDinh {
  ma: "thien" | "nhan" | "dia";
  x: number;
  y: number;
  nhanPhu: string;
  gocTia: string;
}

const DINH_TAM_TAI: readonly [CauHinhDinh, CauHinhDinh, CauHinhDinh] = [
  { ma: "thien", x: 260, y: 64, nhanPhu: "Tử vi · Nhịp thời vận", gocTia: "Trục Thiên Thời" },
  { ma: "nhan", x: 108, y: 266, nhanPhu: "Bát tự · Nội lực", gocTia: "Trục Nhân Hòa" },
  { ma: "dia", x: 412, y: 266, nhanPhu: "Phong thủy · Không gian", gocTia: "Trục Địa Lợi" },
] as const;

function sacTheoMuc(muc: Muc | null): {
  vien: string;
  nen: string;
  chu: string;
  tia: string;
  cham: string;
  badgeClass: string;
  netDut: boolean;
} {
  if (muc === "thuan") {
    return {
      vien: "#34D399",
      nen: "rgba(52, 211, 153, 0.14)",
      chu: "#34D399",
      tia: "rgba(52, 211, 153, 0.65)",
      cham: "#34D399",
      badgeClass: "border-jade/45 bg-jade/10 text-jade",
      netDut: false,
    };
  }
  if (muc === "can_bang") {
    return {
      vien: "#E5C76B",
      nen: "rgba(229, 199, 107, 0.14)",
      chu: "#E5C76B",
      tia: "rgba(229, 199, 107, 0.65)",
      cham: "#E5C76B",
      badgeClass: "border-gold/45 bg-gold/10 text-gold",
      netDut: false,
    };
  }
  if (muc === "can_chu_dong") {
    return {
      vien: "#FBBF24",
      nen: "rgba(251, 191, 36, 0.14)",
      chu: "#FBBF24",
      tia: "rgba(251, 191, 36, 0.65)",
      cham: "#FBBF24",
      badgeClass: "border-amber-400/45 bg-amber-500/10 text-amber-300",
      netDut: false,
    };
  }
  return {
    vien: "#94A3B8",
    nen: "rgba(148, 163, 184, 0.08)",
    chu: "#94A3B8",
    tia: "rgba(148, 163, 184, 0.38)",
    cham: "#94A3B8",
    badgeClass: "border-line/70 bg-bg/60 text-fg-muted",
    netDut: true,
  };
}

export function SoDoTamTaiSvg({
  tenMach,
  baTru,
   onChonTru,
}: {
  tenMach?: string;
  baTru: { nhan: TruTamTai; thien: TruTamTai; dia: TruTamTai };
  onChonTru?: (ma: "nhan" | "thien" | "dia") => void;
}) {
  const [dangChonTru, setDangChonTru] = useState<"nhan" | "thien" | "dia">("thien");

  const chonTru = (ma: "nhan" | "thien" | "dia") => {
    setDangChonTru(ma);
    onChonTru?.(ma);
  };

  const truDangXem = baTru[dangChonTru] ?? baTru.thien ?? baTru.nhan ?? baTru.dia;
  if (!truDangXem) return null;
  const sacDangXem = sacTheoMuc(truDangXem.muc);
  const cx = 260;
  const cy = 182;

  return (
    <section
      className="rounded-2xl border border-line/80 bg-surface/50 p-4 sm:p-5"
      aria-label="Sơ đồ Tam Tài trực giao Thiên Nhân Địa"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gold">
            Tam Tài trực giao · Ba hệ quy chiếu độc lập
          </p>
          <p className="mt-0.5 text-xs text-fg-muted">
            Chạm vào từng đỉnh Thiên · Nhân · Địa để đọc sâu căn cứ và việc nên làm (mỗi trục đọc riêng)
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-fg-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#34D399]" aria-hidden /> Thuận đà
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#E5C76B]" aria-hidden /> Cân bằng
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-[#FBBF24]" aria-hidden /> Cần chủ động
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full border border-dashed border-[#94A3B8]" aria-hidden /> Chưa đủ dữ kiện
          </span>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-line/60 bg-bg/70 p-2 sm:p-3">
        <svg
          viewBox="0 0 520 340"
          className="mx-auto h-auto w-full max-w-[520px] select-none"
          data-testid="so-do-tam-tai-svg"
          role="img"
          aria-label={`Sơ đồ Tam Tài cho mạch ${tenMach ?? "quyết định"}`}
        >
          <defs>
            <radialGradient id="tam-tai-hub-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#E5C76B" stopOpacity="0.22" />
              <stop offset="65%" stopColor="#7DD3FC" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#0B1020" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="tam-tai-star-bg" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#7DD3FC" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0B1020" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Nền sao đêm nhẹ */}
          <rect x="0" y="0" width="520" height="340" rx="14" fill="url(#tam-tai-star-bg)" />
          <circle cx={cx} cy={cy} r="132" fill="url(#tam-tai-hub-glow)" />
          <circle
            cx={cx}
            cy={cy}
            r="112"
            fill="none"
            stroke="#94A3B8"
            strokeOpacity="0.18"
            strokeDasharray="3 5"
          />
          <circle
            cx={cx}
            cy={cy}
            r="72"
            fill="none"
            stroke="#E5C76B"
            strokeOpacity="0.2"
          />

          {/* Tam giác nối 3 đỉnh độc lập (chỉ biểu diễn thế chân kiềng, không gộp điểm) */}
          <polygon
            points={`${DINH_TAM_TAI[0].x},${DINH_TAM_TAI[0].y} ${DINH_TAM_TAI[1].x},${DINH_TAM_TAI[1].y} ${DINH_TAM_TAI[2].x},${DINH_TAM_TAI[2].y}`}
            fill="none"
            stroke="#94A3B8"
            strokeOpacity="0.22"
            strokeWidth="1.2"
            strokeDasharray="5 5"
          />

          {/* 3 trục trực giao từ tâm ra 3 đỉnh */}
          {DINH_TAM_TAI.map((dinh) => {
            const tru = baTru[dinh.ma];
            const sac = sacTheoMuc(tru.muc);
            const dangChon = dangChonTru === dinh.ma;
            return (
              <g key={`tia-${dinh.ma}`}>
                <line
                  x1={cx}
                  y1={cy}
                  x2={dinh.x}
                  y2={dinh.y}
                  stroke={sac.tia}
                  strokeWidth={dangChon ? 2.8 : 1.8}
                  strokeDasharray={sac.netDut ? "5 4" : undefined}
                />
                {/* Điểm dẫn truyền giữa trục */}
                <circle
                  cx={(cx + dinh.x) / 2}
                  cy={(cy + dinh.y) / 2}
                  r={dangChon ? 4 : 3}
                  fill={sac.cham}
                  fillOpacity={dangChon ? 0.95 : 0.65}
                />
              </g>
            );
          })}

          {/* Tâm mạch quyết định */}
          <g>
            <circle
              cx={cx}
              cy={cy}
              r="42"
              fill="rgba(15, 23, 42, 0.92)"
              stroke="#E5C76B"
              strokeOpacity="0.7"
              strokeWidth="1.6"
            />
            <circle
              cx={cx}
              cy={cy}
              r="36"
              fill="none"
              stroke="#7DD3FC"
              strokeOpacity="0.28"
              strokeDasharray="2 3"
            />
            <text
              x={cx}
              y={cy - 7}
              textAnchor="middle"
              fill="#7DD3FC"
              fontSize="9.5"
              fontWeight="600"
              letterSpacing="0.06em"
            >
              MẠCH XEM
            </text>
            <text
              x={cx}
              y={cy + 10}
              textAnchor="middle"
              fill="#F8FAFC"
              fontSize="11.5"
              fontWeight="600"
            >
              {(tenMach ?? "Tam Tài").slice(0, 18)}
            </text>
          </g>

          {/* 3 đỉnh Thiên - Nhân - Địa */}
          {DINH_TAM_TAI.map((dinh) => {
            const tru = baTru[dinh.ma];
            const sac = sacTheoMuc(tru.muc);
            const dangChon = dangChonTru === dinh.ma;
            const nhanMuc = tru.nhan_muc ?? "Không chấm mức";
            const boxW = 168;
            const boxH = 66;
            const boxX = dinh.x - boxW / 2;
            const boxY = dinh.y - boxH / 2;

            return (
              <g
                key={dinh.ma}
                role="button"
                tabIndex={0}
                aria-pressed={dangChon}
                aria-label={`${tru.ten_tru} - ${dinh.nhanPhu} - ${nhanMuc}`}
                data-testid={`tam-tai-dinh-${dinh.ma}`}
                data-tru={dinh.ma}
                data-muc={tru.muc ?? "khong_cham"}
                onClick={() => chonTru(dinh.ma)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    chonTru(dinh.ma);
                  }
                }}
                className="cursor-pointer focus:outline-none"
              >
                {dangChon && (
                  <rect
                    x={boxX - 4}
                    y={boxY - 4}
                    width={boxW + 8}
                    height={boxH + 8}
                    rx="17"
                    fill="none"
                    stroke={sac.vien}
                    strokeOpacity="0.55"
                    strokeWidth="1.5"
                  />
                )}
                <rect
                  x={boxX}
                  y={boxY}
                  width={boxW}
                  height={boxH}
                  rx="14"
                  fill="rgba(15, 23, 42, 0.94)"
                  stroke={sac.vien}
                  strokeWidth={dangChon ? 2.2 : 1.4}
                  strokeDasharray={sac.netDut ? "5 3" : undefined}
                />
                <rect
                  x={boxX + 2}
                  y={boxY + 2}
                  width={boxW - 4}
                  height={boxH - 4}
                  rx="12"
                  fill={sac.nen}
                />

                {/* Chấm trạng thái góc trên */}
                <circle cx={boxX + 16} cy={boxY + 18} r="4.5" fill={sac.cham} />
                <text
                  x={boxX + 27}
                  y={boxY + 22}
                  fill="#F8FAFC"
                  fontSize="12.5"
                  fontWeight="700"
                >
                  {tru.ten_tru}
                </text>

                <text
                  x={dinh.x}
                  y={boxY + 39}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="10"
                >
                  {dinh.nhanPhu}
                </text>

                <text
                  x={dinh.x}
                  y={boxY + 55}
                  textAnchor="middle"
                  fill={sac.chu}
                  fontSize="10.5"
                  fontWeight="600"
                >
                  {nhanMuc}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Thanh chuyển nhanh & Ngăn chi tiết trụ đang chọn ngay dưới sơ đồ */}
      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Chọn trụ Tam Tài để đọc chi tiết">
        {DINH_TAM_TAI.map((dinh) => {
          const tru = baTru[dinh.ma];
          const dangChon = dangChonTru === dinh.ma;
          return (
            <button
              key={dinh.ma}
              type="button"
              role="tab"
              aria-selected={dangChon}
              onClick={() => chonTru(dinh.ma)}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                dangChon
                  ? "border-gold bg-gold/15 text-gold"
                  : "border-line/70 bg-bg/50 text-fg-muted hover:border-gold/40 hover:text-fg",
              )}
            >
              {dinh.ma === "thien" ? (
                <Sparkles className="size-3.5" aria-hidden />
              ) : dinh.ma === "nhan" ? (
                <User className="size-3.5" aria-hidden />
              ) : (
                <Compass className="size-3.5" aria-hidden />
              )}
              <span>{tru.ten_tru}</span>
              <span className="text-[11px] opacity-80">· {tru.nhan_muc ?? "Không chấm mức"}</span>
            </button>
          );
        })}
      </div>

      <div
        className="mt-3 rounded-xl border border-gold/35 bg-bg/75 p-4"
        data-testid="tam-tai-chi-tiet-tru"
        data-tru-dang-xem={truDangXem.ma}
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="font-serif text-base text-fg">{truDangXem.ten_tru}</h4>
            <p className="text-xs text-fg-faint">Nguồn: {truDangXem.nguon}</p>
          </div>
          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", sacDangXem.badgeClass)}>
            {truDangXem.nhan_muc ?? "Không chấm mức"}
          </span>
        </div>

        <p className="mt-2.5 text-sm leading-relaxed text-fg">{truDangXem.nhan_xet}</p>
        <p className="mt-2 text-sm leading-relaxed text-fg-muted">
          <span className="font-medium text-fg">Nên làm: </span>
          {truDangXem.hanh_dong}
        </p>

        {truDangXem.can_cu.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5" data-testid="tam-tai-can-cu-chips">
            {truDangXem.can_cu.map((cc) => (
              <span
                key={cc}
                className="rounded-lg border border-line/70 bg-surface/60 px-2.5 py-1 text-xs text-fg-muted"
              >
                {cc}
              </span>
            ))}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line/50 pt-3">
          <Link
            href={truDangXem.lien_ket.duong}
            className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:underline"
          >
            {truDangXem.lien_ket.ten}
            <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}

function cauHinhNhip(nhip: NhipThangTamTai["nhip"]): {
  y: number;
  caoCot: number;
  mau: string;
  nen: string;
  chuClass: string;
} {
  if (nhip === "day_manh") {
    return {
      y: 34,
      caoCot: 68,
      mau: "#34D399",
      nen: "rgba(52, 211, 153, 0.22)",
      chuClass: "text-jade border-jade/45 bg-jade/10",
    };
  }
  if (nhip === "phong_thu") {
    return {
      y: 78,
      caoCot: 24,
      mau: "#FBBF24",
      nen: "rgba(251, 191, 36, 0.2)",
      chuClass: "text-amber-300 border-amber-400/45 bg-amber-500/10",
    };
  }
  return {
    y: 56,
    caoCot: 46,
    mau: "#E5C76B",
    nen: "rgba(229, 199, 107, 0.2)",
    chuClass: "text-gold border-gold/45 bg-gold/10",
  };
}

export function SongNhip12ThangSvg({
  danhSach,
  chonIndex,
  onChonThang,
}: {
  danhSach: NhipThangTamTai[];
  chonIndex: number;
  onChonThang: (index: number) => void;
}) {
  if (danhSach.length === 0) return null;
  const idxHopLe = Math.min(Math.max(0, chonIndex), danhSach.length - 1);
  const thangDangChon = danhSach[idxHopLe]!;
  const chNhip = cauHinhNhip(thangDangChon.nhip);

  const padX = 34;
  const stepX = danhSach.length > 1 ? (520 - padX * 2) / (danhSach.length - 1) : 0;
  const toaDo = danhSach.map((th, i) => {
    const ch = cauHinhNhip(th.nhip);
    return {
      x: padX + i * stepX,
      y: ch.y,
      caoCot: ch.caoCot,
      mau: ch.mau,
      nen: ch.nen,
      th,
      i,
    };
  });

  const duongSong = toaDo
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const truoc = toaDo[i - 1]!;
      const midX = (truoc.x + p.x) / 2;
      return `C ${midX} ${truoc.y}, ${midX} ${p.y}, ${p.x} ${p.y}`;
    })
    .join(" ");

  return (
    <div className="mt-3 space-y-3" data-testid="song-nhip-12-thang">
      <div className="overflow-hidden rounded-xl border border-line/60 bg-bg/70 p-2.5">
        <svg
          viewBox="0 0 520 132"
          className="h-auto w-full select-none"
          role="img"
          aria-label="Biểu đồ sóng nhịp hành động 12 tháng tới"
        >
          {/* Đường chuẩn 3 tầng nhịp (không chấm điểm số) */}
          <line x1="20" y1="34" x2="500" y2="34" stroke="#34D399" strokeOpacity="0.18" strokeDasharray="3 4" />
          <line x1="20" y1="56" x2="500" y2="56" stroke="#E5C76B" strokeOpacity="0.18" strokeDasharray="3 4" />
          <line x1="20" y1="78" x2="500" y2="78" stroke="#FBBF24" strokeOpacity="0.18" strokeDasharray="3 4" />

          {/* Đường sóng nối 12 tháng */}
          {toaDo.length > 1 && (
            <path
              d={duongSong}
              fill="none"
              stroke="#7DD3FC"
              strokeOpacity="0.55"
              strokeWidth="2"
            />
          )}

          {/* Cột nhịp & nút tương tác từng tháng */}
          {toaDo.map((p) => {
            const dangChon = p.i === idxHopLe;
            const nhanThang = p.th.thang.replace(/^Tháng\s*/i, "T");
            return (
              <g
                key={p.th.thang}
                role="button"
                tabIndex={0}
                aria-pressed={dangChon}
                aria-label={`${p.th.thang}: ${p.th.nhan_nhip}`}
                data-testid={`song-nhip-nut-${p.i}`}
                data-thang={p.th.thang}
                data-nhip={p.th.nhip}
                onClick={() => onChonThang(p.i)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onChonThang(p.i);
                  }
                }}
                className="cursor-pointer focus:outline-none"
              >
                <rect
                  x={p.x - 11}
                  y={102 - p.caoCot}
                  width="22"
                  height={p.caoCot}
                  rx="6"
                  fill={p.nen}
                  stroke={p.mau}
                  strokeWidth={dangChon ? 2 : 1}
                />
                {dangChon && (
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="8"
                    fill="none"
                    stroke="#E5C76B"
                    strokeWidth="1.6"
                  />
                )}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={dangChon ? 5 : 3.8}
                  fill={p.mau}
                />
                <text
                  x={p.x}
                  y="120"
                  textAnchor="middle"
                  fill={dangChon ? "#E5C76B" : "#94A3B8"}
                  fontSize="9.5"
                  fontWeight={dangChon ? "700" : "500"}
                >
                  {nhanThang.slice(0, 7)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Chi tiết tháng đang chọn trên sóng nhịp */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold/35 bg-bg/80 px-3.5 py-2.5 text-xs"
        data-testid="chi-tiet-nhip-thang"
        aria-live="polite"
      >
        <div className="flex flex-wrap items-center gap-2">
          <CalendarClock className="size-3.5 text-gold" aria-hidden />
          <span className="font-semibold text-fg">{thangDangChon.thang}</span>
          <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", chNhip.chuClass)}>
            {thangDangChon.nhan_nhip}
          </span>
        </div>
        {thangDangChon.goi_y && (
          <p className="text-xs leading-snug text-fg-muted">{thangDangChon.goi_y}</p>
        )}
      </div>
    </div>
  );
}
