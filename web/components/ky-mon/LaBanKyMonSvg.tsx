"use client";
// La bàn Kỳ Môn 8 hướng bát giác (Bắc · Khảm 1 ở đỉnh 0°, thuận chiều kim đồng hồ).
// Bất biến bảng màu: Tuyệt đối KHÔNG dùng sắc đỏ; dùng Jade (#34D399), Slate (#94A3B8), Amber (rgb(245 170 80) / #FBBF24), Gold (#E5C76B), Moon (#7DD3FC).
import type { BanKM, HuongKM, MucKM } from "@/lib/ky-mon";

interface CauHinhCungLaBan {
  cung: number;
  goc: number;
  nhanCung: string;
  nhanDo: string;
}

const TAM_HUONG_LA_BAN: readonly CauHinhCungLaBan[] = [
  { cung: 1, goc: 0, nhanCung: "Bắc · Khảm 1", nhanDo: "0°" },
  { cung: 8, goc: 45, nhanCung: "Đông Bắc · Cấn 8", nhanDo: "45°" },
  { cung: 3, goc: 90, nhanCung: "Đông · Chấn 3", nhanDo: "90°" },
  { cung: 4, goc: 135, nhanCung: "Đông Nam · Tốn 4", nhanDo: "135°" },
  { cung: 9, goc: 180, nhanCung: "Nam · Ly 9", nhanDo: "180°" },
  { cung: 2, goc: 225, nhanCung: "Tây Nam · Khôn 2", nhanDo: "225°" },
  { cung: 7, goc: 270, nhanCung: "Tây · Đoài 7", nhanDo: "270°" },
  { cung: 6, goc: 315, nhanCung: "Tây Bắc · Càn 6", nhanDo: "315°" },
] as const;

const SAC_LA_BAN: Record<
  MucKM,
  { nen: string; vien: string; chu: string; cham: string }
> = {
  thuan: {
    nen: "rgba(52, 211, 153, 0.15)",
    vien: "rgba(52, 211, 153, 0.72)",
    chu: "#34D399",
    cham: "#34D399",
  },
  binh: {
    nen: "rgba(148, 163, 184, 0.09)",
    vien: "rgba(148, 163, 184, 0.38)",
    chu: "#94A3B8",
    cham: "#94A3B8",
  },
  cham: {
    nen: "rgba(245, 170, 80, 0.13)",
    vien: "rgba(245, 170, 80, 0.65)",
    chu: "rgb(245, 170, 80)",
    cham: "rgb(245, 170, 80)",
  },
};

function diemTheoGoc(cx: number, cy: number, r: number, gocDo: number): { x: number; y: number } {
  const rad = (gocDo * Math.PI) / 180;
  return {
    x: Number((cx + r * Math.sin(rad)).toFixed(2)),
    y: Number((cy - r * Math.cos(rad)).toFixed(2)),
  };
}

