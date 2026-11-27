"use client";
// Chặng 4.2 — Vòng tròn Bản đồ sao 12 Cung Hoàng đạo SVG phong cách Đêm sao (vàng kim · ngọc bích · lam đêm, 0% sắc đỏ).
import { useMemo } from "react";

export interface HanhTinhBieuDo {
  ma: string;
  ten: string;
  ky_hieu: string;
  kinh_do: number;
  do_cung: number;
  cung_ten: string;
  nghich_hanh: boolean;
}

export interface GocChieuBieuDo {
  diem_1: string;
  diem_2: string;
  loai: string;
  tinh_chat: "thuan_nhip" | "co_xat_truong_thanh" | "hoi_tu";
}

const CUNG_12: { ma: string; ky: string; ten: string }[] = [
  { ma: "bach_duong", ky: "♈", ten: "Bạch Dương" },
  { ma: "kim_nguu", ky: "♉", ten: "Kim Ngưu" },
  { ma: "song_tu", ky: "♊", ten: "Song Tử" },
  { ma: "cu_giai", ky: "♋", ten: "Cự Giải" },
  { ma: "su_tu", ky: "♌", ten: "Sư Tử" },
  { ma: "xu_nu", ky: "♍", ten: "Xử Nữ" },
  { ma: "thien_binh", ky: "♎", ten: "Thiên Bình" },
  { ma: "bo_cap", ky: "♏", ten: "Bọ Cạp" },
  { ma: "nhan_ma", ky: "♐", ten: "Nhân Mã" },
  { ma: "ma_ket", ky: "♑", ten: "Ma Kết" },
  { ma: "bao_binh", ky: "♒", ten: "Bảo Bình" },
  { ma: "song_ngu", ky: "♓", ten: "Song Ngư" },
];

// Quy ước chiêm tinh chuẩn: Điểm Mọc (Ascendant) đặt tại hướng 9 giờ (180° SVG), hoàng đạo chạy ngược chiều kim đồng hồ.
function doiGocSvg(kinhDo: number, gocAsc: number): number {
  const lech = ((kinhDo - gocAsc) % 360 + 360) % 360;
  return (180 - lech + 360) % 360;
}

function toaDo(cx: number, cy: number, r: number, gocDeg: number): { x: number; y: number } {
  const rad = (gocDeg * Math.PI) / 180;
  return {
    x: Number((cx + r * Math.cos(rad)).toFixed(2)),
    y: Number((cy + r * Math.sin(rad)).toFixed(2)),
  };
}

