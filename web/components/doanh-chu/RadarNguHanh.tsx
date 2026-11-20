"use client";
// Radar 5 Hành Đội Ngũ — SVG thuần chuẩn "Đêm sao phương Đông", không kéo thêm thư viện chart,
// 100% vẽ từ dữ liệu engine (`can_bang_ngu_hanh`), tôn trọng `prefers-reduced-motion`.
import { useState } from "react";
import { CHU_DOANH_CHU } from "@/lib/chu/doanh-chu";
import type { CanBangNguHanh, OngChuTomTat, ThanhVienMaTran } from "@/lib/doanh-chu";

const THU_TU_5_HANH = ["Mộc", "Hỏa", "Thổ", "Kim", "Thủy"] as const;

const MAU_HANH: Record<string, { fill: string; stroke: string; text: string; bg: string }> = {
  Mộc: { fill: "rgba(111, 211, 181, 0.25)", stroke: "rgb(111, 211, 181)", text: "text-jade", bg: "bg-jade/15 border-jade/40" },
  Hỏa: { fill: "rgba(239, 138, 111, 0.25)", stroke: "rgb(239, 138, 111)", text: "text-[#ef8a6f]", bg: "bg-[#ef8a6f]/15 border-[#ef8a6f]/40" },
  Thổ: { fill: "rgba(233, 196, 106, 0.25)", stroke: "rgb(233, 196, 106)", text: "text-gold", bg: "bg-gold/15 border-gold/40" },
  Kim: { fill: "rgba(226, 232, 240, 0.22)", stroke: "rgb(226, 232, 240)", text: "text-fg", bg: "bg-surface-2/80 border-line" },
  Thủy: { fill: "rgba(185, 167, 255, 0.25)", stroke: "rgb(185, 167, 255)", text: "text-moon", bg: "bg-moon/15 border-moon/40" },
};

const CX = 180;
const CY = 175;
const R_MAX = 112;

function toaDo(chiSo: number, tyLe: number): [number, number] {
  const goc = -Math.PI / 2 + (chiSo * 2 * Math.PI) / 5;
  const r = R_MAX * Math.max(0.08, Math.min(1, tyLe));
  return [CX + r * Math.cos(goc), CY + r * Math.sin(goc)];
}