function duongMiengBatGiac(cx: number, cy: number, rTrong: number, rNgoai: number, gocTam: number): string {
  const g1 = gocTam - 21.2;
  const g2 = gocTam + 21.2;
  const p1 = diemTheoGoc(cx, cy, rTrong, g1);
  const p2 = diemTheoGoc(cx, cy, rNgoai, g1);
  const p3 = diemTheoGoc(cx, cy, rNgoai, g2);
  const p4 = diemTheoGoc(cx, cy, rTrong, g2);
  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`;
}

function diemBatGiac(cx: number, cy: number, r: number): string {
  return Array.from({ length: 8 }, (_, i) => {
    const p = diemTheoGoc(cx, cy, r, i * 45 - 22.5);
    return `${p.x},${p.y}`;
  }).join(" ");
}

export function LaBanKyMonSvg({
  ban,
  huongMap,
  dangXemCung,
  viecCung,
  chuyenSau,
  onChonCung,
}: {
  ban: BanKM["ban"];
  huongMap: Map<number, HuongKM>;
  dangXemCung: number | null;
  viecCung?: number;
  chuyenSau: boolean;
  onChonCung: (cung: number, muc: MucKM) => void;
}) {
  const cx = 230;
  const cy = 230;
  const rTrong = 66;
  const rNgoai = 186;
  const rNhanNgoai = 207;

  return (
    <div className="overflow-hidden rounded-2xl border border-line/70 bg-bg/75 p-2 sm:p-3">
      <svg
        viewBox="0 0 460 460"
        className="mx-auto h-auto w-full max-w-[440px] select-none"
        data-testid="la-ban-ky-mon-svg"
        role="group"
        aria-label="La bàn Kỳ Môn 8 hướng bát giác, Bắc ở đỉnh 0 độ"
      >
        <defs>
          <radialGradient id="km-compass-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E5C76B" stopOpacity="0.16" />
            <stop offset="65%" stopColor="#7DD3FC" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#0B1020" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Vòng hào quang nền */}
        <circle cx={cx} cy={cy} r="218" fill="url(#km-compass-glow)" />
        <circle
          cx={cx}
          cy={cy}
          r="214"
          fill="none"
          stroke="#94A3B8"
          strokeOpacity="0.22"
          strokeDasharray="2 4"
        />

        {/* Khung bát giác ngoài */}
        <polygon
          points={diemBatGiac(cx, cy, 192)}
          fill="none"
          stroke="#E5C76B"
          strokeOpacity="0.25"
          strokeWidth="1.2"
        />

        {/* Nhãn độ phương vị quanh vành la bàn */}
        {TAM_HUONG_LA_BAN.map((cfg) => {
          const pDo = diemTheoGoc(cx, cy, rNhanNgoai, cfg.goc);
          const laViec = viecCung === cfg.cung;
          return (
            <text
              key={`do-${cfg.cung}`}
              x={pDo.x}
              y={pDo.y + 3.5}
              textAnchor="middle"
              fill={laViec ? "#E5C76B" : "#7DD3FC"}
              fillOpacity={laViec ? 1 : 0.78}
              fontSize="10"
              fontWeight="600"
            >
              {cfg.nhanDo}
            </text>
          );
        })}

        {/* 8 cung hướng bát giác */}
        {TAM_HUONG_LA_BAN.map((cfg) => {
          const h = huongMap.get(cfg.cung);
          if (!h) return null;
          const sac = SAC_LA_BAN[h.muc];
          const chon = dangXemCung === cfg.cung;
          const laViec = viecCung === cfg.cung;
          const dPath = duongMiengBatGiac(cx, cy, rTrong, rNgoai, cfg.goc);
          const dViecRing = duongMiengBatGiac(cx, cy, rTrong - 3, rNgoai + 4, cfg.goc);

          // Tọa độ tâm chữ trong miếng cung
          const pPhuong = diemTheoGoc(cx, cy, 156, cfg.goc);
          const pCua = diemTheoGoc(cx, cy, 128, cfg.goc);
          const pMuc = diemTheoGoc(cx, cy, 104, cfg.goc);
          const pChuyenSau = diemTheoGoc(cx, cy, 84, cfg.goc);

          const saoRutGon = h.sao.ten.replace("Thiên ", "");
          const kyHienThi = h.ky && h.ky.length > 0 ? ` · ${h.ky.join("/")}` : "";

          return (
            <g
              key={cfg.cung}
              role="button"
              tabIndex={0}
              data-cung={cfg.cung}
              data-muc={h.muc}
              data-viec-cung={laViec ? "true" : undefined}
              aria-pressed={chon}
              aria-label={`${cfg.nhanCung} (${cfg.nhanDo}): ${h.cua.ten} - ${h.muc_nhan}`}
              onClick={() => onChonCung(cfg.cung, h.muc)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onChonCung(cfg.cung, h.muc);
                }
              }}
              className="cursor-pointer focus:outline-none"
            >
              {/* Vòng vàng gợi ý cho cung hợp việc đang chọn */}
              {laViec && (
                <path
                  d={dViecRing}
                  fill="none"
                  stroke="#E5C76B"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                />
              )}

              <path
                d={dPath}
                fill={sac.nen}
                stroke={chon ? "#E5C76B" : sac.vien}
                strokeWidth={chon ? 2.6 : 1.4}
              />

              {/* Tên hướng · quẻ · cung */}
              <text
                x={pPhuong.x}
                y={pPhuong.y}
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="9"
                fontWeight="600"
              >
                {cfg.nhanCung}
              </text>

              {/* Tên Bát Môn (Cửa) */}
              <text
                x={pCua.x}
                y={pCua.y + 3}
                textAnchor="middle"
                fill="#F8FAFC"
                fontSize="13"
                fontWeight="700"
              >
                {h.cua.ten}
              </text>

              {/* Nhãn mức & dấu Kỳ nổi bật */}
              <text
                x={pMuc.x}
                y={pMuc.y + 3}
                textAnchor="middle"
                fill={sac.chu}
                fontSize="9.5"
                fontWeight="600"
              >
                {h.muc_nhan}
                {h.noi_bat ? " ★" : ""}
              </text>

              {/* Sao · Thần · Kỳ khi bật chế độ chuyên sâu */}
              {chuyenSau && (
                <text
                  x={pChuyenSau.x}
                  y={pChuyenSau.y + 3}
                  textAnchor="middle"
                  fill="#7DD3FC"
                  fontSize="8"
                  fontWeight="500"
                >
                  {saoRutGon} · {h.than.ten}
                  {kyHienThi}
                </text>
              )}
            </g>
          );
        })}

        {/* Trung Cung 5 ở chính giữa la bàn */}
        <g data-testid="km-la-ban-trung-cung">
          <polygon
            points={diemBatGiac(cx, cy, 58)}
            fill="rgba(15, 23, 42, 0.95)"
            stroke="#E5C76B"
            strokeOpacity="0.65"
            strokeWidth="1.5"
          />
          <circle
            cx={cx}
            cy={cy}
            r="46"
            fill="none"
            stroke="#7DD3FC"
            strokeOpacity="0.25"
            strokeDasharray="2 3"
          />
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            fill="#7DD3FC"
            fontSize="9"
            fontWeight="600"
            letterSpacing="0.04em"
          >
            TRUNG CUNG 5
          </text>
          <text
            x={cx}
            y={cy + 3}
            textAnchor="middle"
            fill="#F8FAFC"
            fontSize="12"
            fontWeight="700"
          >
            {ban.am_duong === "duong" ? "Dương" : "Âm"} độn · {ban.cuc} cục
          </text>
          <text
            x={cx}
            y={cy + 19}
            textAnchor="middle"
            fill="#E5C76B"
            fontSize="9"
          >
            {ban.tiet.ten}
          </text>
        </g>
      </svg>
    </div>
  );
}