export function BanDoSaoSvg({
  hanhTinh,
  gocChieu,
  ascKinhDo,
  mcKinhDo,
  nha,
  dangChon,
  onChonHanhTinh,
}: {
  hanhTinh: HanhTinhBieuDo[];
  gocChieu: GocChieuBieuDo[];
  ascKinhDo?: number | null;
  mcKinhDo?: number | null;
  nha?: { so: number; kinh_do: number }[] | null;
  dangChon?: string | null;
  onChonHanhTinh?: (ma: string) => void;
}) {
  const cx = 230;
  const cy = 230;
  const rNgoai = 212;
  const rCungTrong = 178;
  const rHanhTinhChinh = 144;
  const rNhaTrong = 98;
  const gocGoc = ascKinhDo ?? 0;

  // Tách bán kính nhẹ khi nhiều hành tinh đứng sát nhau (< 7°) để ký hiệu không đè chữ
  const viTriHanhTinh = useMemo(() => {
    const sx = [...hanhTinh].sort((a, b) => a.kinh_do - b.kinh_do);
    const mapTang = new Map<string, number>();
    let tang = 0;
    for (let i = 0; i < sx.length; i++) {
      const cur = sx[i]!;
      const prev = i > 0 ? sx[i - 1] : null;
      if (prev && Math.abs(cur.kinh_do - prev.kinh_do) < 7.5) {
        tang = (tang + 1) % 3;
      } else {
        tang = 0;
      }
      mapTang.set(cur.ma, tang);
    }
    return hanhTinh.map((p) => {
      const t = mapTang.get(p.ma) ?? 0;
      const r = rHanhTinhChinh - t * 18;
      const goc = doiGocSvg(p.kinh_do, gocGoc);
      return { ...p, gocSvg: goc, pos: toaDo(cx, cy, r, goc), posTam: toaDo(cx, cy, rNhaTrong, goc) };
    });
  }, [hanhTinh, gocGoc]);

  const traDiemTam = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>();
    for (const p of viTriHanhTinh) m.set(p.ma, p.posTam);
    if (ascKinhDo != null) m.set("asc", toaDo(cx, cy, rNhaTrong, doiGocSvg(ascKinhDo, gocGoc)));
    if (mcKinhDo != null) m.set("mc", toaDo(cx, cy, rNhaTrong, doiGocSvg(mcKinhDo, gocGoc)));
    return m;
  }, [viTriHanhTinh, ascKinhDo, mcKinhDo, gocGoc]);

  return (
    <div className="mx-auto w-full max-w-[460px]" data-testid="ban-do-sao-svg">
      <svg
        viewBox="0 0 460 460"
        role="img"
        aria-label="Vòng tròn Bản đồ sao 12 Cung Hoàng đạo"
        className="h-auto w-full select-none rounded-full border border-line/60 bg-bg/85 shadow-inner"
      >
        <defs>
          <radialGradient id="dem-sao-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(212, 175, 55, 0.08)" />
            <stop offset="70%" stopColor="rgba(15, 23, 42, 0.5)" />
            <stop offset="100%" stopColor="rgba(9, 13, 24, 0.95)" />
          </radialGradient>
        </defs>

        <circle cx={cx} cy={cy} r={rNgoai} fill="url(#dem-sao-bg)" stroke="rgba(212,175,55,0.4)" strokeWidth={1.2} />
        <circle cx={cx} cy={cy} r={rCungTrong} fill="none" stroke="rgba(212,175,55,0.28)" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={rNhaTrong} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth={1} />

        {/* 12 Vách ngăn & Ký hiệu Cung Hoàng đạo */}
        {CUNG_12.map((c, idx) => {
          const gocDau = doiGocSvg(idx * 30, gocGoc);
          const gocGiua = doiGocSvg(idx * 30 + 15, gocGoc);
          const p1 = toaDo(cx, cy, rCungTrong, gocDau);
          const p2 = toaDo(cx, cy, rNgoai, gocDau);
          const pChu = toaDo(cx, cy, (rNgoai + rCungTrong) / 2, gocGiua);
          return (
            <g key={c.ma}>
              <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(212,175,55,0.3)" strokeWidth={1} />
              <text
                x={pChu.x}
                y={pChu.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#E5C76B"
                fontSize="15"
              >
                <title>{c.ten}</title>
                {c.ky}
              </text>
            </g>
          );
        })}

        {/* 12 Đỉnh nhà (khi có giờ sinh) */}
        {nha?.map((n) => {
          const g = doiGocSvg(n.kinh_do, gocGoc);
          const p1 = toaDo(cx, cy, rNhaTrong, g);
          const p2 = toaDo(cx, cy, rCungTrong, g);
          const pSo = toaDo(cx, cy, rNhaTrong + 13, doiGocSvg(n.kinh_do + 12, gocGoc));
          const laTrucChinh = n.so === 1 || n.so === 4 || n.so === 7 || n.so === 10;
          return (
            <g key={`nha-${n.so}`}>
              <line
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={laTrucChinh ? "rgba(212,175,55,0.75)" : "rgba(148,163,184,0.22)"}
                strokeWidth={laTrucChinh ? 1.6 : 0.9}
                strokeDasharray={laTrucChinh ? undefined : "3 3"}
              />
              <text x={pSo.x} y={pSo.y} textAnchor="middle" dominantBaseline="central" fill="rgba(148,163,184,0.7)" fontSize="9.5">
                {n.so}
              </text>
            </g>
          );
        })}

        {/* Nhãn trục Asc & MC */}
        {ascKinhDo != null && (() => {
          const pAsc = toaDo(cx, cy, rCungTrong - 10, doiGocSvg(ascKinhDo, gocGoc));
          return (
            <text x={pAsc.x} y={pAsc.y} textAnchor="middle" dominantBaseline="central" fill="#D4AF37" fontSize="9.5" fontWeight="700">
              ASC
            </text>
          );
        })()}
        {mcKinhDo != null && (() => {
          const pMc = toaDo(cx, cy, rCungTrong - 10, doiGocSvg(mcKinhDo, gocGoc));
          return (
            <text x={pMc.x} y={pMc.y} textAnchor="middle" dominantBaseline="central" fill="#34D399" fontSize="9.5" fontWeight="700">
              MC
            </text>
          );
        })()}

        {/* Dây cung Góc chiếu trong tâm vòng */}
        {gocChieu.map((gc, idx) => {
          const a = traDiemTam.get(gc.diem_1);
          const b = traDiemTam.get(gc.diem_2);
          if (!a || !b) return null;
          const mau =
            gc.tinh_chat === "thuan_nhip"
              ? "rgba(52, 211, 153, 0.52)"
              : gc.tinh_chat === "hoi_tu"
                ? "rgba(212, 175, 55, 0.65)"
                : "rgba(251, 191, 36, 0.48)";
          return (
            <line
              key={`${gc.diem_1}-${gc.diem_2}-${idx}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={mau}
              strokeWidth={dangChon && (gc.diem_1 === dangChon || gc.diem_2 === dangChon) ? 2.1 : 1.05}
              strokeDasharray={gc.tinh_chat === "co_xat_truong_thanh" ? "4 3" : undefined}
            />
          );
        })}

        {/* 13 Thiên thể */}
        {viTriHanhTinh.map((p) => {
          const isSel = dangChon === p.ma;
          return (
            <g
              key={p.ma}
              onClick={() => onChonHanhTinh?.(p.ma)}
              className="cursor-pointer"
            >
              <line x1={p.posTam.x} y1={p.posTam.y} x2={p.pos.x} y2={p.pos.y} stroke="rgba(212,175,55,0.2)" strokeWidth={0.8} pointerEvents="none" />
              <circle
                data-testid={`svg-ht-${p.ma}`}
                cx={p.pos.x}
                cy={p.pos.y}
                r={isSel ? 13 : 11}
                fill={isSel ? "rgba(212,175,55,0.28)" : "rgba(15,23,42,0.92)"}
                stroke={isSel ? "#D4AF37" : "rgba(212,175,55,0.5)"}
                strokeWidth={isSel ? 1.8 : 1}
              />
              <text x={p.pos.x} y={p.pos.y} textAnchor="middle" dominantBaseline="central" fill="#F8FAFC" fontSize="12" pointerEvents="none">
                <title>{`${p.ten}: ${p.do_cung}° ${p.cung_ten}${p.nghich_hanh ? " (R)" : ""}`}</title>
                {p.ky_hieu}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