export function RadarNguHanh({
  canBang,
  ongChu,
  thanhVien,
}: {
  canBang: CanBangNguHanh;
  ongChu: OngChuTomTat;
  thanhVien: ThanhVienMaTran[];
}) {
  const [hanhChon, setHanhChon] = useState<string>(canBang.hanh_thieu || canBang.hanh_troi || "Mộc");

  // Chuẩn hóa bán kính hiển thị theo đỉnh cao nhất để ngũ giác luôn rõ hình khối (tỷ lệ thực % vẫn giữ nguyên từ engine).
  const giaTri = THU_TU_5_HANH.map((h) => canBang.ty_le_5_hanh[h] ?? 0);
  const dinhCao = Math.max(0.35, ...giaTri);

  const diemDaGiac = THU_TU_5_HANH.map((h, i) => {
    const [x, y] = toaDo(i, (canBang.ty_le_5_hanh[h] ?? 0) / dinhCao);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  const nguoiGanhHanh = [
    ...(ongChu.hanh_manh === hanhChon ? [{ ten: ongChu.ten, vaiTro: "Chủ doanh nghiệp" }] : []),
    ...thanhVien
      .filter((tv) => tv.chi_so.hanh_manh === hanhChon)
      .map((tv) => ({ ten: tv.ten, vaiTro: tv.vai_tro_hien_tai || tv.vai_tro_goi_y })),
  ];

  const tyLeChon = Math.round((canBang.ty_le_5_hanh[hanhChon] ?? 0) * 100);
  const mauChon = MAU_HANH[hanhChon] ?? MAU_HANH.Mộc;

  return (
    <section className="bau-troi p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-jade">{CHU_DOANH_CHU.radar.nho}</p>
          <h2 className="mt-1 font-serif text-2xl text-fg">{CHU_DOANH_CHU.radar.tieu_de}</h2>
          <p className="mt-1 text-sm text-fg-muted">{CHU_DOANH_CHU.radar.phu_de}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/10 px-3.5 py-1.5 text-xs text-gold">
          <span>{CHU_DOANH_CHU.radar.ong_chu_can_bu}:</span>
          <strong className="font-semibold">{ongChu.hanh_can_bu}</strong>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr] lg:items-center">
        {/* SVG Ngũ Hành Động */}
        <div className="relative mx-auto w-full max-w-[360px]">
          <svg
            viewBox="0 0 360 350"
            className="h-auto w-full overflow-visible"
            role="img"
            aria-label={CHU_DOANH_CHU.radar.tieu_de}
          >
            <defs>
              <radialGradient id="dc-radar-fill" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="rgb(111, 211, 181)" stopOpacity="0.42" />
                <stop offset="100%" stopColor="rgb(233, 196, 106)" stopOpacity="0.14" />
              </radialGradient>
              <filter id="dc-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Vòng quỹ đạo tương sinh xoay rất chậm (tắt khi reduced-motion) */}
            <circle
              cx={CX}
              cy={CY}
              r={R_MAX + 22}
              fill="none"
              stroke="rgba(233, 196, 106, 0.2)"
              strokeWidth="1"
              strokeDasharray="4 7"
              className="origin-[180px_175px] motion-safe:animate-[spin_90s_linear_infinite]"
            />

            {/* 4 lớp ngũ giác dẫn hướng đồng tâm */}
            {[0.25, 0.5, 0.75, 1].map((lv) => {
              const pts = THU_TU_5_HANH.map((_, i) => {
                const [x, y] = toaDo(i, lv);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(" ");
              return (
                <polygon
                  key={lv}
                  points={pts}
                  fill="none"
                  stroke="rgba(179, 177, 207, 0.16)"
                  strokeWidth={lv === 1 ? 1.2 : 0.8}
                />
              );
            })}

            {/* 5 trục nối từ tâm tới từng hành */}
            {THU_TU_5_HANH.map((h, i) => {
              const [x, y] = toaDo(i, 1);
              return (
                <line
                  key={h}
                  x1={CX}
                  y1={CY}
                  x2={x}
                  y2={y}
                  stroke={h === hanhChon ? "rgba(233, 196, 106, 0.55)" : "rgba(179, 177, 207, 0.18)"}
                  strokeWidth={h === hanhChon ? 1.5 : 1}
                  className="transition-colors duration-300"
                />
              );
            })}

            {/* Đa giác năng lượng đội ngũ */}
            <polygon
              points={diemDaGiac}
              fill="url(#dc-radar-fill)"
              stroke="rgb(111, 211, 181)"
              strokeWidth="2.2"
              strokeLinejoin="round"
              filter="url(#dc-glow)"
              className="transition-all duration-700 ease-out"
            />

            {/* Các đỉnh hành tương tác */}
            {THU_TU_5_HANH.map((h, i) => {
              const val = canBang.ty_le_5_hanh[h] ?? 0;
              const pct = Math.round(val * 100);
              const [vx, vy] = toaDo(i, val / dinhCao);
              const [lx, ly] = toaDo(i, 1.26);
              const laTroi = h === canBang.hanh_troi;
              const laThieu = h === canBang.hanh_thieu;
              const laDangChon = h === hanhChon;
              const mau = MAU_HANH[h] ?? MAU_HANH.Mộc;

              return (
                <g
                  key={h}
                  onClick={() => setHanhChon(h)}
                  onMouseEnter={() => setHanhChon(h)}
                  className="cursor-pointer focus:outline-none"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setHanhChon(h);
                    }
                  }}
                  aria-label={`${h} ${pct}%`}
                >
                  {/* Vòng sóng thở nhẹ cho hành trội (jade) hoặc hành thiếu (gold) */}
                  {(laTroi || laThieu) && (
                    <circle
                      cx={vx}
                      cy={vy}
                      r={laDangChon ? 13 : 10}
                      fill="none"
                      stroke={laTroi ? "rgb(111, 211, 181)" : "rgb(240, 179, 92)"}
                      strokeWidth="1.5"
                      strokeOpacity="0.65"
                      className="motion-safe:animate-pulse"
                    />
                  )}

                  <circle
                    cx={vx}
                    cy={vy}
                    r={laDangChon ? 6.5 : 4.8}
                    fill={mau.stroke}
                    stroke="rgb(10, 10, 23)"
                    strokeWidth="2"
                    className="transition-all duration-300"
                  />

                  {/* Nhãn hành & % ở ngoài đỉnh */}
                  <text
                    x={lx}
                    y={ly - 4}
                    textAnchor="middle"
                    className={`fill-current text-[13px] font-semibold transition-colors ${
                      laDangChon ? "text-gold" : "text-fg"
                    }`}
                  >
                    {h}
                  </text>
                  <text
                    x={lx}
                    y={ly + 12}
                    textAnchor="middle"
                    className="fill-current text-[11px] tabular-nums text-fg-muted"
                  >
                    {pct}%{laTroi ? " ★" : laThieu ? " !" : ""}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Bảng đọc nhanh & Soi hành đang chọn */}
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-jade/35 bg-jade/10 p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-jade">
                {CHU_DOANH_CHU.radar.hanh_troi}: {canBang.hanh_troi}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-fg">{canBang.nhan_xet_diem_manh}</p>
            </div>
            <div className="rounded-2xl border border-[rgb(245_170_80/0.35)] bg-[rgb(245_170_80/0.08)] p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[#f0b35c]">
                {CHU_DOANH_CHU.radar.hanh_thieu}: {canBang.hanh_thieu}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-fg">{canBang.nhan_xet_lo_hong}</p>
            </div>
          </div>

          {/* Hộp soi chi tiết đỉnh hành đang chọn */}
          <div className={`rounded-2xl border p-4 transition-all duration-300 ${mauChon.bg}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={`text-sm font-semibold ${mauChon.text}`}>
                {CHU_DOANH_CHU.radar.dang_chon} {hanhChon} · {tyLeChon}%
              </p>
              <span className="text-xs text-fg-muted">{CHU_DOANH_CHU.radar.truc_van_hanh[hanhChon] ?? ""}</span>
            </div>
            <div className="mt-3">
              <p className="text-xs text-fg-muted">{CHU_DOANH_CHU.radar.thanh_vien_ganh}:</p>
              {nguoiGanhHanh.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {nguoiGanhHanh.map((n, idx) => (
                    <span
                      key={`${n.ten}-${idx}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line/70 bg-surface/80 px-3 py-1 text-xs text-fg"
                    >
                      <strong className="font-medium">{n.ten}</strong>
                      <span className="text-fg-faint">· {n.vaiTro}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1.5 text-xs text-fg-muted">{CHU_DOANH_CHU.radar.chua_co_ai}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
